const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../utils/store');

// 警告の記録（サーバーごと・ユーザーごとに保存）
const KEY = 'warnings';

const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('警告を管理します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addSubcommand((s) =>
    s
      .setName('add')
      .setDescription('警告を与えます（全員に見えます）')
      .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('理由')),
  )
  .addSubcommand((s) =>
    s
      .setName('list')
      .setDescription('警告の履歴を表示します（本人にだけ見えます）')
      .addUserOption((o) => o.setName('user').setDescription('対象').setRequired(true)),
  );

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const user = interaction.options.getUser('user', true);
  const all = store.get(interaction.guildId, KEY) ?? {};
  const list = all[user.id] ?? [];

  if (sub === 'add') {
    const reason = interaction.options.getString('reason') ?? '理由なし';
    list.push({ reason, at: Date.now(), by: interaction.user.id });
    store.set(interaction.guildId, KEY, { ...all, [user.id]: list });
    return interaction.reply(`⚠️ ${user} に警告しました（累計${list.length}件）。理由: ${reason}`);
  }

  const text = list.length
    ? list.map((w, i) => `${i + 1}. ${w.reason}（${new Date(w.at).toLocaleDateString('ja-JP')}）`).join('\n')
    : '警告はありません。';
  return interaction.reply({
    content: `${user} の警告履歴:\n${text}`,
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { data, execute };
