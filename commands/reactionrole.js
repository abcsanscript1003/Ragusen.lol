const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// リアクションロール（埋め込みパネル）
// /reactionrole でタイトル・説明文・「絵文字 → ロール」の組を指定すると、
// 埋め込みメッセージを送信し、その絵文字を自動で付けます。
// 押した人にロールを付与し、外した人からロールを外します。
// 保存形式: { "メッセージID": { "絵文字キー": "ロールID" } }
const KEY = 'reactionroles';
const MAX = 5; // 1パネルあたりの組の数

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

// Discordの仕様上、必須の項目は任意の項目より前に置く必要がある
const data = new SlashCommandBuilder()
  .setName('reactionrole')
  .setDescription('埋め込みでリアクションロールのパネルを作成します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addStringOption((o) => o.setName('title').setDescription('パネルのタイトル').setRequired(true))
  .addStringOption((o) => o.setName('emoji1').setDescription('絵文字1').setRequired(true))
  .addRoleOption((o) => o.setName('role1').setDescription('絵文字1で付与するロール').setRequired(true))
  .addStringOption((o) => o.setName('description').setDescription('パネルの説明文'))
  .addChannelOption((o) =>
    o.setName('channel').setDescription('送信先（省略時は今のチャンネル）').addChannelTypes(ChannelType.GuildText),
  );

for (let i = 2; i <= MAX; i++) {
  data
    .addStringOption((o) => o.setName(`emoji${i}`).setDescription(`絵文字${i}`))
    .addRoleOption((o) => o.setName(`role${i}`).setDescription(`絵文字${i}で付与するロール`));
}

async function execute(interaction) {
  const title = interaction.options.getString('title', true);
  const description = interaction.options.getString('description') ?? '';
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  // 絵文字とロールの組を集める（片方だけの入力はエラー）
  const pairs = [];
  for (let i = 1; i <= MAX; i++) {
    const emoji = interaction.options.getString(`emoji${i}`);
    const role = interaction.options.getRole(`role${i}`);
    if (emoji && role) pairs.push({ emoji: emoji.trim(), role });
    else if (emoji || role) {
      return interaction.reply({
        content: `絵文字${i}とロール${i}は、セットで入力してください。`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  const keys = pairs.map((p) => emojiKey(p.emoji));
  if (new Set(keys).size !== keys.length) {
    return interaction.reply({ content: '同じ絵文字が重複しています。', flags: MessageFlags.Ephemeral });
  }

  // パネルの本文：説明文 + 「絵文字 ロール名」の一覧
  const lines = pairs.map((p) => `${p.emoji}　${p.role}`);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription([description, '', ...lines].join('\n').trim())
    .setColor(0x5865f2);

  const msg = await channel.send({ embeds: [embed] });

  // 絵文字を順に付ける（失敗したものは後で報告）
  const failed = [];
  for (const p of pairs) {
    await msg.react(reactable(p.emoji)).catch(() => failed.push(p.emoji));
  }

  // 保存（成功・失敗にかかわらず、組を登録する）
  const map = {};
  for (const p of pairs) map[emojiKey(p.emoji)] = p.role.id;
  const all = store.get(interaction.guildId, KEY) ?? {};
  store.set(interaction.guildId, KEY, { ...all, [msg.id]: map });

  const note = failed.length ? `\n⚠️ 次の絵文字は付けられませんでした: ${failed.join(' ')}` : '';
  await interaction.reply({
    content: `✅ ${channel} にパネルを作成しました。${note}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handle(reaction, user, add) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  if (user.partial) await user.fetch().catch(() => null);

  const guild = reaction.message.guild;
  if (!guild) return;
  const map = store.get(guild.id, KEY)?.[reaction.message.id];
  const roleId = map?.[reaction.emoji.id ?? reaction.emoji.name];
  if (!roleId) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;
  if (add) await member.roles.add(roleId).catch(() => {});
  else await member.roles.remove(roleId).catch(() => {});
}

const events = {
  messageReactionAdd: (reaction, user) => handle(reaction, user, true),
  messageReactionRemove: (reaction, user) => handle(reaction, user, false),
};

module.exports = { data, execute, events };
