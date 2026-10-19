const { PermissionFlagsBits } = require('discord.js');
const store = require('../utils/store');

module.exports = {
  async run(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ このコマンドは管理者のみ実行できます。');
    }

    const isOnlyAdmin = store.get(message.guild.id, 'onlyAdminMode');
    
    if (isOnlyAdmin) {
      store.set(message.guild.id, 'onlyAdminMode', false);
      return message.reply('🔓 `!` コマンドの管理者限定モードを解除しました。全員が使用可能です。');
    } else {
      store.set(message.guild.id, 'onlyAdminMode', true);
      return message.reply('🔒 `!` コマンドを管理者限定にしました。管理者以外は使用できません。');
    }
  }
};
