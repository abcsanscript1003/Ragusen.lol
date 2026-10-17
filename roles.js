const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../store');
const { fail, sendLog, roleError } = require('../utils');

const addrole = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('メンバーにロールを付与します')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('付与するロール').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),
  async execute(i) {
    const member = i.options.getMember('user');
    const role = i.options.getRole('role');
    if (!member) return fail(i, 'サーバー内のメンバーを指定してください。');
    const err = roleError(i, role);
    if (err) return fail(i, err);
    await member.roles.add(role);
    await sendLog(i.guild, `🏷️ ${member.user.tag} に ${role.name} を付与（実行者: ${i.user.tag}）`);
    return i.reply(`${member.user.tag} に ${role.name} を付与しました。`);
  },
};

const removerole = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('メンバーからロールを外します')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('外すロール').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),
  async execute(i) {
    const member = i.options.getMember('user');
    const role = i.options.getRole('role');
    if (!member) return fail(i, 'サーバー内のメンバーを指定してください。');
    const err = roleError(i, role);
    if (err) return fail(i, err);
    await member.roles.remove(role);
    await sendLog(i.guild, `🏷️ ${member.user.tag} から ${role.name} を削除（実行者: ${i.user.tag}）`);
    return i.reply(`${member.user.tag} から ${role.name} を外しました。`);
  },
};

// 期限付きロール: 指定時間後に自動で外れる（ready.js の定期チェックで処理）
const temprole = {
  data: new SlashCommandBuilder()
    .setName('temprole')
    .setDescription('期限付きでロールを付与します（時間が過ぎると自動で外れます）')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('付与するロール').setRequired(true))
    .addIntegerOption((o) =>
      o.setName('minutes').setDescription('期間（分・1〜43200）').setRequired(true).setMinValue(1).setMaxValue(43200),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),
  async execute(i) {
    const member = i.options.getMember('user');
    const role = i.options.getRole('role');
    const minutes = i.options.getInteger('minutes');
    if (!member) return fail(i, 'サーバー内のメンバーを指定してください。');
    const err = roleError(i, role);
    if (err) return fail(i, err);

    await member.roles.add(role);
    const data = store.load();
    data.timedRoles.push({
      guildId: i.guild.id,
      userId: member.id,
      roleId: role.id,
      expiresAt: Date.now() + minutes * 60 * 1000,
    });
    store.save(data);

    await sendLog(i.guild, `⏱️ ${member.user.tag} に ${role.name} を${minutes}分間付与（実行者: ${i.user.tag}）`);
    return i.reply(`${member.user.tag} に ${role.name} を${minutes}分間付与しました。`);
  },
};

module.exports = [addrole, removerole, temprole];
