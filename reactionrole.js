const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../utils/store');

// リアクションロール：指定メッセージに特定の絵文字を付けた人にロールを付与・解除する
// 保存形式: { "メッセージID": { "絵文字キー": "ロールID" } }
const KEY = 'reactionroles';

// カスタム絵文字 <:name:id> は ID、通常の絵文字はそのまま文字を使う
function emojiKey(input) {
  const custom = input.match(/<a?:\w+:(\d+)>/);
  return custom ? custom[1] : input.trim();
}

const data = new SlashCommandBuilder()
  .setName('reactionrole')
  .setDescription('リアクションロールを設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((s) =>
    s
      .setName('add')
      .setDescription('メッセージに絵文字とロールを紐づけます')
      .addStringOption((o) => o.setName('message_id').setDescription('対象メッセージのID').setRequired(true))
      .addStringOption((o) => o.setName('emoji').setDescription('絵文字').setRequired(true))
      .addRoleOption((o) => o.setName('role').setDescription('付与するロール').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('remove')
      .setDescription('紐づけを解除します')
      .addStringOption((o) => o.setName('message_id').setDescription('対象メッセージのID').setRequired(true))
      .addStringOption((o) => o.setName('emoji').setDescription('絵文字').setRequired(true)),
  );

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const messageId = interaction.options.getString('message_id', true);
  const key = emojiKey(interaction.options.getString('emoji', true));
  const all = store.get(interaction.guildId, KEY) ?? {};
  const map = all[messageId] ?? {};

  if (sub === 'add') {
    const role = interaction.options.getRole('role', true);
    map[key] = role.id;
    store.set(interaction.guildId, KEY, { ...all, [messageId]: map });
    return interaction.reply({ content: `✅ 紐づけました（${role}）。`, flags: MessageFlags.Ephemeral });
  }

  delete map[key];
  store.set(interaction.guildId, KEY, { ...all, [messageId]: map });
  return interaction.reply({ content: '✅ 紐づけを解除しました。', flags: MessageFlags.Ephemeral });
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
