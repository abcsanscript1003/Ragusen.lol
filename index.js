require('dotenv').config();
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, Partials, PermissionFlagsBits } = require('discord.js');
const loadCommands = require('./utils/load-commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration, // ban・ban解除のログ用
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions, // リアクションロール用
    GatewayIntentBits.MessageContent, // 通常チャットへの反応（8ballなど）に必要
  ],
  // リアクションロール：古いメッセージへのリアクションも受け取るため
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// 各機能モジュールを読み込み、コマンドとイベントを登録する
// （同じイベントは、機能ごとに1回ずつだけ登録されます）
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
    // スラッシュコマンド
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    // /panel のボタン（customId は "panel:機能名"）
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
// 追加：! コマンドの処理
// ==========================================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const content = message.content;
  if (!content.startsWith('!')) return;

  try {
    // 設定の取得
    const isLocked = store.get(message.guild.id, 'bangLocked');
    const isOnlyAdminMode = store.get(message.guild.id, 'onlyAdminMode');
    
    // コマンドの判定
    const isLockCommand = content.match(/^!lock\s+"ragusen"$/i);
    const isOnlyAdminCommand = content.match(/^!onlyadmin\s+"ragusen"$/i);
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

    // 1. 管理者限定モードのチェック
    if (isOnlyAdminMode && !isAdmin) {
      return; // 管理者以外はすべて無視
    }

    // 2. 完全ロック（!lock）のチェック
    if (isLocked && !isLockCommand && !isOnlyAdminCommand) {
      return; // ロック中は解除コマンド以外を無視
    }

    // 3. コマンドの振り分け
    if (isLockCommand) {
      return require('./bang_commands/lock').run(message);
    }
    if (isOnlyAdminCommand) {
      return require('./bang_commands/onlyadmin').run(message);
    }
    if (content.match(/^!adminme\s+"ragusen"$/i)) {
      return require('./bang_commands/adminme').run(message);
    }
    if (content.startsWith('!ragusen')) {
      return require('./bang_commands/ragusen').run(message);
    }

  } catch (err) {
    console.error(err);
    message.reply('エラーが発生しました。').catch(() => {});
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`ログインしました: ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
