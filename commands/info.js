export default async function infoCommand(message, client, { config }) {
  const remoteJid = message.key.remoteJid;
  
  const infoText = `
🤖 *BOT INFORMATION*

*Bot Name:* ${config.BotName}
*Creator:* ${config.nameCreator}
*Mode:* ${config.mode}
*Owner ID:* ${config.owner || "Not set"}

*Commands Available:*
• .ping - Test bot latency
• .menu - Show menu
• .kick [@user] - Kick user from group
• .kickall - Kick all users (owner only)
• .promote [@user] - Promote to admin
• .demote [@user] - Demote from admin
• .play [url] - Play YouTube audio
• .sticker - Create sticker
• .groupinfo - Show group info
• .tagall - Mention all members
• .weather [city] - Check weather
• .translate [text] - Translate text

📊 *Bot Status:* Online
🕒 *Uptime:* ${process.uptime().toFixed(0)} seconds
`;

  await client.sendMessage(remoteJid, { text: infoText });
}
