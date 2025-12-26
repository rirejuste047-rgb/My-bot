export default async function promoteCommand(message, client, { target, isOwner, isCreator }) {
  const remoteJid = message.key.remoteJid;
  
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: "❌ This command only works in groups!" });
  }
  
  if (!isOwner && !isCreator) {
    return await client.sendMessage(remoteJid, { text: "❌ You don't have permission to use this command!" });
  }
  
  if (!target) {
    return await client.sendMessage(remoteJid, { 
      text: "⚠️ Please specify a user to promote!\nUsage: .promote @user or .promote 1234567890" 
    });
  }
  
  try {
    const participant = `${target}@s.whatsapp.net`;
    await client.groupParticipantsUpdate(remoteJid, [participant], "promote");
    await client.sendMessage(remoteJid, { 
      text: `✅ Successfully promoted ${target} to admin!` 
    });
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to promote user: ${error.message}` 
    });
  }
}
