const {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// 荒らし・レイド対策：短時間に大量参加した場合や、作成されて間もないアカウントをキックする
const KEY = 'antiraid';
const joins = new Map(); // サーバーID -> 参加時刻の配列（メモリ上のみ）

function getCfg(guildId) {
  return { enabled: false, count: 5, seconds: 10, minAgeDays: 0, ...store.get(guildId, KEY) };
}

const data = new SlashCommandBuilder()
  .setName('antiraid')
  .setDescription('荒らし・レイド対策を設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) =>
    s
      .setName('set')
      .setDescription('対策を設定します')
      .addBooleanOption((o) => o.setName('enabled').setDescription('オンにするか').setRequired(true))
      .addIntegerOption((o) =>
        o.setName('count').setDescription('この人数以上が短時間に参加したら対策（初期値5）').setMinValue(2).setMaxValue(50),
      )
      .addIntegerOption((o) =>
        o.setName('seconds').setDescription('何秒以内か（初期値10）').setMinValue(3).setMaxValue(120),
      )
      .addIntegerOption((o) =>
        o.setName('min_age_days').setDescription('アカウント作成からこの日数未満の参加者をキック（0で無効）').setMinValue(0).setMaxValue(365),
      ),
  );

async function execute(interaction) {
  const guildId = interaction.guildId;
  const cfg = getCfg(guildId);
  cfg.enabled = interaction.options.getBoolean('enabled', true);
  cfg.count = interaction.options.getInteger('count') ?? cfg.count;
  cfg.seconds = interaction.options.getInteger('seconds') ?? cfg.seconds;
  cfg.minAgeDays = interaction.options.getInteger('min_age_days') ?? cfg.minAgeDays;
  store.set(guildId, KEY, cfg);

  await interaction.reply({
    content: `荒らし対策: ${cfg.enabled ? 'オン' : 'オフ'}（${cfg.seconds}秒に${cfg.count}人以上で対策／作成から${cfg.minAgeDays}日未満は参加拒否）`,
    flags: MessageFlags.Ephemeral,
  });
}

const events = {
  guildMemberAdd: async (member) => {
    const cfg = getCfg(member.guild.id);
    if (!cfg.enabled) return;

    const now = Date.now();
    const key = member.guild.id;
    const recent = (joins.get(key) ?? []).filter((t) => now - t < cfg.seconds * 1000);
    recent.push(now);
    joins.set(key, recent);

    const raid = recent.length >= cfg.count;
    const tooNew = cfg.minAgeDays > 0 && now - member.user.createdTimestamp < cfg.minAgeDays * 86_400_000;
    if (!raid && !tooNew) return;

    const reason = raid ? '荒らし対策（短時間の大量参加）' : '荒らし対策（アカウントが新しすぎる）';
    await member.kick(reason).catch(() => {});
  },
};

module.exports = { data, execute, events };
