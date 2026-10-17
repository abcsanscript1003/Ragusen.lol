require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

if (!process.env.DISCORD_TOKEN) {
  throw new Error('.env に DISCORD_TOKEN を設定してください');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// フォルダ内の .js を読み込む（1ファイルに配列でまとめて書いてもOK）
const loadModules = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .flatMap((f) => {
      const mod = require(path.join(dir, f));
      return Array.isArray(mod) ? mod : [mod];
    });

client.commands = new Collection();
for (const cmd of loadModules(path.join(__dirname, 'commands'))) {
  client.commands.set(cmd.data.name, cmd);
}

for (const ev of loadModules(path.join(__dirname, 'events'))) {
  if (ev.once) client.once(ev.name, (...args) => ev.execute(...args));
  else client.on(ev.name, (...args) => ev.execute(...args));
}

client.login(process.env.DISCORD_TOKEN);
