const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// 提案機能：提案チャンネルへの投稿を埋め込みに変換し、👍👎を付ける
const KEY = 'suggest';

const data = new SlashCommandBuilder()
  .setName('suggest')
  .setDescription('提案チャンネルを設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) =>
    s
      .setName('set')
      .setDescription('提案チャンネルを設定します')
      .addChannelOption((o) =>
        o.setName('channel').setDescription('提案チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      ),
  )
  .addSubcommand((s) => s.setName('off').setDescription('提案機能を止めます'));

async function execute(interaction) {
  if (interaction.options.getSubcommand() === 'off') {
    store.set(interaction.guildId, KEY, null);
    return interaction.reply({ content: '提案機能を停止しました。', flags: MessageFlags.Ephemeral });
  }
  const channel = interaction.options.getChannel('channel', true);
  store.set(interaction.guildId, KEY, { channelId: channel.id });
  await interaction.reply({ content: `提案を ${channel} で受け付けます。`, flags: MessageFlags.Ephemeral });
}

const events = {
  messageCreate: async (message) => {
    if (!message.guild || message.author.bot) return;
    const cfg = store.get(message.guild.id, KEY);
    if (!cfg || cfg.channelId !== message.channel.id) return;

    await message.delete().catch(() => {});
    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setDescription(message.content)
      .setColor(0xfee75c)
      .setTimestamp();
    const sent = await message.channel.send({ embeds: [embed] }).catch(() => null);
    if (sent) {
      await sent.react('👍').catch(() => {});
      await sent.react('👎').catch(() => {});
    }
  },
};

module.exports = { data, execute, events };
