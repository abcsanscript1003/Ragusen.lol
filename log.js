const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');

// 詳細ログ：メッセージの削除・編集、入退室、役職変更、BANなどを指定チャンネルに記録する
const KEY = 'log';

const data = new SlashCommandBuilder()
  .setName('log')
  .setDescription('ログの記録先を設定します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((s) =>
    s
      .setName('set')
      .setDescription('ログを記録するチャンネルを設定します')
      .addChannelOption((o) =>
        o.setName('channel').setDescription('ログチャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      ),
  )
  .addSubcommand((s) => s.setName('off').setDescription('ログを止めます'));

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'off') {
    store.set(interaction.guildId, KEY, null);
    return interaction.reply({ content: 'ログを停止しました。', flags: MessageFlags.Ephemeral });
  }
  const channel = interaction.options.getChannel('channel', true);
  store.set(interaction.guildId, KEY, { channelId: channel.id });
  await interaction.reply({ content: `ログを ${channel} に記録します。`, flags: MessageFlags.Ephemeral });
}

async function send(guild, title, description, color = 0x5865f2) {
  const cfg = store.get(guild.id, KEY);
  if (!cfg) return;
  const channel = await guild.channels.fetch(cfg.channelId).catch(() => null);
  if (!channel) return;
  const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
}

const events = {
  messageDelete: async (message) => {
    if (!message.guild || message.author?.bot) return;
    const content = message.content ?? '（内容不明）';
    await send(message.guild, '🗑️ メッセージ削除', `${message.author ?? '不明'} の投稿（${message.channel}）\n${content}`, 0xed4245);
  },

  messageUpdate: async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const before = oldMessage.content ?? '（内容不明）';
    await send(newMessage.guild, '✏️ メッセージ編集', `${newMessage.author} （${newMessage.channel}）\n変更前: ${before}\n変更後: ${newMessage.content}`, 0xfee75c);
  },

  guildMemberAdd: async (member) => {
    await send(member.guild, '📥 参加', `${member.user} が参加しました。`, 0x57f287);
  },

  guildMemberRemove: async (member) => {
    await send(member.guild, '📤 退出', `${member.user.username} が退出しました。`, 0xed4245);
  },

  guildMemberUpdate: async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    const added = newRoles.filter((r) => !oldRoles.has(r.id));
    const removed = oldRoles.filter((r) => !newRoles.has(r.id));
    if (added.size) {
      await send(newMember.guild, '🏷️ ロール付与', `${newMember.user} に ${added.map((r) => `${r}`).join(' ')} が付与されました。`, 0x57f287);
    }
    if (removed.size) {
      await send(newMember.guild, '🏷️ ロール削除', `${newMember.user} から ${removed.map((r) => `${r}`).join(' ')} が外されました。`, 0xed4245);
    }
  },

  guildBanAdd: async (ban) => {
    await send(ban.guild, '🔨 BAN', `${ban.user.tag} がBANされました。`, 0xed4245);
  },

  guildBanRemove: async (ban) => {
    await send(ban.guild, '♻️ BAN解除', `${ban.user.tag} のBANが解除されました。`, 0x57f287);
  },
};

module.exports = { data, execute, events };
