const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');

// 機能一覧：ボタンは使わず、各機能の説明を1行ずつ表示する（本人にだけ見えます）
const FEATURES = [
  ['welcome', '入室メッセージ。画像・ユーザー名・アバターを含めて送れます'],
  ['leave', '退出メッセージ。入室と同じく、画像・ユーザー名・アバターを含められます'],
  ['warn', '警告を出します。警告の履歴は本人にだけ見えます'],
  ['mute', 'メンバーをミュートします。時間を指定すると自動で解除されます'],
  ['unmute', 'ミュートを解除します'],
  ['kick', 'メンバーをキックします（全員に見えます）'],
  ['ban', 'メンバーをBANします（全員に見えます）'],
  ['timeout', 'メンバーをタイムアウトします（全員に見えます）'],
  ['antiraid', '短時間の大量参加や、作成直後のアカウントを自動でキックします'],
  ['log', '削除・編集・入退室・ロール変更・BANなどを、指定チャンネルに記録します'],
  ['level', '発言でXPがたまり、レベルが上がるとお知らせします。ランキングも見られます'],
  ['reactionrole', '埋め込みパネルを作り、絵文字を押した人にロールを付与します'],
  ['buttonrole', '埋め込みパネルを作り、ボタンを押した人にロールを付与します'],
  ['notify', 'YouTubeの新着動画を、指定チャンネルに通知します'],
  ['embed', '埋め込みまたは文字のみでメッセージを送ります。送信先も選べます'],
  ['automod', '禁止ワード・リンク・連投を自動で削除します'],
  ['suggest', '提案チャンネルの投稿を埋め込みにして、👍👎を付けます'],
  ['autoreply', '特定の言葉に反応して、決まった返信をします'],
  ['tag', 'よく使う定型文を保存して、名前で呼び出せます'],
  ['addrole', 'メンバーにロールを付与します（全員に見えます）'],
  ['removerole', 'メンバーからロールを外します（全員に見えます）'],
  ['roleall', '全員にロールを付与・解除します'],
  ['channel', 'チャンネルの作成・削除・名前変更・トピック・低速モード・投稿禁止を行います'],
  ['timer', '指定した時間の後に、このチャンネルへメッセージを送ります'],
  ['8ball', '質問に占いで答えます。botにメンションしても反応します'],
  ['choose', '候補の中からランダムに1つ選びます'],
  ['name', 'このサーバーでのボットの名前を変更します'],
];

const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('機能一覧を表示します（本人にだけ見えます）');

async function execute(interaction) {
  const lines = FEATURES.map(([name, text]) => `**/${name}**\n${text}`);

  const embed = new EmbedBuilder()
    .setTitle('機能一覧')
    .setDescription(['使いたい機能を、スラッシュ（/）から入力してください。', '', ...lines].join('\n\n'))
    .setColor(0x5865f2);

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { data, execute, FEATURES };
