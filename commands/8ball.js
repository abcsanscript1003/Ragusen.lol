const { SlashCommandBuilder } = require('discord.js');

const ANSWERS = ['はい', 'たぶんそう', '未来は明るい', 'いいえ', 'わからない', 'もう一度聞いてください'];
const pick = () => ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

const data = new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('質問に占いで答えます')
  .addStringOption((o) => o.setName('question').setDescription('質問').setRequired(true));

async function execute(interaction) {
  const question = interaction.options.getString('question', true);
  await interaction.reply(`🎱 ${question}\n→ ${pick()}`);
}

// 通常チャットでの反応：botにメンションされたら占って返信する
const events = {
  messageCreate: async (message) => {
    if (message.author.bot) return;
    if (!message.mentions.has(message.client.user)) return;

    const question = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!question) return;
    await message.reply(pick());
  },
};

// /panel のボタンから実行された場合は、質問を入力するよう案内する
async function runFromPanel(interaction) {
  await interaction.reply({
    content: '「/8ball question:（質問）」で実行してください。',
    flags: 64,
  });
}

module.exports = { data, execute, events, runFromPanel };
