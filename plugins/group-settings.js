// JAWAD 

import { fileURLToPath } from 'url';
import config from '../config.js';
import { cmd } from '../command.js';
import { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } from '../lib/functions.js';
import converter from '../lib/converter.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
ffmpeg.setFfmpegPath(ffmpegPath.path);

// ========== ENCODED API URLS ==========
const FIRST_API_URL = Buffer.from('aHR0cHM6Ly9uZWtvcy5iZXN0L2FwaS92Mi8=', 'base64').toString('utf-8');
const SECOND_API_URL = Buffer.from('aHR0cHM6Ly9hcGkucHVycGJvdC5zaXRlL3YyL2ltZy9zZncv', 'base64').toString('utf-8');
const THIRD_API_URL = Buffer.from('aHR0cHM6Ly9hcGkub3Rha3VnaWZzLnh5ei9naWY/cmVhY3Rpb249', 'base64').toString('utf-8');
const FOURTH_API_URL = Buffer.from('aHR0cHM6Ly9uZWtvcy5saWZlL2FwaS92Mi9pbWcv', 'base64').toString('utf-8');

// ========== GET GIF ==========
async function getGifX(action) {
    const sources = [
        async () => (await axios.get(`${FIRST_API_URL}${action}`)).data?.results?.[0]?.url || null,
        async () => { const r = await axios.get(`${SECOND_API_URL}${action}/gif`); return (r.data?.error === false && r.data?.link) ? r.data.link : null; },
        async () => (await axios.get(`${THIRD_API_URL}${action}`)).data?.url || null,
        async () => (await axios.get(`${FOURTH_API_URL}${action}`)).data?.url || null
    ];
    for (const src of sources) {
        try { const url = await src(); if (url) return url; } catch (_) {}
    }
    return null;
}

// ========== GIF → VIDEO ==========
async function gifToVideo(gifBuffer) {
    const id = randomBytes(6).toString('hex');
    const gifPath = path.join(tmpdir(), `${id}.gif`);
    const mp4Path = path.join(tmpdir(), `${id}.mp4`);
    fs.writeFileSync(gifPath, gifBuffer);
    await new Promise((res, rej) => {
        ffmpeg(gifPath)
            .outputOptions(['-movflags faststart', '-pix_fmt yuv420p', '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'])
            .on('error', () => rej(new Error('GIF to video failed')))
            .on('end', res)
            .save(mp4Path);
    });
    const v = fs.readFileSync(mp4Path);
    fs.unlinkSync(gifPath); fs.unlinkSync(mp4Path);
    return v;
}

// ========== SEND GIF HELPER (with text fallback) ==========
async function sendGif(conn, from, action, caption, mentions, quoted) {
    try {
        const url = await getGifX(action);
        if (!url) {
            await conn.sendMessage(from, { text: caption, mentions: mentions.filter(Boolean) }, { quoted });
            return;
        }
        const gifBuffer = (await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })).data;
        const videoBuffer = await gifToVideo(Buffer.from(gifBuffer));
        await conn.sendMessage(from, {
            video: videoBuffer,
            caption,
            gifPlayback: true,
            mentions: mentions.filter(Boolean)
        }, { quoted });
    } catch (e) {
        console.error(`GIF error (${action}):`, e.message);
        try { await conn.sendMessage(from, { text: caption, mentions: mentions.filter(Boolean) }, { quoted }); } catch (_) {}
    }
}

// ==================== KICK COMMAND ====================
cmd({
    pattern: "kick",
    alias: ["k", "remove", "nital"],
    desc: "Remove a user from the group",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to remove someone.", [], mek);
        if (!isCreator && !isAdmins) return await sendGif(conn, from, "angry", "🔐 Only bot owner or group admins can use this command.", [], mek);

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await sendGif(conn, from, "confused", "❓ You did not give me a user to remove!", [], mek);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await sendGif(conn, from, "confused", "⚠️ Couldn't determine target user.", [], mek);

        if (users === botNumber || users === botNumber2) return await sendGif(conn, from, "nope", "🤖 I can't kick myself!", [], mek);
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await sendGif(conn, from, "nope", "👑 That's the owner! I can't remove them.", [], mek);

        await conn.groupParticipantsUpdate(from, [users], "remove");

        const caption = `*✅ Successfully removed @${users.split("@")[0]} from group.*`;
        await sendGif(conn, from, "kick", caption, [users], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to remove user. Something went wrong.", [], mek);
    }
});

// ==================== PROMOTE COMMAND ====================
cmd({
    pattern: "promote",
    alias: ["p", "giveadmin", "permote", "admin"],
    desc: "Promote a user to admin",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to promote someone.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only group admins or owner can use this command.", [], mek);

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await sendGif(conn, from, "confused", "❓ You did not give me a user to promote!", [], mek);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await sendGif(conn, from, "confused", "⚠️ Couldn't determine target user.", [], mek);

        if (users === botNumber || users === botNumber2) return await sendGif(conn, from, "nope", "🤖 I can't promote myself!", [], mek);
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await sendGif(conn, from, "smug", "👑 Owner is already super admin!", [], mek);

        await conn.groupParticipantsUpdate(from, [users], "promote");

        const caption = `*✅ Successfully Promoted @${users.split("@")[0]} to Admin.*`;
        await sendGif(conn, from, "highfive", caption, [users], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to promote. Something went wrong.", [], mek);
    }
});

// ==================== DEMOTE COMMAND ====================
cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    desc: "Demote a group admin",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to demote someone.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only group admins or owner can use this command.", [], mek);

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await sendGif(conn, from, "confused", "❓ You did not give me a user to demote!", [], mek);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await sendGif(conn, from, "confused", "⚠️ Couldn't determine target user.", [], mek);

        if (users === botNumber || users === botNumber2) return await sendGif(conn, from, "nope", "🤖 I can't demote myself!", [], mek);
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await sendGif(conn, from, "nope", "👑 I can't demote the owner!", [], mek);

        await conn.groupParticipantsUpdate(from, [users], "demote");

        const caption = `*✅ @${users.split("@")[0]} has been demoted to a normal member.*`;
        await sendGif(conn, from, "pat", caption, [users], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to demote. Something went wrong.", [], mek);
    }
});

// ==================== END GROUP (Kick All) COMMAND ====================
cmd({
    pattern: "end",
    alias: ["byeall", "kickall", "endgc", "nuke"],
    desc: "Removes all members from group except specified numbers",
    category: "group",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, botNumber2, botNumber, isGroup, sender, metadata, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to remove members.", [], mek);
        if (!isCreator) return await sendGif(conn, from, "angry", "🔐 Only bot owner can use this command.", [], mek);

        const ignoreJids = [botNumber2, botNumber, sender];
        const groupData = metadata || await conn.groupMetadata(from);
        const participants = groupData.participants || [];
        const targets = participants.filter(p => !ignoreJids.includes(p.id));
        const jids = targets.map(p => p.id);

        if (jids.length === 0) return await sendGif(conn, from, "shrug", "✅ No members to remove (everyone is excluded).", [], mek);

        await conn.groupParticipantsUpdate(from, jids, "remove");
        await sendGif(conn, from, "yeet", `✅ Successfully removed ${jids.length} member${jids.length > 1 ? 's' : ''} from the group.`, [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to remove members. I may not have admin permission.", [], mek);
    }
});

// ==================== SET GROUP PICTURE COMMAND ====================
cmd({
    pattern: "gcpp",
    alias: ["gpp", "fullppgc", "gcdp", "groupdp"],
    react: "🏙️",
    desc: "Set group profile picture (Owner only)",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isCreator) return await reply("🔐 Only the bot owner can use this command.");
        if (!isBotAdmins) return await reply("❌ I must be admin to change group picture.");

        if (!m.quoted) return await reply("*🍁 Please reply to an image with .gcpp*");

        const mtype = m.quoted.mtype;
        if (mtype !== "imageMessage") return await reply("❌ Only image messages are supported for group picture");

        const buffer = await m.quoted.download();
        await conn.updateProfilePicture(from, buffer);
        await reply("*✅ Group profile picture updated successfully!*");

    } catch (error) {
        console.error("setgcpp Error:", error);
        await reply("❌ Error updating group picture:\n" + error.message);
    }
});

// ==================== EVERYONE COMMAND ====================
cmd({
    pattern: "everyone",
    react: "🔊",
    alias: ["all"],
    desc: "To mention all group members with new @all format",
    category: "group",
    use: '.everyone [message]',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isAdmins, isCreator, command, body }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);
        
        if (!isGroup) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ This command can only be used in groups.");
        }

        if (!isAdmins && !isCreator) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Only group admins or the bot owner can use this command.");
        }

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let teks = `@all ${message}`;

        await conn.sendMessage(from, { 
            text: teks,
            contextInfo: {
                nonJidMentions: 1,
                mentionedJid: [],
                groupMentions: []
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Everyone Command Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// ==================== UNMUTE COMMAND ====================
cmd({
    pattern: "unmute",
    alias: ["unlock", "open"],
    desc: "Unmute the group (admins only)",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to unmute the group.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only group admins or owner can use this command.", [], mek);

        await conn.groupSettingUpdate(from, 'not_announcement');
        await sendGif(conn, from, "happy", "*🔊 Group has been unmuted!*\nEveryone can send messages now.", [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to unmute group. Something went wrong.", [], mek);
    }
});

// ==================== MUTE COMMAND ====================
cmd({
    pattern: "mute",
    alias: ["close", "lock"],
    desc: "Mute the group (admins only)",
    category: "group",
    react: "🔇",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to mute the group.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only group admins or owner can use this command.", [], mek);

        await conn.groupSettingUpdate(from, 'announcement');
        await sendGif(conn, from, "sleep", "*🔇 Group has been muted!*\nOnly admins can send messages now.", [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to mute group. Something went wrong.", [], mek);
    }
});

// ==================== TAGALL COMMAND ====================
cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["gc_tagall"],
    desc: "To Tag all Members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
}, async (conn, mek, m, { from, participants, reply, isGroup, isAdmins, isCreator, prefix, command, args, body }) => {
    try {
        if (!isGroup) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ This command can only be used in groups.");
        }

        if (!isAdmins && !isCreator) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ Only group admins or the bot owner can use this command.");
        }

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ Failed to fetch group information.");

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply("❌ No members found in this group.");

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤‍🩹', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let teks = `▢ Group : *${groupName}*\n▢ Members : *${totalMembers}*\n▢ Message: *${message}*\n\n┌───⊷ *MENTIONS*\n`;

        for (let mem of participants) {
            if (!mem.id) continue;
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }

        teks += "└──✪ JAWAD ┃ MD ✪──";

        conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// ==================== GROUP INFO COMMAND ====================
cmd({
    pattern: "ginfo",
    alias: ["groupinfo"],
    desc: "Get group information",
    category: "group",
    react: "🥏",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply, metadata, participants }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to fetch group info.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can use this command.");

        const groupData = metadata || await conn.groupMetadata(from);
        const groupAdmins = participants?.filter(p => p.admin) || [];
        let description = groupData.desc || 'No description';
        
        let text = `*「 Group Information 」*\n\n`;
        text += `*Name:* ${groupData.subject}\n`;
        text += `*ID:* ${groupData.id}\n`;
        text += `*Participants:* ${groupData.size}\n`;
        text += `*Created:* ${new Date(groupData.creation * 1000).toLocaleString()}\n\n`;
        text += `*Description:*\n${description}\n\n`;
        text += `*Admins (${groupAdmins.length}):*\n`;
        
        groupAdmins.forEach((admin, i) => {
            text += `${i+1}. @${admin.id.split('@')[0]}\n`;
        });

        try {
            const ppUrl = await conn.profilePictureUrl(from, 'image');
            await conn.sendMessage(from, {
                image: { url: ppUrl },
                caption: text,
                mentions: groupAdmins.map(a => a.id)
            }, { quoted: mek });
        } catch {
            await reply(text, { mentions: groupAdmins.map(a => a.id) });
        }

    } catch (err) {
        console.error('Group info error:', err);
        await reply("❌ Failed to fetch group information. Error: " + err.message);
    }
});

// ==================== POLL COMMAND ====================
cmd({
    pattern: "poll",
    desc: "Create a poll with question and options",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isCreator, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can create polls.");
        
        if (!q) {
            return await reply("❓ Usage: `poll Question;Option1,Option2,Option3`\nExample: `poll Best color?;Red,Blue,Green,Black`");
        }

        const parts = q.split(";");
        if (parts.length < 2) {
            return await reply("⚠️ Please provide both question and options.\nFormat: Question;Option1,Option2,Option3");
        }

        const question = parts[0].trim();
        const optionsString = parts[1].trim();

        if (!question || !optionsString) {
            return await reply("⚠️ Question and options are required.");
        }

        const options = optionsString.split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) return await reply("❌ Please provide at least two options.");
        if (options.length > 12) return await reply("⚠️ Maximum 12 options allowed.");

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1,
                toAnnouncementGroup: true,
            }
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to create poll.");
    }
});

// ==================== REVOKE LINK COMMAND ====================
cmd({
    pattern: "revoke",
    alias: ["resetlink", "newlink"],
    desc: "Reset group invite link",
    category: "group",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to reset link.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only admins can use this command.", [], mek);

        const newCode = await conn.groupRevokeInvite(from);
        await sendGif(conn, from, "spin", `*✅ Link Reset Successful!*\n\n🔗 https://chat.whatsapp.com/${newCode}`, [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to reset link.", [], mek);
    }
});

// ==================== LINK COMMAND ====================
cmd({
    pattern: "link",
    alias: ["invite", "gclink", "invitelink"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to get the invite link.", [], mek);
        
        const inviteCode = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${inviteCode}`;
        await sendGif(conn, from, "wave", `🔗 *Group Invite Link:*\n\n${link}`, [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to get group link. I may not have admin permission.", [], mek);
    }
});

// ==================== OUT COMMAND (Remove by Country Code) ====================
cmd({
    pattern: "out",
    alias: ["ck", "🦶"],
    desc: "Removes all members with specific country code from the group",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isBotAdmins, reply, groupMetadata, isCreator }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isCreator) return await conn.sendMessage(from, { text: "*📛 This is an owner command.*" }, { quoted: mek });
    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");
    if (!q) return reply("❌ Please provide a country code. Example: .out 92");

    const countryCode = q.trim();
    if (!/^\d+$/.test(countryCode)) {
        return reply("❌ Invalid country code. Please provide only numbers (e.g., 92 for +92 numbers)");
    }

    try {
        const participants = await groupMetadata.participants;
        const targets = participants.filter(participant => participant.id.startsWith(countryCode) && !participant.admin);

        if (targets.length === 0) return reply(`❌ No members found with country code +${countryCode}`);

        const jids = targets.map(p => p.id);
        await conn.groupParticipantsUpdate(from, jids, "remove");
        reply(`✅ Successfully removed ${targets.length} members with country code +${countryCode}`);
    } catch (error) {
        console.error("Out command error:", error);
        reply("❌ Failed to remove members. Error: " + error.message);
    }
});

// ==================== NEW GROUP CREATE COMMAND ====================
cmd({
    pattern: "newgc",
    alias: ["creategroup", "makegroup"],
    desc: "Create a new group and add participants",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isCreator, body, reply }) => {
    try {
        if (!isCreator) return await reply("🔐 Only bot owner can use this command.");
        
        if (!body) {
            return await reply("❓ Usage: `newgc Group Name;number1,number2,...`\nExample: `newgc My Group;923001234567,923009876543`");
        }

        const parts = body.split(";");
        if (parts.length < 2) return await reply("⚠️ Please provide both group name and numbers.\nFormat: Group Name;number1,number2,...");

        const groupName = parts[0].trim();
        const numbersString = parts[1].trim();

        if (!groupName || !numbersString) return await reply("⚠️ Group name and numbers are required.");

        const participantNumbers = numbersString.split(",").map(num => {
            let cleanNum = num.trim();
            if (cleanNum.startsWith("3")) cleanNum = "92" + cleanNum;
            return cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
        }).filter(num => num.match(/^\d+@s\.whatsapp\.net$/));

        if (participantNumbers.length === 0) return await reply("❌ No valid phone numbers provided.\nExample: 923001234567,923009876543");

        const ownerJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!participantNumbers.includes(ownerJid)) participantNumbers.push(ownerJid);

        const group = await conn.groupCreate(groupName, participantNumbers);
        const inviteCode = await conn.groupInviteCode(group.id);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await conn.sendMessage(group.id, { text: `🎉 *Welcome to ${groupName}!*\n\nGroup created successfully!\nInvite Link: ${inviteLink}\n\nUse this link to invite more members.` });
        await reply(`✅ Group created successfully!\n\n📌 *Name:* ${groupName}\n👥 *Members:* ${participantNumbers.length}\n🔗 *Link:* ${inviteLink}`);

    } catch (err) {
        console.error(err);
        if (err.message?.includes("401")) await reply("❌ I'm not authorized to create groups.");
        else if (err.message?.includes("invalid")) await reply("❌ Invalid phone number(s) provided.");
        else await reply("❌ Failed to create group: " + (err.message || "Unknown error"));
    }
});

// ==================== UPDATE GROUP DESCRIPTION COMMAND ====================
cmd({
    pattern: "updategdesc",
    alias: ["gdesc", "setdesc", "groupdesc"],
    desc: "Change the group description",
    category: "group",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to change group description.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only admins can use this command.", [], mek);
        
        if (!q) return await sendGif(conn, from, "confused", "❌ Please provide a new group description.\nExample: `gdesc Welcome to our group!`", [], mek);

        if (q.length > 500) return await sendGif(conn, from, "shocked", "⚠️ Description is too long (max 500 characters).", [], mek);

        await conn.groupUpdateDescription(from, q);
        await sendGif(conn, from, "smile", "✅ Group description updated successfully!", [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to update group description.", [], mek);
    }
});

// ==================== UPDATE GROUP NAME COMMAND ====================
cmd({
    pattern: "updategname",
    alias: ["gname", "setname", "groupname"],
    desc: "Change the group name",
    category: "group",
    react: "📝",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ This command only works in groups.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I must be admin to change group name.", [], mek);
        if (!isAdmins && !isCreator) return await sendGif(conn, from, "angry", "🔐 Only admins can use this command.", [], mek);
        
        if (!q) return await sendGif(conn, from, "confused", "❌ Please provide a new group name.\nExample: `gname My New Group`", [], mek);

        if (q.length > 100) return await sendGif(conn, from, "shocked", "⚠️ Group name is too long (max 100 characters).", [], mek);

        await conn.groupUpdateSubject(from, q);
        await sendGif(conn, from, "smile", `✅ Group name changed to: *${q}*`, [], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to update group name.", [], mek);
    }
});

// ==================== HIDETAG COMMAND (Creator Only) ====================
cmd({
    pattern: "hidetag",
    alias: ["h"],
    react: "🔇",
    desc: "Hidden tag with custom message (Creator only) - Works with reply or direct message",
    category: "owner",
    use: '.h Hello everyone OR reply to any message with .h',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isCreator) return reply("❌ Only the bot creator can use this command.");

        let fullText = "";
        if (m.quoted) {
            fullText = m.quoted.text || q || "";
        } else if (q) {
            const cmdPattern = m.text?.match(/^[.!]?h(?:idetag)?\s*/i);
            if (cmdPattern) {
                fullText = m.text.replace(cmdPattern[0], "").trim();
            } else {
                fullText = q.trim();
            }
        }

        if (!m.quoted && !fullText) return reply("❌ Please provide a message or reply to media.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};

        if (m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            const caption = quotedMsg.text || fullText || "";
            
            if (!mimeType) {
                messageContent = { text: caption || "📢 Hidden tag", mentions: mentionedJid };
            } else if (mimeType.startsWith('image/')) {
                const buffer = await quotedMsg.download();
                messageContent = { image: buffer, caption: caption || "", mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('video/')) {
                const buffer = await quotedMsg.download();
                const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
                messageContent = { video: buffer, caption: caption || "", gifPlayback: isGif, mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('audio/')) {
                const buffer = await quotedMsg.download();
                const voiceNote = await converter.toPTT(buffer, 'mp3');
                messageContent = { audio: voiceNote, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: mentionedJid };
            } else if (mimeType.includes('sticker')) {
                const buffer = await quotedMsg.download();
                messageContent = { sticker: buffer, mentions: mentionedJid };
            } else {
                messageContent = { text: caption || "📢 Hidden tag", mentions: mentionedJid };
            }
        } else if (fullText) {
            messageContent = { text: fullText, mentions: mentionedJid };
        }

        await conn.sendMessage(from, messageContent);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Hidden Tag Error:", e);
        reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== TAG COMMAND (Admins + Creator) ====================
cmd({
    pattern: "tag",
    alias: ["taggc"],
    react: "🔊",
    desc: "Tag all members (Admins & Creator) - Works with reply or direct message",
    category: "group",
    use: '.tag Hello everyone OR reply to any message with .tag',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

        let fullText = "";
        if (m.quoted) {
            fullText = m.quoted.text || q || "";
        } else if (q) {
            const cmdPattern = m.text?.match(/^[.!]?tag(?:gc)?\s*/i);
            if (cmdPattern) {
                fullText = m.text.replace(cmdPattern[0], "").trim();
            } else {
                fullText = q.trim();
            }
        }

        if (!m.quoted && !fullText) return reply("❌ Please provide a message or reply to media to tag all members.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};

        if (m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            const caption = quotedMsg.text || fullText || "";
            
            if (!mimeType) {
                messageContent = { text: caption || "📢 Tag all members", mentions: mentionedJid };
            } else if (mimeType.startsWith('image/')) {
                const buffer = await quotedMsg.download();
                messageContent = { image: buffer, caption: caption || "", mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('video/')) {
                const buffer = await quotedMsg.download();
                const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
                messageContent = { video: buffer, caption: caption || "", gifPlayback: isGif, mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('audio/')) {
                const buffer = await quotedMsg.download();
                const voiceNote = await converter.toPTT(buffer, 'mp3');
                messageContent = { audio: voiceNote, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: mentionedJid };
            } else if (mimeType.includes('sticker')) {
                const buffer = await quotedMsg.download();
                messageContent = { sticker: buffer, mentions: mentionedJid };
            } else {
                messageContent = { text: caption || "📢 Tag all members", mentions: mentionedJid };
            }
        } else if (fullText) {
            messageContent = { text: fullText, mentions: mentionedJid };
        }

        await conn.sendMessage(from, messageContent, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Tag Error:", e);
        reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== ACCEPT ALL JOIN REQUESTS COMMAND ====================
cmd({
    pattern: "acceptall",
    alias: ["approveall", "allowall"],
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to accept join requests.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply("ℹ️ No pending join requests to accept.");

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");
        await reply(`✅ Successfully accepted ${requests.length} join request${requests.length > 1 ? 's' : ''}.`);

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to accept join requests.");
    }
});

// ==================== REJECT ALL JOIN REQUESTS COMMAND ====================
cmd({
    pattern: "rejectall",
    alias: ["declineall", "denyall"],
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to reject join requests.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply("ℹ️ No pending join requests to reject.");

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");
        await reply(`✅ Successfully rejected ${requests.length} join request${requests.length > 1 ? 's' : ''}.`);

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to reject join requests.");
    }
});

// ==================== VIEW PENDING REQUESTS COMMAND ====================
cmd({
    pattern: "requests",
    alias: ["pending", "joinlist"],
    desc: "Shows pending group join requests with numbers",
    category: "group",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to view join requests.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply("ℹ️ No pending join requests.");

        let text = `📋 *Pending Join Requests (${requests.length})*\n\n`;
        requests.forEach((user, i) => {
            text += `${i+1}. ${user.jid.replace('@s.whatsapp.net', '')}\n`;
        });

        text += `\n*Usage:*\n• Type \`accept 1\` to accept request #1\n• Type \`reject 3\` to reject request #3\n• Type \`acceptall\` to accept all\n• Type \`rejectall\` to reject all`;

        await reply(text);

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to fetch join requests.");
    }
});

// ==================== ACCEPT SPECIFIC REQUEST COMMAND ====================
cmd({
    pattern: "accept",
    alias: ["approve"],
    desc: "Accept specific join request by number",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, args, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to accept join requests.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can use this command.");

        if (!args[0]) return await reply("❓ Usage: accept [number]\nExample: accept 1");

        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1) return await reply("⚠️ Please provide a valid number.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return await reply("ℹ️ No pending join requests.");

        if (num > requests.length) return await reply(`⚠️ Only ${requests.length} pending request${requests.length > 1 ? 's' : ''} available.`);

        const user = requests[num - 1].jid;
        await conn.groupRequestParticipantsUpdate(from, [user], "approve");
        await reply(`✅ Accepted join request #${num} from ${user.replace('@s.whatsapp.net', '')}`);

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to accept join request.");
    }
});

// ==================== REJECT SPECIFIC REQUEST COMMAND ====================
cmd({
    pattern: "reject",
    alias: ["decline", "deny"],
    desc: "Reject specific join request by number",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, args, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to reject join requests.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only admins can use this command.");

        if (!args[0]) return await reply("❓ Usage: reject [number]\nExample: reject 2");

        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1) return await reply("⚠️ Please provide a valid number.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return await reply("ℹ️ No pending join requests.");

        if (num > requests.length) return await reply(`⚠️ Only ${requests.length} pending request${requests.length > 1 ? 's' : ''} available.`);

        const user = requests[num - 1].jid;
        await conn.groupRequestParticipantsUpdate(from, [user], "reject");
        await reply(`✅ Rejected join request #${num} from ${user.replace('@s.whatsapp.net', '')}`);

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to reject join request.");
    }
});

// ==================== LEAVE GROUP COMMAND ====================
cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    desc: "Leave the group",
    react: "🎉",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "❗ This command can only be used in *groups*.", [], mek);
        if (!isCreator) return await sendGif(conn, from, "angry", "❗ This command can only be used by my *owner*.", [], mek);

        await sendGif(conn, from, "wave", `👋 *Goodbye everyone!* I am leaving the group now. Thanks for having me here! ❤️`, [], mek);
        await sleep(1500);
        await conn.groupLeave(from);

    } catch (e) {
        console.error(e);
        await sendGif(conn, from, "cry", `❌ Error: ${e.message}`, [], mek);
    }
});

// ==================== JOIN GROUP COMMAND ====================
cmd({
    pattern: "join",
    alias: ["j", "joinlink", "gclink"],
    desc: "Join a group using invite link",
    category: "group",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, q, quoted, reply }) => {
    try {
        if (!isCreator) return await sendGif(conn, from, "angry", "🔐 Only bot owner can use this command.", [], mek);
        
        let link;

        if (quoted && quoted.text) {
            const linkMatch = quoted.text.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }
        
        if (!link && q) {
            const linkMatch = q.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }

        if (!link) return await sendGif(conn, from, "confused", "❌ Please provide a valid WhatsApp group invite link.\nExample: join https://chat.whatsapp.com/ABC123XYZ", [], mek);

        link = link.split('?')[0];

        try {
            await conn.groupAcceptInvite(link);
            await sendGif(conn, from, "highfive", "✅ Successfully joined the group!", [], mek);
        } catch (err) {
            if (err.message?.includes("already")) await sendGif(conn, from, "smug", "ℹ️ I'm already in this group.", [], mek);
            else if (err.message?.includes("expired")) await sendGif(conn, from, "cry", "❌ This link has expired or been reset.", [], mek);
            else if (err.message?.includes("invalid")) await sendGif(conn, from, "nope", "❌ Invalid group link.", [], mek);
            else await sendGif(conn, from, "cry", "❌ Failed to join group: " + (err.message || "Unknown error"), [], mek);
        }

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ An error occurred while processing the command.", [], mek);
    }
});

// ==================== INVITE COMMAND ====================
cmd({
    pattern: "invite",
    alias: ["aja"],
    desc: "Send group invite link to someone",
    category: "group",
    filename: __filename,
    react: "📨"
}, async (conn, mek, m, { from, args, isGroup, isBotAdmins, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return await sendGif(conn, from, "bored", "⚠️ Group only.", [], mek);
        if (!isBotAdmins) return await sendGif(conn, from, "cry", "❌ I need admin.", [], mek);
        if (!isCreator && !isAdmins) return await sendGif(conn, from, "angry", "🔐 Admins only.", [], mek);
        
        if (!args[0]) {
            const code = await conn.groupInviteCode(from);
            return await sendGif(conn, from, "wave", `🔗 Group Link:\nhttps://chat.whatsapp.com/${code}`, [], mek);
        }

        let number = args[0].replace(/[^0-9]/g, '');
        if (number.length < 10) return await sendGif(conn, from, "confused", "⚠️ Invalid number.", [], mek);
        
        let jid = number + "@s.whatsapp.net";
        const metadata = await conn.groupMetadata(from);
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await conn.sendMessage(jid, { text: `📨 *You're invited to join ${metadata.subject}*\n\n🔗 ${link}\n\n👤 Invited by: @${m.sender.split('@')[0]}` });
        await sendGif(conn, from, "highfive", `📨 Invite sent to @${number}`, [jid], mek);

    } catch (err) {
        console.error(err);
        await sendGif(conn, from, "cry", "❌ Failed to send invite.", [], mek);
    }
});
