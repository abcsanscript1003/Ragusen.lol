const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// 文章中の {user}（メンション）、{name}（ユーザー名）、{server}（サーバー名）を置き換える
function format(template, member) {
  return template
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{name}', member.user.username)
    .replaceAll('{server}', member.guild.name);
}

const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('入室メッセージを設定します')
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
      .setDescription('本文（{user} {name} {server} が使えます）')
      .setRequired(true),
  )
  .addStringOption((o) => o.setName('image').setDescription('画像のURL（任意）'));

async function execute(interaction) {
  const channel = interaction.options.getChannel('channel', true);
  const message = interaction.options.getString('message', true);
  const image = interaction.options.getString('image');

  store.set(interaction.guildId, 'welcome', { channelId: channel.id, message, image });
  await interaction.reply({
    content: `入室メッセージを ${channel} に設定しました。`,
    flags: MessageFlags.Ephemeral,
  });
}

const events = {
  guildMemberAdd: async (member) => {
    const cfg = store.get(member.guild.id, 'welcome');
    if (!cfg) return;
    const channel = await member.guild.channels.fetch(cfg.channelId).catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setDescription(format(cfg.message, member))
      .setThumbnail(member.user.displayAvatarURL())
      .setColor(0x57f287);
    if (cfg.image) embed.setImage(cfg.image);

    await channel.send({ embeds: [embed] });
  },
};

module.exports = { data, execute, events, format };
