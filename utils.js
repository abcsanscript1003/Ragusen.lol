const { MessageFlags } = require('discord.js');
const store = require('./store');

// 実行者にだけ見えるエラーメッセージ
const fail = (interaction, text) =>
  interaction.reply({ content: text, flags: MessageFlags.Ephemeral });

// ログチャンネルに記録（設定されていなければ何もしない）
async function sendLog(guild, content) {
  const channelId = store.load().logChannels[guild.id];
  if (!channelId) return;
  try {
    const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId));
    if (channel?.isTextBased()) await channel.send({ content });
  } catch (err) {
    console.error('ログ送信に失敗:', err.message);
  }
}

// そのロールをbotと実行者が操作できるか確認。問題があればメッセージを返す
function roleError(interaction, role) {
  if (role.managed) return '連携ボット用のロールは操作できません。';
  const me = interaction.guild.members.me;
  if (role.position >= me.roles.highest.position) {
    return 'botより上（同じ位置を含む）のロールは操作できません。';
  }
  const isOwner = interaction.guild.ownerId === interaction.user.id;
  if (!isOwner && role.position >= interaction.member.roles.highest.position) {
    return 'あなたより上（同じ位置を含む）のロールは操作できません。';
  }
  return null;
}

module.exports = { fail, sendLog, roleError };
