const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('退出メッセージを設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((o) =>
    o
      .setName('channel')
      .setDescription('送信先チャンネル')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  )
  .addStringOption((o) =>
    o
      .setName('message')
      .setDescription('本文（{name} {server} が使えます）')
      .setRequired(true),
  )
  .addStringOption((o) => o.setName('image').setDescription('画像のURL（任意）'));

async function execute(interaction) {
  const channel = interaction.options.getChannel('channel', true);
  const message = interaction.options.getString('message', true);
  const image = interaction.options.getString('image');

  store.set(interaction.guildId, 'leave', { channelId: channel.id, message, image });
  await interaction.reply({
    content: `退出メッセージを ${channel} に設定しました。`,
    flags: MessageFlags.Ephemeral,
  });
}

const events = {
  guildMemberRemove: async (member) => {
    const cfg = store.get(member.guild.id, 'leave');
    if (!cfg) return;
    const channel = await member.guild.channels.fetch(cfg.channelId).catch(() => null);
    if (!channel) return;

    // 退出したユーザーはメンションできないので、ユーザー名で表示する
    const text = cfg.message
      .replaceAll('{user}', member.user.username)
      .replaceAll('{name}', member.user.username)
      .replaceAll('{server}', member.guild.name);

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setThumbnail(member.user.displayAvatarURL())
      .setColor(0xed4245);
    if (cfg.image) embed.setImage(cfg.image);

    await channel.send({ embeds: [embed] });
  },
};

module.exports = { data, execute, events };
