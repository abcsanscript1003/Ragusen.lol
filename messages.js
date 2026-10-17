const { Events } = require('discord.js');
const { sendLog } = require('../utils');

module.exports = [
  {
    name: Events.MessageDelete,
    async execute(message) {
      if (!message.guild || message.author?.bot) return;
      const content = message.content ?? '（内容を取得できませんでした）';
      await sendLog(message.guild, `🗑️ ${message.author?.tag ?? '不明'} のメッセージが削除されました（<#${message.channelId}>）: ${content}`);
    },
  },
  {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;
      const before = oldMessage.content ?? '（不明）';
      await sendLog(newMessage.guild, `✏️ ${newMessage.author?.tag} がメッセージを編集（<#${newMessage.channelId}>）\n変更前: ${before}\n変更後: ${newMessage.content}`);
    },
  },
];
