const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('メッセージを送信します（文字のみ / 埋め込み）')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption((o) =>
    o.setName('text').setDescription('本文').setRequired(true),
  )
  .addStringOption((o) =>
    o
      .setName('mode')
      .setDescription('送信形式（省略時は文字のみ）')
      .addChoices(
        { name: '文字のみ', value: 'plain' },
        { name: '埋め込み', value: 'embed' },
      ),
  )
  .addChannelOption((o) =>
    o
      .setName('channel')
      .setDescription('送信先（省略時は今のチャンネル）')
      .addChannelTypes(ChannelType.GuildText),
  );

async function execute(interaction) {
  const text = interaction.options.getString('text', true);
  const mode = interaction.options.getString('mode') ?? 'plain';
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  const payload =
    mode === 'embed'
      ? { embeds: [new EmbedBuilder().setDescription(text).setColor(0x5865f2)] }
      : { content: text };

  await channel.send(payload);
  await interaction.reply({
    content: `${channel} に送信しました。`,
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { data, execute };
