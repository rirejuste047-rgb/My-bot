import ytdl from 'ytdl-core';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export default async function playCommand(message, client, { args }) {
  const remoteJid = message.key.remoteJid;
  
  if (!args[0]) {
    return await client.sendMessage(remoteJid, { 
      text: "⚠️ Please provide a YouTube URL or search term!\nUsage: .play [youtube-url] or .play [song name]" 
    });
  }
  
  try {
    const query = args.join(' ');
    let videoUrl = query;
    
    // If it's not a URL, search for the video
    if (!query.startsWith('http')) {
      await client.sendMessage(remoteJid, { text: "🔍 Searching for music..." });
      // You would need to implement YouTube search here
      // For now, we'll assume it's a URL
    }
    
    await client.sendMessage(remoteJid, { text: "⬇️ Downloading audio..." });
    
    // Download audio from YouTube
    const audioStream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
    const filePath = `./temp_${Date.now()}.mp3`;
    const writeStream = fs.createWriteStream(filePath);
    
    audioStream.pipe(writeStream);
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // Send audio
    await client.sendMessage(remoteJid, {
      audio: fs.readFileSync(filePath),
      mimetype: 'audio/mp4',
      ptt: false
    });
    
    // Clean up
    fs.unlinkSync(filePath);
    
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Error playing audio: ${error.message}` 
    });
  }
}
