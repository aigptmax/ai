// JawadTechX

import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import converter from '../lib/converter.js';
import { fileURLToPath } from 'url';
import { Pubg } from '../lib/jawi.js';

const __filename = fileURLToPath(import.meta.url);

const SIZE_LIMIT_MB = 150;

async function downloadToDisk(url, ext) {
    const tempPath = path.join(os.tmpdir(), `dl_${Date.now()}.${ext}`);
    const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: 180000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.on('error', reject);
    });
    return tempPath;
}

async function sendBySize(conn, from, mek, videoUrl, title, format, BOT_NAME, quality) {
    const ext = format || 'mp4';
    const mimetype = 'video/mp4';
    let tempPath = null;
    try {
        tempPath = await downloadToDisk(videoUrl, ext);
        const stats = fs.statSync(tempPath);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB <= SIZE_LIMIT_MB) {
            await conn.sendMessage(from, {
                video: fs.readFileSync(tempPath),
                mimetype: mimetype,
                fileName: `${title}.${ext}`,
                caption: `📶 *Facebook Downloader*\n\n- ❤‍🩹 *Quality*: ${quality}\n\n> Powered by ${BOT_NAME}`
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                document: fs.readFileSync(tempPath),
                mimetype: mimetype,
                fileName: `${title}.${ext}`,
                caption: `📶 *Facebook Downloader*\n\n- 📄 *Video Document* (>${SIZE_LIMIT_MB}MB)\n- ❤‍🩹 *Quality*: ${quality}\n\n> Powered by ${BOT_NAME}`
            }, { quoted: mek });
        }
        if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return true;
    } catch (error) {
        if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return false;
    }
}

cmd({
    pattern: "ig",
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "download",
    use: ".ig <Instagram link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('instagram.com/')) {
            return reply("⚠️ *Invalid Instagram link.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Instagram link format.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        const igUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.data?.url) {
                    const mediaUrl = data.data.url;
                    const type = data.data.type || 'video';

                    await conn.sendMessage(from, {
                        [type === 'video' ? 'video' : 'image']: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && Array.isArray(data?.data) && data.data[0]?.url) {
                    const item = data.data[0];
                    const mediaUrl = item.url;
                    const type = item.type === 'video' ? 'video' : 'image';

                    await conn.sendMessage(from, {
                        [type]: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/igdl?url=${igUrl}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;

                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "insta",
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "download",
    use: ".insta <Instagram link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('instagram.com/')) {
            return reply("⚠️ *Invalid Instagram link.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Instagram link format.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        const igUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.data?.url) {
                    const mediaUrl = data.data.url;
                    const type = data.data.type || 'video';

                    await conn.sendMessage(from, {
                        [type === 'video' ? 'video' : 'image']: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && Array.isArray(data?.data) && data.data[0]?.url) {
                    const item = data.data[0];
                    const mediaUrl = item.url;
                    const type = item.type === 'video' ? 'video' : 'image';

                    await conn.sendMessage(from, {
                        [type]: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/igdl?url=${igUrl}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;

                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "Instagram",
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "download",
    use: ".Instagram <Instagram link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('instagram.com/')) {
            return reply("⚠️ *Invalid Instagram link.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Instagram link format.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        const igUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.data?.url) {
                    const mediaUrl = data.data.url;
                    const type = data.data.type || 'video';

                    await conn.sendMessage(from, {
                        [type === 'video' ? 'video' : 'image']: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && Array.isArray(data?.data) && data.data[0]?.url) {
                    const item = data.data[0];
                    const mediaUrl = item.url;
                    const type = item.type === 'video' ? 'video' : 'image';

                    await conn.sendMessage(from, {
                        [type]: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/igdl?url=${igUrl}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;

                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "igdl",
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "download",
    use: ".igdl <Instagram link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('instagram.com/')) {
            return reply("⚠️ *Invalid Instagram link.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Instagram link format.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        const igUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.data?.url) {
                    const mediaUrl = data.data.url;
                    const type = data.data.type || 'video';

                    await conn.sendMessage(from, {
                        [type === 'video' ? 'video' : 'image']: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && Array.isArray(data?.data) && data.data[0]?.url) {
                    const item = data.data[0];
                    const mediaUrl = item.url;
                    const type = item.type === 'video' ? 'video' : 'image';

                    await conn.sendMessage(from, {
                        [type]: { url: mediaUrl },
                        caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/igdl?url=${igUrl}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;

                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            caption: `📶 *Instagram Downloader*\n\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "igmp3",
    alias: ["instamp3", "instaaudio", "igaudio"],
    react: "🎵",
    desc: "Extract audio from Instagram video/reel",
    category: "download",
    use: ".igmp3 <Instagram URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text || !text.includes('instagram.com/')) {
            return reply("⚠️ *Invalid Instagram link.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Instagram link format.*\n\nMake sure it looks like:\nhttps://www.instagram.com/reel/xxxxx");
        const igUrl = match[0];

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;

        if (!videoUrl) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.data?.url) {
                    videoUrl = data.data.url;
                }
            } catch {}
        }

        if (!videoUrl) {
            try {
                const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${igUrl}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && Array.isArray(data?.data) && data.data[0]?.url) {
                    const item = data.data.find(v => v.type === 'video');
                    if (item?.url) videoUrl = item.url;
                }
            } catch {}
        }

        if (!videoUrl) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/igdl?url=${igUrl}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;
                    if (typeof mediaUrl === 'string' && mediaUrl) videoUrl = mediaUrl;
                }
            } catch {}
        }

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        let videoBuffer;
        try {
            const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 30000 });
            videoBuffer = Buffer.from(videoResponse.data);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Failed to download video source*");
        }

        await conn.sendMessage(from, { react: { text: '🔧', key: m.key } });
        const audioBuffer = await converter.toAudio(videoBuffer, 'mp4');

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "tiktok",
    react: "⬇️",
    desc: "Download TikTok videos",
    category: "download",
    use: ".tiktok <TikTok link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('tiktok.com')) {
            return reply("⚠️ *Invalid TikTok link.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx\nor\nhttps://www.tiktok.com/@user/video/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid TikTok link format.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx");
        const ttUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    await conn.sendMessage(from, {
                        video: { url: data.result },
                        mimetype: 'video/mp4',
                        caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.result?.data) {
                    const d = data.result.data;
                    const mediaUrl = d.play;
                    if (mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${d.title || 'N/A'}\n- 👤 *Author*: ${d.author?.nickname || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/tt?url=${encodeURIComponent(ttUrl)}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;
                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "tt",
    react: "⬇️",
    desc: "Download TikTok videos",
    category: "download",
    use: ".tt <TikTok link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('tiktok.com')) {
            return reply("⚠️ *Invalid TikTok link.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx\nor\nhttps://www.tiktok.com/@user/video/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid TikTok link format.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx");
        const ttUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    await conn.sendMessage(from, {
                        video: { url: data.result },
                        mimetype: 'video/mp4',
                        caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.result?.data) {
                    const d = data.result.data;
                    const mediaUrl = d.play;
                    if (mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${d.title || 'N/A'}\n- 👤 *Author*: ${d.author?.nickname || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/tt?url=${encodeURIComponent(ttUrl)}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;
                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "ttdl",
    react: "⬇️",
    desc: "Download TikTok videos",
    category: "download",
    use: ".ttdl <TikTok link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('tiktok.com')) {
            return reply("⚠️ *Invalid TikTok link.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx\nor\nhttps://www.tiktok.com/@user/video/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid TikTok link format.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx");
        const ttUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    await conn.sendMessage(from, {
                        video: { url: data.result },
                        mimetype: 'video/mp4',
                        caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.result?.data) {
                    const d = data.result.data;
                    const mediaUrl = d.play;
                    if (mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${d.title || 'N/A'}\n- 👤 *Author*: ${d.author?.nickname || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/tt?url=${encodeURIComponent(ttUrl)}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;
                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "TikTok",
    react: "⬇️",
    desc: "Download TikTok videos",
    category: "download",
    use: ".TikTok <TikTok link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || !text.includes('tiktok.com')) {
            return reply("⚠️ *Invalid TikTok link.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx\nor\nhttps://www.tiktok.com/@user/video/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid TikTok link format.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx");
        const ttUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let success = false;

        if (!success) {
            try {
                const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    await conn.sendMessage(from, {
                        video: { url: data.result },
                        mimetype: 'video/mp4',
                        caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                    }, { quoted: mek });
                    success = true;
                }
            } catch {}
        }

        if (!success) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.result?.data) {
                    const d = data.result.data;
                    const mediaUrl = d.play;
                    if (mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${d.title || 'N/A'}\n- 👤 *Author*: ${d.author?.nickname || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (!success) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/tt?url=${encodeURIComponent(ttUrl)}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;
                    if (typeof mediaUrl === 'string' && mediaUrl) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: 'video/mp4',
                            caption: `📶 *TikTok Downloader*\n\n- 📝 *Title*: ${data.metadata?.title || 'N/A'}\n- 👤 *Author*: ${data.metadata?.author || 'N/A'}\n- ❤‍🩹 *Quality*: HD\n\n> Powered by ${BOT_NAME}`
                        }, { quoted: mek });
                        success = true;
                    }
                }
            } catch {}
        }

        if (success) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "ttmp3",
    alias: ["tiktokmp3", "ttaudio", "tiktokaudio"],
    react: "🎵",
    desc: "Extract audio from TikTok video",
    category: "download",
    use: ".ttmp3 <TikTok URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text || !text.includes('tiktok.com')) {
            return reply("⚠️ *Invalid TikTok link.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx\nor\nhttps://www.tiktok.com/@user/video/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid TikTok link format.*\n\nMake sure it looks like:\nhttps://vt.tiktok.com/xxxxx");
        const ttUrl = match[0];

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;

        if (!videoUrl) {
            try {
                const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    videoUrl = data.result;
                }
            } catch {}
        }

        if (!videoUrl) {
            try {
                const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/tiktok?url=${encodeURIComponent(ttUrl)}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === 'success' && data?.result?.data) {
                    const d = data.result.data;
                    videoUrl = d.play || null;
                }
            } catch {}
        }

        if (!videoUrl) {
            try {
                const bases = [
                    'https://xjawadtech.vercel.app',
                    'https://jawadtechhub.vercel.app'
                ];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const apiUrl = `${base}/tt?url=${encodeURIComponent(ttUrl)}&key=${Pubg}`;
                const { data } = await axios.get(apiUrl, { timeout: 20000 });

                if (data?.status === true && data?.result) {
                    const mediaUrl = Array.isArray(data.result) ? data.result[0] : data.result;
                    if (typeof mediaUrl === 'string' && mediaUrl) videoUrl = mediaUrl;
                }
            } catch {}
        }

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        let videoBuffer;
        try {
            const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 30000 });
            videoBuffer = Buffer.from(videoResponse.data);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Failed to download video source*");
        }

        await conn.sendMessage(from, { react: { text: '🔧', key: m.key } });
        const audioBuffer = await converter.toAudio(videoBuffer, 'mp4');

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "facebook",
    react: "⬇️",
    desc: "Download Facebook videos",
    category: "download",
    use: ".facebook <Facebook link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || (!text.includes('facebook.com') && !text.includes('fb.watch') && !text.includes('fb.com'))) {
            return reply("⚠️ *Invalid Facebook link.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx\nor\nhttps://fb.watch/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Facebook link format.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx");
        const fbUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;
        let qualityLabel = 'HD';

        try {
            const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(fbUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (data?.status === true && Array.isArray(data?.result) && data.result.length > 0) {
                const hd = data.result.find(v => v.quality === 'HD');
                const sd = data.result.find(v => v.quality === 'SD');
                const pick = hd || sd || data.result[0];
                if (pick?.url) {
                    videoUrl = pick.url;
                    qualityLabel = pick.quality || 'HD';
                }
            }
        } catch {}

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        const sent = await sendBySize(conn, from, mek, videoUrl, `Facebook_${Date.now()}`, 'mp4', BOT_NAME, qualityLabel);

        if (sent) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "fb",
    react: "⬇️",
    desc: "Download Facebook videos",
    category: "download",
    use: ".fb <Facebook link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || (!text.includes('facebook.com') && !text.includes('fb.watch') && !text.includes('fb.com'))) {
            return reply("⚠️ *Invalid Facebook link.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx\nor\nhttps://fb.watch/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Facebook link format.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx");
        const fbUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;
        let qualityLabel = 'HD';

        try {
            const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(fbUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (data?.status === true && Array.isArray(data?.result) && data.result.length > 0) {
                const hd = data.result.find(v => v.quality === 'HD');
                const sd = data.result.find(v => v.quality === 'SD');
                const pick = hd || sd || data.result[0];
                if (pick?.url) {
                    videoUrl = pick.url;
                    qualityLabel = pick.quality || 'HD';
                }
            }
        } catch {}

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        const sent = await sendBySize(conn, from, mek, videoUrl, `Facebook_${Date.now()}`, 'mp4', BOT_NAME, qualityLabel);

        if (sent) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "fbdl",
    react: "⬇️",
    desc: "Download Facebook videos",
    category: "download",
    use: ".fbdl <Facebook link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || (!text.includes('facebook.com') && !text.includes('fb.watch') && !text.includes('fb.com'))) {
            return reply("⚠️ *Invalid Facebook link.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx\nor\nhttps://fb.watch/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Facebook link format.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx");
        const fbUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;
        let qualityLabel = 'HD';

        try {
            const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(fbUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (data?.status === true && Array.isArray(data?.result) && data.result.length > 0) {
                const hd = data.result.find(v => v.quality === 'HD');
                const sd = data.result.find(v => v.quality === 'SD');
                const pick = hd || sd || data.result[0];
                if (pick?.url) {
                    videoUrl = pick.url;
                    qualityLabel = pick.quality || 'HD';
                }
            }
        } catch {}

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        const sent = await sendBySize(conn, from, mek, videoUrl, `Facebook_${Date.now()}`, 'mp4', BOT_NAME, qualityLabel);

        if (sent) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "Facebook",
    react: "⬇️",
    desc: "Download Facebook videos",
    category: "download",
    use: ".Facebook <Facebook link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, userConfig }) => {
    try {
        if (!text || (!text.includes('facebook.com') && !text.includes('fb.watch') && !text.includes('fb.com'))) {
            return reply("⚠️ *Invalid Facebook link.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx\nor\nhttps://fb.watch/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Facebook link format.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx");
        const fbUrl = match[0];

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;
        let qualityLabel = 'HD';

        try {
            const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(fbUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (data?.status === true && Array.isArray(data?.result) && data.result.length > 0) {
                const hd = data.result.find(v => v.quality === 'HD');
                const sd = data.result.find(v => v.quality === 'SD');
                const pick = hd || sd || data.result[0];
                if (pick?.url) {
                    videoUrl = pick.url;
                    qualityLabel = pick.quality || 'HD';
                }
            }
        } catch {}

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        const sent = await sendBySize(conn, from, mek, videoUrl, `Facebook_${Date.now()}`, 'mp4', BOT_NAME, qualityLabel);

        if (sent) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});

cmd({
    pattern: "fbmp3",
    alias: ["facebookmp3", "fbaudio", "facebookaudio"],
    react: "🎵",
    desc: "Extract audio from Facebook video",
    category: "download",
    use: ".fbmp3 <Facebook URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text || (!text.includes('facebook.com') && !text.includes('fb.watch') && !text.includes('fb.com'))) {
            return reply("⚠️ *Invalid Facebook link.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx\nor\nhttps://fb.watch/xxxxx");
        }
        const match = text.match(/https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/i);
        if (!match) return reply("⚠️ *Invalid Facebook link format.*\n\nMake sure it looks like:\nhttps://www.facebook.com/share/r/xxxxx");
        const fbUrl = match[0];

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let videoUrl = null;

        try {
            const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(fbUrl)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (data?.status === true && Array.isArray(data?.result) && data.result.length > 0) {
                const hd = data.result.find(v => v.quality === 'HD');
                const sd = data.result.find(v => v.quality === 'SD');
                const pick = hd || sd || data.result[0];
                if (pick?.url) videoUrl = pick.url;
            }
        } catch {}

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Download Failed Please Try Again*");
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        let videoBuffer;
        try {
            const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 30000 });
            videoBuffer = Buffer.from(videoResponse.data);
        } catch (e) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("> ❌ *Failed to download video source*");
        }

        await conn.sendMessage(from, { react: { text: '🔧', key: m.key } });
        const audioBuffer = await converter.toAudio(videoBuffer, 'mp4');

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("> ❌ *Download Failed Please Try Again*");
    }
});
