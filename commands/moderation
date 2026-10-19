// モデレーション・ロール操作。
// 実行結果は全員に見えるように、すべて公開返信にしています。
const {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

const ephemeral = (interaction, content) =>
  interaction.reply({ content, flags: MessageFlags.Ephemeral });

const kick = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('メンバーをキックします')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('理由')),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? '理由なし';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return ephemeral(interaction, 'メンバーが見つかりません。');
    if (!member.kickable) return ephemeral(interaction, 'キックできません（権限・ロールの順位を確認してください）。');

    await member.kick(reason);
    await interaction.reply(`👢 ${user.tag} をキックしました。理由: ${reason}`);
  },
};

const ban = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('メンバーをBANします')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('理由')),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? '理由なし';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) {
      return ephemeral(interaction, 'BANできません（権限・ロールの順位を確認してください）。');
    }

    await interaction.guild.bans.create(user.id, { reason });
    await interaction.reply(`🔨 ${user.tag} をBANしました。理由: ${reason}`);
  },
};

const timeout = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('メンバーをタイムアウトします')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
    .addIntegerOption((o) =>
      o
        .setName('minutes')
        .setDescription('時間（分・1〜40320）')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320),
    )
    .addStringOption((o) => o.setName('reason').setDescription('理由')),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') ?? '理由なし';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return ephemeral(interaction, 'メンバーが見つかりません。');
    if (!member.moderatable) return ephemeral(interaction, 'タイムアウトできません（権限・ロールの順位を確認してください）。');

    await member.timeout(minutes * 60_000, reason);
    await interaction.reply(`⏳ ${user.tag} を${minutes}分間タイムアウトしました。理由: ${reason}`);
  },
};

const addrole = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('メンバーにロールを付与します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('付与するロール').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return ephemeral(interaction, 'メンバーが見つかりません。');

    await member.roles.add(role);
    await interaction.reply(`✅ ${user} に ${role} を付与しました。`);
  },
};

const removerole = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('メンバーからロールを外します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('外すロール').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return ephemeral(interaction, 'メンバーが見つかりません。');

    await member.roles.remove(role);
    await interaction.reply(`✅ ${user} から ${role} を外しました。`);
  },
};

// 1ファイルで複数コマンドを出すため配列で export（utils/load-commands.js が読み込みます）
module.exports = [kick, ban, timeout, addrole, removerole];
