export default async function groupinfoCommand(message, client) {
  const remoteJid = message.key.remoteJid;
  
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: "❌ This command only works in groups!" });
  }
  
  try {
    const metadata = await client.groupMetadata(remoteJid);
    const participants = metadata.participants;
    const admins = participants.filter(p => p.admin).map(p => p.id.split('@')[0]);
    const bots = participants.filter(p => p.id.includes(client.user.id.split(":")[0]));
    
    const infoText = `
👥 *GROUP INFORMATION*

*Group Name:* ${metadata.subject}
*Group ID:* ${metadata.id}
*Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}
*Owner:* ${metadata.owner?.split('@')[0] || "Unknown"}

*Members:* ${participants.length} participants
*Admins:* ${admins.length} administrators
*Bots:* ${bots.length} bot(s)

*Description:* ${metadata.desc || "No description"}
*Restricted:* ${metadata.restrict ? "Yes" : "No"}
*Announcement:* ${metadata.announce ? "Yes" : "No"}
`;

    await client.sendMessage(remoteJid, { text: infoText });
    
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to get group info: ${error.message}` 
    });
  }
}
