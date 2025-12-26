import axios from 'axios';

export default async function translateCommand(message, client, { args }) {
  const remoteJid = message.key.remoteJid;
  
  if (args.length < 2) {
    return await client.sendMessage(remoteJid, { 
      text: "⚠️ Usage: .translate [target-language] [text]\nExample: .translate en Bonjour" 
    });
  }
  
  const targetLang = args[0];
  const textToTranslate = args.slice(1).join(' ');
  
  try {
    await client.sendMessage(remoteJid, { text: "🔤 Translating..." });
    
    // Using LibreTranslate API (free and open source)
    const response = await axios.post('https://libretranslate.com/translate', {
      q: textToTranslate,
      source: 'auto',
      target: targetLang,
      format: 'text'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const translatedText = response.data.translatedText;
    const detectedLang = response.data.detectedLanguage?.language || 'Unknown';
    
    await client.sendMessage(remoteJid, {
      text: `🌐 *TRANSLATION*\n\n*Original (${detectedLang}):* ${textToTranslate}\n\n*Translation (${targetLang}):* ${translatedText}`
    });
    
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Translation error: ${error.message}` 
    });
  }
}
