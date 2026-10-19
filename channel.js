const {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

// チャンネル管理（結果は本人にだけ見えます）
const data = new SlashCommandBuilder()
  .setName('channel')
  .setDescription('チャンネルを管理します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((s) =>
    s
      .setName('create')
      .setDescription('テキストチャンネルを作成します')
      .addStringOption((o) => o.setName('name').setDescription('チャンネル名').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('delete')
      .setDescription('チャンネルを削除します')
      .addChannelOption((o) => o.setName('channel').setDescription('対象チャンネル').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('rename')
      .setDescription('チャンネル名を変更します')
      .addChannelOption((o) => o.setName('channel').setDescription('対象チャンネル').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('新しい名前').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('topic')
      .setDescription('トピック（説明文）を設定します')
      .addChannelOption((o) =>
        o.setName('channel').setDescription('対象チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      )
      .addStringOption((o) => o.setName('text').setDescription('トピック').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('slowmode')
      .setDescription('低速モード（投稿の間隔）を設定します')
      .addChannelOption((o) =>
        o.setName('channel').setDescription('対象チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      )
      .addIntegerOption((o) =>
        o.setName('seconds').setDescription('間隔（秒・0で解除）').setMinValue(0).setMaxValue(21600).setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('lock')
      .setDescription('チャンネルへの投稿を、全員について禁止します')
      .addChannelOption((o) =>
        o.setName('channel').setDescription('対象チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('unlock')
      .setDescription('チャンネルへの投稿禁止を解除します')
      .addChannelOption((o) =>
        o.setName('channel').setDescription('対象チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true),
      ),
  );

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  const say = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

  if (sub === 'create') {
    const name = interaction.options.getString('name', true);
    const channel = await guild.channels.create({ name, type: ChannelType.GuildText });
    return say(`✅ ${channel} を作成しました。`);
  }

  const channel = interaction.options.getChannel('channel', true);

  if (sub === 'delete') {
    // 返信してから削除する（削除後は返信できないため）
    await say(`🗑️ ${channel.name} を削除しました。`);
    return channel.delete().catch(() => {});
  }
  if (sub === 'rename') {
    const name = interaction.options.getString('name', true);
    await channel.setName(name);
    return say(`✅ チャンネル名を「${name}」に変更しました。`);
  }
  if (sub === 'topic') {
    const text = interaction.options.getString('text', true);
    await channel.setTopic(text);
    return say(`✅ ${channel} のトピックを設定しました。`);
  }
  if (sub === 'slowmode') {
    const seconds = interaction.options.getInteger('seconds', true);
    await channel.setRateLimitPerUser(seconds);
    return say(`✅ ${channel} の低速モードを${seconds}秒にしました。`);
  }
  if (sub === 'lock' || sub === 'unlock') {
    const lock = sub === 'lock';
    await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: lock ? false : null });
    return say(`✅ ${channel} の投稿を${lock ? '禁止' : '許可'}しました。`);
  }
}

module.exports = { data, execute };
