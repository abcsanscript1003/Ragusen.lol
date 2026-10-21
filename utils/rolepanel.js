const { ChannelType, EmbedBuilder } = require('discord.js');

// リアクションロール・ボタンロールで共通の部品
const MAX = 5; // 1パネルあたりの組の数
const DEFAULT_COLOR = 0x5865f2;

// 色の入力（例: #ff0000 / ff0000）。形式が違えば null
function parseColor(input) {
  if (!input) return DEFAULT_COLOR;
  const hex = input.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(hex) ? parseInt(hex, 16) : null;
}

// 共通の任意項目（色・説明文・送信先・選び方）
function addCommon(data) {
  return data
    .addStringOption((o) => o.setName('color').setDescription('埋め込みの色（例: #ff0000）'))
    .addStringOption((o) => o.setName('description').setDescription('パネルの内容（説明文）'))
    .addChannelOption((o) =>
      o.setName('channel').setDescription('送信先（省略時は今のチャンネル）').addChannelTypes(ChannelType.GuildText),
    )
    .addStringOption((o) =>
      o
        .setName('mode')
        .setDescription('選び方（省略時は複数選択できる）')
        .addChoices(
          { name: '複数選択できる', value: 'multi' },
          { name: '1つだけ選べる', value: 'single' },
        ),
    );
}

// 2組目〜5組目（任意）を追加する。keyName は 'emoji' または 'label'
function addExtraPairs(data, keyName) {
  const keyText = keyName === 'emoji' ? '絵文字' : 'ボタンの文字';
  for (let i = 2; i <= MAX; i++) {
    data
      .addStringOption((o) => o.setName(`${keyName}${i}`).setDescription(`${keyText}${i}`))
      .addRoleOption((o) => o.setName(`role${i}`).setDescription(`${i}番目に付与するロール`));
  }
  return data;
}

// 共通項目の読み取り
function readCommon(interaction) {
  return {
    color: parseColor(interaction.options.getString('color')),
    description: interaction.options.getString('description') ?? '',
    channel: interaction.options.getChannel('channel') ?? interaction.channel,
    mode: interaction.options.getString('mode') ?? 'multi',
  };
}

// 絵文字（またはボタンの文字）とロールの組を集める。片方だけはエラー
function collectPairs(interaction, keyName) {
  const keyText = keyName === 'emoji' ? '絵文字' : 'ボタンの文字';
  const pairs = [];
  for (let i = 1; i <= MAX; i++) {
    const key = interaction.options.getString(`${keyName}${i}`);
    const role = interaction.options.getRole(`role${i}`);
    if (key && role) pairs.push({ key: key.trim(), role });
    else if (key || role) return { error: `${keyText}${i}とロール${i}は、セットで入力してください。` };
  }
  return { pairs };
}

// 埋め込みを組み立てる（色・タイトル・説明文・一覧）
function buildEmbed(title, common, lines) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(common.color)
    .setDescription([common.description, '', ...lines].join('\n').trim());
}

module.exports = { MAX, addCommon, addExtraPairs, readCommon, collectPairs, buildEmbed };
