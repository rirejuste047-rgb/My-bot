export default async function demoteCommand(message, client, { target, isOwner, isCreator }) {
  const remoteJid = message.key.remoteJid;
  
  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, { text: "❌ This command only works in groups!" });
  }
  
  if (!isOwner && !isCreator) {
    return await client.sendMessage(remoteJid, { text: "❌ You don't have permission to use this command!" });
  }
  
  if (!target) {
    return await client.sendMessage(remoteJid, { 
      text: "⚠️ Please specify a user to demote!\nUsage: .demote @user or .demote 1234567890" 
    });
  }
  
  try {
    const participant = `${target}@s.whatsapp.net`;
    await client.groupParticipantsUpdate(remoteJid, [participant], "demote");
    await client.sendMessage(remoteJid, { 
      text: `✅ Successfully demoted ${target} from admin!` 
    });
  } catch (error) {
    await client.sendMessage(remoteJid, { 
      text: `❌ Failed to demote user: ${error.message}` 
    });
  }
}
