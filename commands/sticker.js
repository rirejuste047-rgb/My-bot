import { Sticker, createSticker, StickerTypes } from 'wa-sticker-formatter';

export default async function stickerCommand(message, client) {
  const remoteJid = message.key.remoteJid;
  
  try {
    // Check for image or video in message
    const isImage = message.message?.imageMessage;
    const isVideo = message.message?.videoMessage;
    const quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    const quotedVideo = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    
    let mediaBuffer;
    let mimetype;
    
    if (isImage || quotedImage) {
      const imageMsg = isImage || quotedImage;
      mediaBuffer = await client.downloadMediaMessage(message);
      mimetype = imageMsg.mimetype;
    } else if (isVideo || quotedVideo) {
      const videoMsg = isVideo || quotedVideo;
      mediaBuffer = await client.downloadMediaMessage(message);
      mimetype = videoMsg.mimetype;
      
      // Check if video is too long for sticker (max 7 seconds)
      if (videoMsg.seconds > 7) {
        return await client.sendMessage(remoteJid, { 
          text: "❌ Video is too long! Maximum 7 seconds for stickers." 
        });
      }
    } else {
      return await client.sendMessage(remoteJid, { 
        text: "⚠️ Please send or reply to an image/video to create a sticker!\nUsage: .sticker (reply to image/video)" 
      });
    }
    
    await client.sendMessage(remoteJid, { text: "🔄 Creating sticker..." });
    
    const sticker = new Sticker(mediaBuffer, {
      pack: 'DofuBot Stickers',
      author: 'Created by DofuBot',
      type: StickerTypes.FULL,
      categories: ['🤩', '🎉'],
      id: '12345',
      quality: 50,
      background: '#000000'
    });
    
    await client.sendMessage(remoteJid, await sticker.toMessage());
    
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to create sticker: ${error.message}` 
    });
  }
}
