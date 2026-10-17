const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const store = require('../store');

const setlog = {
  data: new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('ログを記録するチャンネルを設定します')
    .addChannelOption((o) =>
      o.setName('channel').setDescription('ログを送るテキストチャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(i) {
    const channel = i.options.getChannel('channel');
    const data = store.load();
    data.logChannels[i.guild.id] = channel.id;
    store.save(data);
    return i.reply({ content: `ログチャンネルを ${channel} に設定しました。`, ephemeral: true });
  },
};

const setwelcome = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('新規参加者へのウェルカムメッセージと自動ロールを設定します')
    .addChannelOption((o) =>
      o.setName('channel').setDescription('メッセージを送るチャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('message').setDescription('{user}=メンション、{server}=サーバー名（省略時は標準文）'),
    )
    .addRoleOption((o) => o.setName('role').setDescription('参加時に自動で付与するロール（任意）'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(i) {
    const channel = i.options.getChannel('channel');
    const message = i.options.getString('message') ?? undefined;
    const role = i.options.getRole('role');
    const data = store.load();
    data.welcome[i.guild.id] = { channelId: channel.id, message, roleId: role?.id ?? null };
    store.save(data);
    return i.reply({ content: `ウェルカム設定を保存しました（チャンネル: ${channel}）。`, ephemeral: true });
  },
};

module.exports = [setlog, setwelcome];
