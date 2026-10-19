const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const store = require('../utils/store');

// レベリング：発言でXPがたまり、レベルが上がるとお知らせする
// 連投でXPを稼げないよう、ユーザーごとに60秒のクールダウンを設けています
const KEY = 'levels';
const COOLDOWN_MS = 60_000;
const cooldown = new Map(); // "サーバーID:ユーザーID" -> 最後にXPを得た時刻

const levelOf = (xp) => Math.floor(Math.sqrt(xp / 100));

const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('レベルを確認します')
  .addSubcommand((s) =>
    s
      .setName('rank')
      .setDescription('レベルを表示します')
      .addUserOption((o) => o.setName('user').setDescription('対象（省略すると自分）')),
  )
  .addSubcommand((s) => s.setName('top').setDescription('レベルのランキング（上位10人）を表示します'));

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const levels = store.get(interaction.guildId, KEY) ?? {};

  if (sub === 'top') {
    const top = Object.entries(levels)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10)
      .map(([id, v], i) => `${i + 1}. <@${id}> — Lv.${levelOf(v.xp)}（${v.xp} XP）`);
    return interaction.reply({
      content: top.length ? top.join('\n') : 'まだ記録がありません。',
      flags: MessageFlags.Ephemeral,
    });
  }

  const user = interaction.options.getUser('user') ?? interaction.user;
  const xp = levels[user.id]?.xp ?? 0;
  const embed = new EmbedBuilder()
    .setTitle(`${user.username} のレベル`)
    .setDescription(`Lv.${levelOf(xp)}（${xp} XP）`)
    .setThumbnail(user.displayAvatarURL())
    .setColor(0x5865f2);
  await interaction.reply({ embeds: [embed] });
}

const events = {
  messageCreate: async (message) => {
    if (!message.guild || message.author.bot) return;

    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    if (now - (cooldown.get(key) ?? 0) < COOLDOWN_MS) return;
    cooldown.set(key, now);

    const levels = store.get(message.guild.id, KEY) ?? {};
    const before = levels[message.author.id]?.xp ?? 0;
    const gained = 15 + Math.floor(Math.random() * 11); // 15〜25 XP
    const after = before + gained;
    levels[message.author.id] = { xp: after };
    store.set(message.guild.id, KEY, levels);

    if (levelOf(after) > levelOf(before)) {
      await message.channel
        .send(`🎉 ${message.author} がレベル ${levelOf(after)} になりました！`)
        .catch(() => {});
    }
  },
};

module.exports = { data, execute, events };
