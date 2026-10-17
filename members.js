const { Events } = require('discord.js');
const store = require('../store');
const { sendLog } = require('../utils');

module.exports = [
  {
    name: Events.GuildMemberAdd,
    async execute(member) {
      const welcome = store.load().welcome[member.guild.id];
      if (welcome?.roleId) {
        await member.roles.add(welcome.roleId).catch((err) => console.error('自動ロール付与に失敗:', err.message));
      }
      if (welcome?.channelId) {
        const channel = member.guild.channels.cache.get(welcome.channelId);
        if (channel?.isTextBased()) {
          const text = (welcome.message ?? 'ようこそ、{user}さん！ {server}へようこそ！')
            .replaceAll('{user}', `<@${member.id}>`)
            .replaceAll('{server}', member.guild.name);
          await channel.send(text).catch(() => {});
        }
      }
      await sendLog(member.guild, `📥 ${member.user.tag} が参加しました`);
    },
  },
  {
    name: Events.GuildMemberRemove,
    async execute(member) {
      await sendLog(member.guild, `📤 ${member.user.tag} が退出しました`);
    },
  },
];
