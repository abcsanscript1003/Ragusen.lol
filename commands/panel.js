const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} = require('discord.js');

// [コマンド名, ボタンの表示名]
const FEATURES = [
  ['welcome', 'ウェルカム'],
  ['leave', '退出メッセージ'],
  ['warn', '警告'],
  ['mute', 'ミュート'],
  ['kick', 'キック'],
  ['ban', 'BAN'],
  ['timeout', 'タイムアウト'],
  ['antiraid', '荒らし対策'],
  ['log', 'ログ'],
  ['level', 'レベル'],
  ['reactionrole', 'リアクションロール'],
  ['notify', 'SNS通知'],
  ['embed', '埋め込み'],
  ['automod', '自動モデレーション'],
  ['suggest', '提案'],
  ['autoreply', '自動返信'],
  ['addrole', 'ロール付与'],
  ['removerole', 'ロール削除'],
  ['roleall', 'ロール一括'],
  ['channel', 'チャンネル管理'],
  ['timer', 'タイマー'],
  ['8ball', '8ball'],
  ['name', 'ボット名変更'],
  ['choose', '選択'],
  ['tag', 'タグ'],
];

const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('機能一覧を表示します（本人にだけ見えます）');

async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('機能一覧')
    .setDescription('ボタンを押すと、対応する機能を実行します。')
    .setColor(0x5865f2);

  const rows = [];
  for (let i = 0; i < FEATURES.length; i += 5) {
    rows.push(
      new ActionRowBuilder().addComponents(
        FEATURES.slice(i, i + 5).map(([name, label]) =>
          new ButtonBuilder()
            .setCustomId(`panel:${name}`)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary),
        ),
      ),
    );
  }

  await interaction.reply({
    embeds: [embed],
    components: rows,
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { data, execute, FEATURES };
