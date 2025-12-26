export default async function kickCommand(message, client, { target, isOwner, isCreator }) {
  const remoteJid = message.key.remoteJid;
  
  // Check if it's a group
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: "❌ This command only works in groups!" });
  }
  
  // Check permissions
  if (!isOwner && !isCreator) {
    return await client.sendMessage(remoteJid, { text: "❌ You don't have permission to use this command!" });
  }
  
  if (!target) {
    return await client.sendMessage(remoteJid, { 
      text: "⚠️ Please specify a user to kick!\nUsage: .kick @user or .kick 1234567890" 
    });
  }
  
  try {
    const participant = `${target}@s.whatsapp.net`;
    await client.groupParticipantsUpdate(remoteJid, [participant], "remove");
    await client.sendMessage(remoteJid, { 
      text: `✅ Successfully kicked ${target} from the group!` 
    });
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to kick user: ${error.message}` 
    });
  }
}
