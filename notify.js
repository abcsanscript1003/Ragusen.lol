const {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// SNS通知：YouTubeの新着動画を通知する（YouTubeのRSSを5分ごとに確認。APIキーは不要）
// X・Twitchなどは、それぞれAPIキーが必要なため、後から追加します。
const KEY = 'notify';
const INTERVAL_MS = 5 * 60_000;

const data = new SlashCommandBuilder()
  .setName('notify')
  .setDescription('SNSの新着通知を設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) =>
    s
      .setName('youtube-add')
      .setDescription('YouTubeチャンネルの新着動画を通知します')
      .addStringOption((o) =>
        o.setName('channel_id').setDescription('YouTubeチャンネルID（UCで始まる）').setRequired(true),
      )
      .addChannelOption((o) =>
        o.setName('channel').setDescription('通知先チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('youtube-remove')
      .setDescription('YouTubeの通知を止めます')
      .addStringOption((o) => o.setName('channel_id').setDescription('YouTubeチャンネルID').setRequired(true)),
  )
  .addSubcommand((s) => s.setName('list').setDescription('通知の設定一覧を表示します'));

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const list = store.get(guildId, KEY) ?? [];
  const say = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

  if (sub === 'list') {
    return say(list.length ? list.map((s) => `・${s.youtubeId} → <#${s.discordChannelId}>`).join('\n') : '設定はありません。');
  }

  const ytId = interaction.options.getString('channel_id', true).trim();

  if (sub === 'youtube-remove') {
    store.set(guildId, KEY, list.filter((s) => s.youtubeId !== ytId));
    return say('通知を止めました。');
  }

  if (!/^UC[\w-]{20,}$/.test(ytId)) {
    return say('チャンネルIDの形式が正しくありません（UCで始まる文字列です）。');
  }
  const channel = interaction.options.getChannel('channel', true);
  const next = list.filter((s) => s.youtubeId !== ytId);
  // lastVideoId が null の場合、最初の確認では通知せず、最新動画を記録するだけにする
  next.push({ youtubeId: ytId, discordChannelId: channel.id, lastVideoId: null });
  store.set(guildId, KEY, next);
  await say(`✅ ${channel} に新着動画を通知します（設定直後の動画は通知されません）。`);
}

async function fetchLatest(ytId) {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ytId}`);
  if (!res.ok) return null;
  const xml = await res.text();
  const m = xml.match(
    /<entry>[\s\S]*?<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link rel="alternate" href="(.*?)"/,
  );
  return m ? { id: m[1], title: m[2], url: m[3] } : null;
}

async function checkAll(client) {
  const all = store.getAll();
  for (const [guildId, cfg] of Object.entries(all)) {
    const subs = cfg?.[KEY];
    if (!Array.isArray(subs) || subs.length === 0) continue;

    let changed = false;
    for (const sub of subs) {
      const latest = await fetchLatest(sub.youtubeId).catch(() => null);
      if (!latest) continue;

      if (!sub.lastVideoId) {
        sub.lastVideoId = latest.id;
        changed = true;
        continue;
      }
      if (latest.id !== sub.lastVideoId) {
        sub.lastVideoId = latest.id;
        changed = true;
        const channel = await client.channels.fetch(sub.discordChannelId).catch(() => null);
        await channel?.send(`📺 新着動画: **${latest.title}**\n${latest.url}`).catch(() => {});
      }
    }
    if (changed) store.set(guildId, KEY, subs);
  }
}

const events = {
  // 起動完了後に定期チェックを開始する
  clientReady: (client) => {
    setInterval(() => checkAll(client).catch(console.error), INTERVAL_MS);
  },
};

module.exports = { data, execute, events };
