const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../utils/store');

// 自動返信：特定の言葉を含む投稿に、決まった返信をする
// タグ：よく使う定型文を /tag で呼び出す
const AR_KEY = 'autoreply';
const TAG_KEY = 'tags';

const autoreply = {
  data: new SlashCommandBuilder()
    .setName('autoreply')
    .setDescription('自動返信を設定します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('自動返信を追加します')
        .addStringOption((o) => o.setName('trigger').setDescription('反応する言葉').setRequired(true))
        .addStringOption((o) => o.setName('response').setDescription('返信する内容').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('自動返信を削除します')
        .addStringOption((o) => o.setName('trigger').setDescription('反応する言葉').setRequired(true)),
    )
    .addSubcommand((s) => s.setName('list').setDescription('自動返信の一覧を表示します')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const list = store.get(guildId, AR_KEY) ?? [];
    const say = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

    if (sub === 'list') {
      return say(list.length ? list.map((r) => `・「${r.trigger}」→「${r.response}」`).join('\n') : '自動返信はありません。');
    }

    const trigger = interaction.options.getString('trigger', true).toLowerCase();
    if (sub === 'remove') {
      store.set(guildId, AR_KEY, list.filter((r) => r.trigger !== trigger));
      return say(`「${trigger}」の自動返信を削除しました。`);
    }

    const response = interaction.options.getString('response', true);
    const next = list.filter((r) => r.trigger !== trigger);
    next.push({ trigger, response });
    store.set(guildId, AR_KEY, next);
    await say(`「${trigger}」に反応して返信するようにしました。`);
  },

  events: {
    messageCreate: async (message) => {
      if (!message.guild || message.author.bot) return;
      const list = store.get(message.guild.id, AR_KEY) ?? [];
      const lower = message.content.toLowerCase();
      const hit = list.find((r) => lower.includes(r.trigger));
      if (hit) await message.channel.send(hit.response).catch(() => {});
    },
  },
};

const tag = {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('タグ（定型文）を管理します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('タグを作成します')
        .addStringOption((o) => o.setName('name').setDescription('タグ名').setRequired(true))
        .addStringOption((o) => o.setName('text').setDescription('内容').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('タグを削除します')
        .addStringOption((o) => o.setName('name').setDescription('タグ名').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('show')
        .setDescription('タグの内容を表示します（全員に見えます）')
        .addStringOption((o) => o.setName('name').setDescription('タグ名').setRequired(true)),
    )
    .addSubcommand((s) => s.setName('list').setDescription('タグの一覧を表示します')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const tags = store.get(guildId, TAG_KEY) ?? {};

    if (sub === 'list') {
      const names = Object.keys(tags);
      return interaction.reply({
        content: names.length ? names.join(', ') : 'タグはありません。',
        flags: MessageFlags.Ephemeral,
      });
    }

    const name = interaction.options.getString('name', true).toLowerCase();

    if (sub === 'add') {
      const text = interaction.options.getString('text', true);
      store.set(guildId, TAG_KEY, { ...tags, [name]: text });
      return interaction.reply({ content: `タグ「${name}」を保存しました。`, flags: MessageFlags.Ephemeral });
    }

    if (sub === 'remove') {
      delete tags[name];
      store.set(guildId, TAG_KEY, tags);
      return interaction.reply({ content: `タグ「${name}」を削除しました。`, flags: MessageFlags.Ephemeral });
    }

    // show
    const text = tags[name];
    if (!text) return interaction.reply({ content: `タグ「${name}」は見つかりません。`, flags: MessageFlags.Ephemeral });
    await interaction.reply(text);
  },
};

module.exports = [autoreply, tag];
