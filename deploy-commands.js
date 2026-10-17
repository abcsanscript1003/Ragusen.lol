// コマンドをDiscordに登録するスクリプト（コマンドを追加・変更したら実行）
// 実行: npm run deploy
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const commands = fs
  .readdirSync(path.join(__dirname, 'commands'))
  .filter((f) => f.endsWith('.js'))
  .flatMap((f) => {
    const mod = require(path.join(__dirname, 'commands', f));
    return Array.isArray(mod) ? mod : [mod];
  })
  .map((cmd) => cmd.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(`${commands.length}件のコマンドを登録しました`);
})().catch(console.error);
