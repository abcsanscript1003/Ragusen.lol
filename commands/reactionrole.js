const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../utils/store');
const {
  addCommon,
  addExtraPairs,
  buildEmbed,
  collectPairs,
  readCommon,
} = require('../utils/rolepanel');

// リアクションロール（埋め込みパネル・絵文字で選ぶ）
// 保存形式: { "メッセージID": { mode: "multi" | "single", map: { "絵文字キー": "ロールID" } } }
const KEY = 'reactionroles';

// カスタム絵文字 <:name:id> は ID、通常の絵文字はそのまま文字を使う
function emojiKey(input) {
  const custom = input.match(/<a?:\w+:(\d+)>/);
  return custom ? custom[1] : input.trim();
}

// リアクションに付けるときの形式（カスタム絵文字は name:id）
function reactable(input) {
  const custom = input.match(/^<a?:(\w+):(\d+)>$/);
  return custom ? `${custom[1]}:${custom[2]}` : input.trim();
}

// Discordの仕様上、必須の項目は任意の項目より前に置く
const data = new SlashCommandBuilder()
  .setName('reactionrole')
  .setDescription('埋め込みで絵文字を選ぶリアクションロールのパネルを作成します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addStringOption((o) => o.setName('title').setDescription('パネルのタイトル').setRequired(true))
  .addStringOption((o) => o.setName('emoji1').setDescription('絵文字1').setRequired(true))
  .addRoleOption((o) => o.setName('role1').setDescription('絵文字1で付与するロール').setRequired(true));
addExtraPairs(addCommon(data), 'emoji');

async function execute(interaction) {
  const title = interaction.options.getString('title', true);
  const common = readCommon(interaction);
  if (common.color === null) {
    return interaction.reply({ content: '色の形式が正しくありません（例: #ff0000）。', flags: MessageFlags.Ephemeral });
  }

  const { pairs, error } = collectPairs(interaction, 'emoji');
  if (error) return interaction.reply({ content: error, flags: MessageFlags.Ephemeral });

  const keys = pairs.map((p) => emojiKey(p.key));
  if (new Set(keys).size !== keys.length) {
    return interaction.reply({ content: '同じ絵文字が重複しています。', flags: MessageFlags.Ephemeral });
  }

  const lines = pairs.map((p) => `${p.key}　${p.role}`);
  const msg = await common.channel.send({ embeds: [buildEmbed(title, common, lines)] });

  // 絵文字を順に付ける（失敗したものは後で報告）
  const failed = [];
  for (const p of pairs) {
    await msg.react(reactable(p.key)).catch(() => failed.push(p.key));
  }

  const map = {};
  pairs.forEach((p, i) => (map[keys[i]] = p.role.id));
  const all = store.get(interaction.guildId, KEY) ?? {};
  store.set(interaction.guildId, KEY, { ...all, [msg.id]: { mode: common.mode, map } });

  const modeText = common.mode === 'single' ? '（1つだけ選べます）' : '（複数選択できます）';
  const note = failed.length ? `\n⚠️ 次の絵文字は付けられませんでした: ${failed.join(' ')}` : '';
  await interaction.reply({
    content: `✅ ${common.channel} にパネルを作成しました${modeText}。${note}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handle(reaction, user, add) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  if (user.partial) await user.fetch().catch(() => null);

  const msg = reaction.message;
  const guild = msg.guild;
  if (!guild) return;
  const cfg = store.get(guild.id, KEY)?.[msg.id];
  if (!cfg) return;

  const k = reaction.emoji.id ?? reaction.emoji.name;
  const roleId = cfg.map[k];
  if (!roleId) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  if (!add) {
    await member.roles.remove(roleId).catch(() => {});
    return;
  }

  // 1つだけモード：同じパネルの他の絵文字は外す（リアクションとロールの両方）
  if (cfg.mode === 'single') {
    for (const [otherKey, otherRole] of Object.entries(cfg.map)) {
      if (otherKey === k) continue;
      const other = msg.reactions.cache.find((r) => (r.emoji.id ?? r.emoji.name) === otherKey);
      if (other) await other.users.remove(user.id).catch(() => {});
      await member.roles.remove(otherRole).catch(() => {});
    }
  }
  await member.roles.add(roleId).catch(() => {});
}

const events = {
  messageReactionAdd: (reaction, user) => handle(reaction, user, true),
  messageReactionRemove: (reaction, user) => handle(reaction, user, false),
};

module.exports = { data, execute, events };
