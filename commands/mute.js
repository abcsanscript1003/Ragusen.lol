const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

// ミュート：「Muted」ロールを付けて、全テキストチャンネルで発言できなくする
// （タイムアウトとは別の、ロールによるミュートです）
const ROLE_NAME = 'Muted';

async function getMutedRole(guild) {
  let role = guild.roles.cache.find((r) => r.name === ROLE_NAME);
  if (role) return role;

  role = await guild.roles.create({ name: ROLE_NAME, permissions: [], reason: 'ミュート用ロール' });
  const channels = await guild.channels.fetch();
  await Promise.all(
    channels
      .filter((c) => c && c.type === ChannelType.GuildText)
      .map((c) =>
        c.permissionOverwrites
          .edit(role, { SendMessages: false, AddReactions: false })
          .catch(() => {}),
      ),
  );
  return role;
}

const mute = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('メンバーをミュートします（全員に見えます）')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
    .addIntegerOption((o) =>
      o.setName('minutes').setDescription('時間（分）。省略すると解除するまで').setMinValue(1).setMaxValue(10080),
    )
    .addStringOption((o) => o.setName('reason').setDescription('理由')),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') ?? '理由なし';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'メンバーが見つかりません。', ephemeral: true });

    const role = await getMutedRole(interaction.guild);
    await member.roles.add(role, reason);

    // 時間指定があれば、その時間後に自動で解除する（botの再起動で予定は消えます）
    if (minutes) {
      setTimeout(() => member.roles.remove(role).catch(() => {}), minutes * 60_000);
    }
    const when = minutes ? `${minutes}分間` : '解除されるまで';
    await interaction.reply(`🔇 ${user} を${when}ミュートしました。理由: ${reason}`);
  },
};

const unmute = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('ミュートを解除します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const role = interaction.guild.roles.cache.find((r) => r.name === ROLE_NAME);
    if (!member || !role) return interaction.reply({ content: '対象が見つからないか、ミュートされていません。', ephemeral: true });

    await member.roles.remove(role);
    await interaction.reply(`🔊 ${user} のミュートを解除しました。`);
  },
};

module.exports = [mute, unmute];
