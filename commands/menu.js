import config from "../config.js";

export default async function menuCommand(message, client) {
  try {
    const remoteJid = message.key.remoteJid;
    
    const menuText = `
╔═══════════════════════════════
║  🤖 *${config.BotName.toUpperCase()} MENU*
╠═══════════════════════════════
║
║ *🔧 BOT COMMANDS*
║ • .ping - Test latency
║ • .menu - Show this menu
║ • .info - Bot information
║
║ *👥 GROUP MANAGEMENT*
║ • .kick [@user] - Remove user
║ • .kickall - Remove all (owner)
║ • .promote [@user] - Make admin
║ • .demote [@user] - Remove admin
║ • .groupinfo - Group details
║ • .tagall - Mention everyone
║
║ *🎵 MEDIA COMMANDS*
║ • .play [url] - Play music
║ • .sticker - Create sticker
║
║ *🌐 UTILITY COMMANDS*
║ • .weather [city] - Weather info
║ • .translate [lang] [text] - Translate
║
║ *🛡️ MODERATION*
║ • Mode: ${config.mode}
║ • Owner: ${config.owner ? "✅ Set" : "❌ Not set"}
║
╚═══════════════════════════════

> Creator: ${config.nameCreator}
> Type .help [command] for details
`;

    // Send menu
    await client.sendMessage(remoteJid, { 
      text: menuText 
    });
    
    // Optional: Send image
    // await client.sendMessage(remoteJid, {
    //   image: { url: "https://files.catbox.moe/x7fi39.jpg" },
    //   caption: "Bot Menu"
    // });
    
  } catch (err) {
    console.error("Error in menuCommand:", err);
  }
}
