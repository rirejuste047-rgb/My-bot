export default async function tagallCommand(message, client, { isOwner, isCreator }) {
  const remoteJid = message.key.remoteJid;
  
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: "❌ This command only works in groups!" });
  }
  
  // Restrict to admins/owner/creator
  if (!isOwner && !isCreator) {
    const metadata = await client.groupMetadata(remoteJid);
    const sender = `${message.key.participant || message.key.remoteJid}`;
    const isAdmin = metadata.participants.find(p => p.id === sender)?.admin;
    
    if (!isAdmin) {
      return await client.sendMessage(remoteJid, { text: "❌ Only admins can use this command!" });
    }
  }
  
  try {
    const metadata = await client.groupMetadata(remoteJid);
    const mentions = metadata.participants.map(p => p.id);
    const names = metadata.participants.map(p => p.id.split('@')[0]).slice(0, 20); // Show first 20
    
    let tagText = "📢 *MENTIONING ALL MEMBERS*\n\n";
    tagText += names.map((name, i) => `${i + 1}. @${name}`).join('\n');
    
    if (metadata.participants.length > 20) {
      tagText += `\n\n...and ${metadata.participants.length - 20} more members`;
    }
    
    await client.sendMessage(remoteJid, { 
      text: tagText,
      mentions: mentions
    });
    
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to tag all: ${error.message}` 
    });
  }
}
