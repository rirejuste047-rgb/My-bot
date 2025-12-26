export default async function kickallCommand(message, client, { isOwner }) {
  const remoteJid = message.key.remoteJid;
  
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: "❌ This command only works in groups!" });
  }
  
  // Only owner can use this dangerous command
  if (!isOwner) {
    return await client.sendMessage(remoteJid, { text: "❌ Only the bot owner can use this command!" });
  }
  
  try {
    const groupMetadata = await client.groupMetadata(remoteJid);
    const participants = groupMetadata.participants
      .filter(p => !p.id.includes(client.user.id.split(":")[0]))
      .map(p => p.id);
    
    if (participants.length === 0) {
      return await client.sendMessage(remoteJid, { text: "ℹ️ No participants to kick!" });
    }
    
    // Kick in batches to avoid rate limiting
    for (let i = 0; i < participants.length; i += 10) {
      const batch = participants.slice(i, i + 10);
      await client.groupParticipantsUpdate(remoteJid, batch, "remove");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await client.sendMessage(remoteJid, { 
      text: `✅ Successfully kicked ${participants.length} members from the group!` 
    });
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to kick all: ${error.message}` 
    });
  }
}
