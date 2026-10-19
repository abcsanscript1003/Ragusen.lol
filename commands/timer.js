const { MessageFlags, SlashCommandBuilder } = require('discord.js');

// タイマー：指定した時間の後に、このチャンネルへメッセージを送る
// 注: 予定はメモリ上で管理するため、botを再起動すると消えます。
const data = new SlashCommandBuilder()
  .setName('timer')
  .setDescription('指定した時間後にメッセージを送ります')
  .addIntegerOption((o) =>
    o.setName('minutes').setDescription('何分後か（1〜10080）').setMinValue(1).setMaxValue(10080).setRequired(true),
  )
  .addStringOption((o) => o.setName('message').setDescription('送るメッセージ').setRequired(true));

async function execute(interaction) {
  const minutes = interaction.options.getInteger('minutes', true);
  const text = interaction.options.getString('message', true);
  const channel = interaction.channel;

  await interaction.reply({
    content: `⏰ ${minutes}分後にこのチャンネルへ送信します。`,
    flags: MessageFlags.Ephemeral,
  });
  setTimeout(() => {
    channel?.send(`⏰ ${text}`).catch(() => {});
  }, minutes * 60_000);
}

module.exports = { data, execute };
