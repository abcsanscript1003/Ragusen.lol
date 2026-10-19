const {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// 自動モデレーション：禁止ワード・リンク・連投（スパム）を検知して投稿を削除する
const KEY = 'automod';
const LINK = /https?:\/\/\S+|discord\.gg\/\S+/i;
const SPAM_WINDOW_MS = 5000; // この時間内に
const SPAM_LIMIT = 5; // これ以上投稿したら連投とみなす
const recent = new Map(); // "サーバーID:ユーザーID" -> 投稿時刻の配列（メモリ上のみ）

function getCfg(guildId) {
  return { words: [], links: false, spam: false, ...store.get(guildId, KEY) };
}

function saveCfg(guildId, cfg) {
  store.set(guildId, KEY, cfg);
}

const data = new SlashCommandBuilder()
  .setName('automod')
  .setDescription('自動モデレーションを設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) =>
    s
      .setName('word-add')
      .setDescription('禁止ワードを追加します')
      .addStringOption((o) => o.setName('word').setDescription('禁止ワード').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('word-remove')
      .setDescription('禁止ワードを削除します')
      .addStringOption((o) => o.setName('word').setDescription('禁止ワード').setRequired(true)),
  )
  .addSubcommand((s) => s.setName('words').setDescription('禁止ワードの一覧を表示します'))
  .addSubcommand((s) =>
    s
      .setName('links')
      .setDescription('リンクの投稿を禁止するか切り替えます')
      .addBooleanOption((o) => o.setName('enabled').setDescription('オンにする場合はtrue').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('spam')
      .setDescription('連投（スパム）対策を切り替えます')
      .addBooleanOption((o) => o.setName('enabled').setDescription('オンにする場合はtrue').setRequired(true)),
  );

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const cfg = getCfg(guildId);
  const say = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

  if (sub === 'word-add') {
    const word = interaction.options.getString('word', true).toLowerCase();
    if (!cfg.words.includes(word)) cfg.words.push(word);
    saveCfg(guildId, cfg);
    return say(`禁止ワードに「${word}」を追加しました。`);
  }

  if (sub === 'word-remove') {
    const word = interaction.options.getString('word', true).toLowerCase();
    cfg.words = cfg.words.filter((w) => w !== word);
    saveCfg(guildId, cfg);
    return say(`禁止ワードから「${word}」を削除しました。`);
  }

  if (sub === 'words') {
    return say(cfg.words.length ? cfg.words.join(', ') : '禁止ワードは登録されていません。');
  }

  if (sub === 'links') {
    cfg.links = interaction.options.getBoolean('enabled', true);
    saveCfg(guildId, cfg);
    return say(`リンクの禁止: ${cfg.links ? 'オン' : 'オフ'}`);
  }

  if (sub === 'spam') {
    cfg.spam = interaction.options.getBoolean('enabled', true);
    saveCfg(guildId, cfg);
    return say(`連投対策: ${cfg.spam ? 'オン' : 'オフ'}`);
  }
}

function isSpam(message) {
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const times = (recent.get(key) ?? []).filter((t) => now - t < SPAM_WINDOW_MS);
  times.push(now);
  recent.set(key, times);
  return times.length > SPAM_LIMIT;
}

const events = {
  messageCreate: async (message) => {
    if (!message.guild || message.author.bot) return;
    // 管理者（メッセージ管理権限を持つ人）は対象外
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    // 注: 投稿のたびに設定を読み込みます。規模が大きくなったらキャッシュしてください。
    const cfg = getCfg(message.guild.id);
    const lower = message.content.toLowerCase();

    let reason = null;
    if (cfg.words.some((w) => lower.includes(w))) reason = '禁止ワード';
    else if (cfg.links && LINK.test(message.content)) reason = 'リンク';
    else if (cfg.spam && isSpam(message)) reason = '連投';
    if (!reason) return;

    await message.delete().catch(() => {});
    const warn = await message.channel
      .send(`${message.author} ${reason}は禁止されています。`)
      .catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);
  },
};

module.exports = { data, execute, events };
