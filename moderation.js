const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { fail, sendLog } = require('../utils');

const kick = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('メンバーをキックします')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('理由'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),
  async execute(i) {
    const member = i.options.getMember('user');
    const reason = i.options.getString('reason') ?? '理由なし';
    if (!member) return fail(i, 'サーバー内のメンバーを指定してください。');
    if (!member.kickable) return fail(i, 'そのメンバーはキックできません（権限またはロールの順位が足りません）。');
    await member.kick(reason);
    await sendLog(i.guild, `👢 ${member.user.tag} をキック（理由: ${reason}／実行者: ${i.user.tag}）`);
    return i.reply(`${member.user.tag} をキックしました。`);
  },
};

const ban = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('メンバーをBANします')
    .addUserOption((o) => o.setName('user').setDescription('対象のユーザー').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('理由'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),
  async execute(i) {
    const user = i.options.getUser('user');
    const reason = i.options.getString('reason') ?? '理由なし';
    const member = i.options.getMember('user');
    if (member && !member.bannable) return fail(i, 'そのメンバーはBANできません（権限またはロールの順位が足りません）。');
    await i.guild.members.ban(user.id, { reason });
    await sendLog(i.guild, `🔨 ${user.tag} をBAN（理由: ${reason}／実行者: ${i.user.tag}）`);
    return i.reply(`${user.tag} をBANしました。`);
  },
};

const timeout = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('メンバーを一定時間発言できなくします')
    .addUserOption((o) => o.setName('user').setDescription('対象のメンバー').setRequired(true))
    .addIntegerOption((o) =>
      o.setName('minutes').setDescription('時間（分・1〜40320）').setRequired(true).setMinValue(1).setMaxValue(40320),
    )
    .addStringOption((o) => o.setName('reason').setDescription('理由'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  async execute(i) {
    const member = i.options.getMember('user');
    const minutes = i.options.getInteger('minutes');
    const reason = i.options.getString('reason') ?? '理由なし';
    if (!member) return fail(i, 'サーバー内のメンバーを指定してください。');
    if (!member.moderatable) return fail(i, 'そのメンバーはタイムアウトできません。');
    await member.timeout(minutes * 60 * 1000, reason);
    await sendLog(i.guild, `⏳ ${member.user.tag} を${minutes}分タイムアウト（理由: ${reason}／実行者: ${i.user.tag}）`);
    return i.reply(`${member.user.tag} を${minutes}分間タイムアウトしました。`);
  },
};

const purge = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('このチャンネルのメッセージをまとめて削除します')
    .addIntegerOption((o) =>
      o.setName('amount').setDescription('削除する件数（1〜100）').setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),
  async execute(i) {
    const amount = i.options.getInteger('amount');
    // 14日より古いメッセージは一括削除できないため、件数が減ることがあります
    const deleted = await i.channel.bulkDelete(amount, true);
    await sendLog(i.guild, `🧹 ${i.channel.name} で ${deleted.size}件削除（実行者: ${i.user.tag}）`);
    return i.reply({ content: `${deleted.size}件削除しました。`, flags: MessageFlags.Ephemeral });
  },
};

const slowmode = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('このチャンネルの低速モードを設定します（0で解除）')
    .addIntegerOption((o) =>
      o.setName('seconds').setDescription('間隔（秒・0〜21600）').setRequired(true).setMinValue(0).setMaxValue(21600),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  async execute(i) {
    const seconds = i.options.getInteger('seconds');
    await i.channel.setRateLimitPerUser(seconds);
    return i.reply(seconds === 0 ? '低速モードを解除しました。' : `低速モードを${seconds}秒に設定しました。`);
  },
};

module.exports = [kick, ban, timeout, purge, slowmode];
