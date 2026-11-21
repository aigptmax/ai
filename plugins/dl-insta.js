import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import converter from '../lib/converter.js';
import { fileURLToPath } from 'url';
import { Pubg } from '../lib/jawi.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ig",
    alias: ["igdl", "instagram", "insta"],
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
                // fixed: using Pubg key from lib
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
                // fixed: using Pubg key from lib
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
