const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../store');
const { sendLog } = require('../utils');

const warn = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('メンバーに警告を記録します')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('理由').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  async execute(i) {
    const user = i.options.getUser('user');
    const reason = i.options.getString('reason');
    const data = store.load();
    data.warnings.push({
      guildId: i.guild.id,
      userId: user.id,
      moderatorId: i.user.id,
      reason,
      createdAt: Date.now(),
    });
    store.save(data);

    const count = data.warnings.filter((w) => w.guildId === i.guild.id && w.userId === user.id).length;
    await sendLog(i.guild, `⚠️ ${user.tag} に警告（理由: ${reason}／実行者: ${i.user.tag}／累計${count}回）`);
    return i.reply(`${user.tag} に警告を記録しました（累計${count}回）。`);
  },
};

const warnings = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('メンバーの警告履歴を表示します（直近10件）')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  async execute(i) {
    const user = i.options.getUser('user');
    const list = store
      .load()
      .warnings.filter((w) => w.guildId === i.guild.id && w.userId === user.id)
      .slice(-10);
    if (list.length === 0) return i.reply({ content: `${user.tag} の警告はありません。`, ephemeral: true });

    const lines = list.map((w) => {
      const date = new Date(w.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
      return `・${date}: ${w.reason}`;
    });
    return i.reply({ content: `**${user.tag} の警告（直近${list.length}件）**\n${lines.join('\n')}`, ephemeral: true });
  },
};

module.exports = [warn, warnings];
