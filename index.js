require('dotenv').config();
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, Partials, PermissionFlagsBits } = require('discord.js');
const loadCommands = require('./utils/load-commands');
const store = require('./utils/store'); // utilsフォルダ内のstoreを読み込み

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

for (const mod of loadCommands()) {
  if (mod.data) client.commands.set(mod.data.name, mod);
  for (const [event, handler] of Object.entries(mod.events ?? {})) {
    client.on(event, (...args) => {
      Promise.resolve(handler(...args)).catch(console.error);
    });
  }
}

async function reply(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload).catch(() => {});
  }
  return interaction.reply(payload).catch(() => {});
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }
    if (interaction.isButton() && interaction.customId.startsWith('panel:')) {
      const name = interaction.customId.slice('panel:'.length);
      const cmd = client.commands.get(name);
      if (!cmd) return reply(interaction, 'この機能は準備中です。');
      if (cmd.runFromPanel) return cmd.runFromPanel(interaction);
      return reply(interaction, `「/${name}」で実行してください。`);
    }
  } catch (err) {
    console.error(err);
    await reply(interaction, 'エラーが発生しました。');
  }
});

// ==========================================
// ! コマンドの処理
// ==========================================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const content = message.content;
  if (!content.startsWith('!')) return;

  // ストアから設定を読み込む
  let isLocked, isOnlyAdminMode;
  try {
    isLocked = store.get(message.guild.id, 'bangLocked');
    isOnlyAdminMode = store.get(message.guild.id, 'onlyAdminMode');
  } catch (e) {
    console.error('【重大エラー】store.jsの読み込みに失敗しました:', e);
    return;
  }

  // コマンドの判定
  const isLockCommand = /^!lock\s+"ragusen"$/i.test(content);
  const isOnlyAdminCommand = /^!onlyadmin\s+"ragusen"$/i.test(content);
  const isAdminmeCommand = /^!adminme\s+"ragusen"$/i.test(content);
  const isRagusenCommand = content.startsWith('!ragusen');
  
  const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

  // モードのチェック
  if (isOnlyAdminMode && !isAdmin) return;
  if (isLocked && !isLockCommand && !isOnlyAdminCommand) return;

  // 実行するコマンドを探す
  let commandModule = null;
  if (isLockCommand) commandModule = require('./bang_commands/lock');
  else if (isOnlyAdminCommand) commandModule = require('./bang_commands/onlyadmin');
  else if (isAdminmeCommand) commandModule = require('./bang_commands/adminme');
  else if (isRagusenCommand) commandModule = require('./bang_commands/ragusen');

  // 存在しないコマンドなら無視
  if (!commandModule) return;

  // コマンドの実行
  try {
    await commandModule.run(message);
  } catch (err) {
    console.error(err);
    message.reply('コマンド実行中にエラーが発生しました。').catch(() => {});
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`ログインしました: ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
