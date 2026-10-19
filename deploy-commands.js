// スラッシュコマンドをDiscordに登録するスクリプト
// コマンドを追加・変更したときに `npm run deploy` で実行してください。
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const loadCommands = require('./utils/load-commands');

const body = loadCommands()
  .filter((c) => c.data)
  .map((c) => c.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  if (process.env.GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body },
    );
  } else {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body });
  }
  console.log(`${body.length} 件のコマンドを登録しました`);
})().catch(console.error);
