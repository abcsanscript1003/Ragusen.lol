const { MessageFlags, SlashCommandBuilder } = require('discord.js');

// 候補からランダムに1つ選ぶ（カンマ「,」または読点「、」で区切る）
const data = new SlashCommandBuilder()
  .setName('choose')
  .setDescription('候補からランダムに1つ選びます')
  .addStringOption((o) =>
    o
      .setName('options')
      .setDescription('候補（例: ラーメン, カレー, 寿司）')
      .setRequired(true),
  );

async function execute(interaction) {
  const list = interaction.options
    .getString('options', true)
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length < 2) {
    return interaction.reply({ content: '候補を2つ以上入力してください。', flags: MessageFlags.Ephemeral });
  }

  const pick = list[Math.floor(Math.random() * list.length)];
  await interaction.reply(`🎲 候補: ${list.join(' / ')}\n→ **${pick}**`);
}

module.exports = { data, execute };
