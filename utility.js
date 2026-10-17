const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ChannelType } = require('discord.js');
const { fail } = require('../utils');

const embed = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('メッセージを送ります（埋め込み or シンプルな文字のみ）')
    .addStringOption((o) => o.setName('description').setDescription('本文').setRequired(true))
    .addStringOption((o) => o.setName('title').setDescription('見出し（任意）'))
    .addStringOption((o) =>
      o
        .setName('mode')
        .setDescription('送り方（省略時は埋め込み）')
        .addChoices({ name: '埋め込み', value: 'embed' }, { name: 'シンプル（文字のみ）', value: 'simple' }),
    )
    .addStringOption((o) => o.setName('color').setDescription('埋め込みの色（例: #ff8800）／埋め込みのときのみ有効'))
    .addChannelOption((o) =>
      o.setName('channel').setDescription('送信先のチャンネル（省略時は今のチャンネル）').addChannelTypes(ChannelType.GuildText),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),
  async execute(i) {
    const title = i.options.getString('title');
    const description = i.options.getString('description');
    const mode = i.options.getString('mode') ?? 'embed';
    const color = i.options.getString('color') ?? '#5865F2';
    const target = i.options.getChannel('channel') ?? i.channel;

    if (!target?.isTextBased()) return fail(i, '送信先はテキストチャンネルを指定してください。');

    if (mode === 'simple') {
      // 通常のチャットと同じ見た目（埋め込みなし）。見出しがあれば1行目に書く
      const text = title ? `${title}\n${description}` : description;
      await target.send({ content: text });
    } else {
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) return fail(i, '色は #ff8800 のように6桁の16進数で指定してください。');
      const e = new EmbedBuilder().setDescription(description).setColor(color).setTimestamp();
      if (title) e.setTitle(title);
      await target.send({ embeds: [e] });
    }

    const where = target.id === i.channel.id ? '' : `（${target}）`;
    return i.reply({ content: `送信しました${where}。`, flags: MessageFlags.Ephemeral });
  },
};

module.exports = [embed];
