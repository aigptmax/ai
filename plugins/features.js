import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs-extra';
import path from 'path';
import {
    downloadContentFromMessage,
    jidNormalizedUser,
    generateWAMessageFromContent,
    generateMessageIDV2
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

const STICKERS_DIR = path.join(process.cwd(), 'data', 'saved_stickers');
const STORE_FILE = path.join(process.cwd(), 'data', 'saved_stickers.json');
const MAX_STICKER_BYTES = 1 * 1024 * 1024;

fs.ensureDirSync(STICKERS_DIR);

function loadSavedStickers() {
    try {
        if (fs.existsSync(STORE_FILE)) {
            return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) || { sticker: null };
        }
    } catch (_) {}
    return { sticker: null };
}

function persistStickers(store) {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    } catch (_) {}
}

function removeStickerFile(sticker) {
    if (sticker?.localFile) {
        try { fs.removeSync(path.join(STICKERS_DIR, sticker.localFile)); } catch (_) {}
    }
}

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (c) => chunks.push(c));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

function toBase64(data) {
    if (!data) return '';
    if (Buffer.isBuffer(data)) return data.toString('base64');
    if (data instanceof Uint8Array) return Buffer.from(data).toString('base64');
    return '';
}

function ensureBuffer(data) {
    if (!data) return Buffer.alloc(0);
    if (Buffer.isBuffer(data)) return data;
    if (typeof data === 'string') {
        try { return Buffer.from(data, 'base64'); } catch (_) { return Buffer.alloc(0); }
    }
    if (data instanceof Uint8Array) return Buffer.from(data);
    return Buffer.alloc(0);
}

cmd({
    pattern: "sts",
    alias: ["savesticker", "ss"],
    desc: "Save a sticker (max 1 MB)",
    category: "utility",
    react: "💾",
    filename: __filename
}, async (sock, msg, m, { from, reply, isCreator }) => {
    if (!isCreator) return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");

    try {
        const store = loadSavedStickers();

        let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted?.ephemeralMessage?.message) quoted = quoted.ephemeralMessage.message;
        if (quoted?.viewOnceMessage?.message) quoted = quoted.viewOnceMessage.message;
        if (quoted?.viewOnceMessageV2?.message) quoted = quoted.viewOnceMessageV2.message;

        const targetSticker = quoted?.stickerMessage || msg.message?.stickerMessage;

        if (!targetSticker) {
            return await sock.sendMessage(from, {
                text: `💾 *Save Sticker*\n\n📌 Reply to any sticker\n💾 Type: *.sts*\n📦 Max: 1 MB`
            }, { quoted: msg });
        }

        const declaredSize = targetSticker.fileLength ? Number(targetSticker.fileLength) : 0;

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        let stickerBuffer = null;
        try {
            const stream = await downloadContentFromMessage(targetSticker, 'sticker');
            stickerBuffer = await streamToBuffer(stream);
        } catch (dlErr) {
            console.warn('[StickerDownload Warning]:', dlErr.message);
            return await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
        }

        const actualSize = stickerBuffer?.length || declaredSize;

        if (actualSize > MAX_STICKER_BYTES) {
            return await sock.sendMessage(from, {
                text: `❌ *Sticker Too Big*\n\n📦 Size: ${(actualSize / 1024 / 1024).toFixed(2)} MB\n📏 Max: 1 MB`
            }, { quoted: msg });
        }

        if (store.sticker) {
            removeStickerFile(store.sticker);
            store.sticker = null;
        }

        const localFileName = `stk_${Date.now()}.webp`;
        const localFilePath = path.join(STICKERS_DIR, localFileName);

        try { await fs.writeFile(localFilePath, stickerBuffer); } catch (_) {}

        store.sticker = {
            url: targetSticker.url || '',
            fileSha256: toBase64(targetSticker.fileSha256),
            fileEncSha256: toBase64(targetSticker.fileEncSha256),
            mediaKey: toBase64(targetSticker.mediaKey),
            fileLength: actualSize,
            height: 512,
            width: 512,
            mimetype: targetSticker.mimetype || 'image/webp',
            directPath: targetSticker.directPath || '',
            isAnimated: !!targetSticker.isAnimated,
            isAvatar: !!targetSticker.isAvatar,
            isLottie: !!targetSticker.isLottie,
            savedAt: Date.now(),
            localFile: localFileName,
            savedByPushName: msg.pushName || ''
        };

        persistStickers(store);

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

        return await sock.sendMessage(from, {
            text: `✅ *Sticker Saved*\n\n📦 Size: ${(actualSize / 1024).toFixed(1)} KB\n\n⚡ *How to use .rs*\n📌 Reply to any message, then:\n\n• *.rs* → 20 reactions (default)\n• *.rs 10* → 10 reactions\n• *.rs 1* → 1 reaction\n\n📏 Range: 1 – 20`
        }, { quoted: msg });

    } catch (e) {
        console.error('[saveStickerCommand Error]:', e);
        return await sock.sendMessage(from, {
            text: `❌ *Error*\n\n${e.message || 'Unknown error'}`
        }, { quoted: msg });
    }
});

cmd({
    pattern: "rs",
    alias: ["sreact", "stickerreaction"],
    desc: "React with saved sticker",
    category: "utility",
    react: "⚡",
    filename: __filename
}, async (sock, msg, m, { from, args, reply, isCreator }) => {
    if (!isCreator) return reply("*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*");

    try {
        const rawArgs = (args || []).map(a => String(a).trim()).filter(Boolean);
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        const stanzaId = contextInfo?.stanzaId;
        const participant = contextInfo?.participant;
        const quotedMsgContent = contextInfo?.quotedMessage;

        if (!stanzaId) {
            return await sock.sendMessage(from, {
                text: `⚡ *Sticker Reaction*\n\n⚠️ Reply to a message first\n⚡ Default: *.rs* → 20x\n⚡ Custom: *.rs 1* → 1x\n⚡ Range: 1 – 20`
            }, { quoted: msg });
        }

        let count = 20;

        for (const arg of rawArgs) {
            const num = parseInt(arg, 10);
            if (!isNaN(num) && num > 0) count = num;
        }

        if (count < 1) count = 1;
        if (count > 20) count = 20;

        const isGroup = from.endsWith('@g.us');
        const myJid = sock.user?.id ? jidNormalizedUser(sock.user.id) : '';
        const myLid = sock.user?.lid ? jidNormalizedUser(sock.user.lid) : '';
        const quotedNorm = participant ? jidNormalizedUser(participant) : '';

        let isFromMe = false;
        if (quotedNorm) {
            if (quotedNorm === myJid || quotedNorm === myLid) isFromMe = true;
        } else if (!isGroup && msg.key.fromMe) {
            isFromMe = true;
        }

        let poolPayloads = [];

        if (quotedMsgContent?.stickerMessage) {
            const sm = quotedMsgContent.stickerMessage;
            poolPayloads = [{
                url: sm.url,
                fileSha256: ensureBuffer(sm.fileSha256),
                fileEncSha256: ensureBuffer(sm.fileEncSha256),
                mediaKey: ensureBuffer(sm.mediaKey),
                fileLength: sm.fileLength ? Number(sm.fileLength) : 134248,
                height: 512,
                width: 512,
                mimetype: sm.mimetype || 'image/webp',
                directPath: sm.directPath,
                isAnimated: !!sm.isAnimated
            }];
        } else {
            const store = loadSavedStickers();
            const s = store.sticker;
            if (!s) {
                return await sock.sendMessage(from, {
                    text: `⚠️ *No Sticker Saved*\n\n📭 Empty\n💾 Reply sticker with *.sts*`
                }, { quoted: msg });
            }

            poolPayloads = [{
                url: s.url || '',
                fileSha256: ensureBuffer(s.fileSha256),
                fileEncSha256: ensureBuffer(s.fileEncSha256),
                mediaKey: ensureBuffer(s.mediaKey),
                fileLength: s.fileLength || 134248,
                height: 512,
                width: 512,
                mimetype: s.mimetype || 'image/webp',
                directPath: s.directPath || '',
                isAnimated: !!s.isAnimated
            }];
        }

        await sock.sendMessage(from, { react: { text: '⚡', key: msg.key } }).catch(() => {});

        const targetKey = {
            remoteJid: from,
            fromMe: isFromMe,
            id: stanzaId,
            ...(isGroup && quotedNorm ? { participant: quotedNorm } : {})
        };

        for (let i = 0; i < count; i++) {
            try {
                await sock.relayMessage(from, {
                    messageContextInfo: {
                        messageAssociation: {
                            associationType: 11,
                            parentMessageKey: targetKey
                        }
                    },
                    stickerMessage: poolPayloads[0]
                }, {});
            } catch (sendErr) {
                console.error(`[StickerReact Error ${i + 1}]:`, sendErr.message);
            }

            if (i < count - 1) {
                await new Promise(r => setTimeout(r, 260));
            }
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[repeatReactCommand Error]:', e);
        return await sock.sendMessage(from, {
            text: `❌ *Error*\n\n${e.message || 'Unknown error'}`
        }, { quoted: msg });
    }
});

cmd({
    pattern: "paymsg",
    alias: ["pay", "payment"],
    desc: "Send a custom payment message to a group",
    category: "owner",
    filename: __filename
}, async (client, message, match, { from, isCreator, reply, text }) => {
    try {
        if (!isCreator) return await reply("*📛 Owner Only Command*");

        let inputText = typeof text === 'string' ? text : (typeof match === 'string' ? match : match?.text || "");
        const args = inputText.trim().split(/\s+/);

        if (args.length < 2) {
            return await reply("*🍁 Usage:* `.paymsg <grouplink> <message>`");
        }

        const groupLink = args[0];
        const noteText = args.slice(1).join(" ");

        const inviteMatch = groupLink.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        if (!inviteMatch) return await reply("❌ Invalid group link format.");

        const inviteCode = inviteMatch[1];
        let targetJid = null;

        try {
            const groupInfo = await client.groupGetInviteInfo(inviteCode);
            targetJid = groupInfo.id;
        } catch (e) {
            return await reply("❌ Failed to get group info. (Is the bot inside the group?)");
        }

        const randomAmount = Math.floor(Math.random() * 500) + 1;
        const scaledAmount = (randomAmount * 1000).toString();

        const paymentMessage = {
            requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                amount1000: scaledAmount,
                requestFrom: '0@s.whatsapp.net',
                noteMessage: {
                    extendedTextMessage: { text: noteText }
                },
                expiryTimestamp: '0',
                amount: {
                    value: scaledAmount,
                    offset: 1000,
                    currencyCode: 'USD'
                }
            }
        };

        const fullMessage = generateWAMessageFromContent(targetJid, paymentMessage, {
            userJid: client.user.id,
            messageId: generateMessageIDV2(client.user.id)
        });

        await client.relayMessage(targetJid, fullMessage.message, {
            messageId: fullMessage.key.id
        });

        await client.sendMessage(from, {
            react: {
                text: "✅",
                key: message.key
            }
        });

    } catch (error) {
        console.error("paymsg Error:", error);
        await reply(`💢 Error: ${error.message}`);
    }
});
