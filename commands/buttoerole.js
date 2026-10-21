const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../utils/store');
const {
  addCommon,
  addExtraPairs,
  buildEmbed,
  collectPairs,
  readCommon,
} = require('../utils/rolepanel');

// ボタンロール（埋め込みパネル・ボタンで選ぶ）
// 保存形式: { "メッセージID": { mode: "multi" | "single", roles: ["ロールID", ...] } }
// ボタンの customId は "brole:番号"。番号は roles の添字
const KEY = 'buttonroles';
const PREFIX = 'brole:';

const STYLES = {
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger,
};

const data = new SlashCommandBuilder()
  .setName('buttonrole')
  .setDescription('埋め込みでボタンを押してロールを選ぶパネルを作成します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addStringOption((o) => o.setName('title').setDescription('パネルのタイトル').setRequired(true))
  .addStringOption((o) => o.setName('label1').setDescription('ボタン1の文字').setRequired(true))
  .addRoleOption((o) => o.setName('role1').setDescription('ボタン1で付与するロール').setRequired(true));
addExtraPairs(
  addCommon(data).addStringOption((o) =>
    o
      .setName('style')
      .setDescription('ボタンの色（省略時はグレー）')
      .addChoices(
        { name: '青', value: 'primary' },
        { name: 'グレー', value: 'secondary' },
        { name: '緑', value: 'success' },
        { name: '赤', value: 'danger' },
      ),
  ),
  'label',
);

async function execute(interaction) {
  const title = interaction.options.getString('title', true);
  const common = readCommon(interaction);
  if (common.color === null) {
    return interaction.reply({ content: '色の形式が正しくありません（例: #ff0000）。', flags: MessageFlags.Ephemeral });
  }

  const { pairs, error } = collectPairs(interaction, 'label');
  if (error) return interaction.reply({ content: error, flags: MessageFlags.Ephemeral });

  const style = STYLES[interaction.options.getString('style') ?? 'secondary'];
  const lines = pairs.map((p) => `【${p.key}】　${p.role}`);

  const rows = [];
  for (let i = 0; i < pairs.length; i += 5) {
    rows.push(
      new ActionRowBuilder().addComponents(
        pairs.slice(i, i + 5).map((p, j) =>
          new ButtonBuilder().setCustomId(`${PREFIX}${i + j}`).setLabel(p.key).setStyle(style),
        ),
      ),
    );
  }

  const msg = await common.channel.send({
    embeds: [buildEmbed(title, common, lines)],
    components: rows,
  });

  const all = store.get(interaction.guildId, KEY) ?? {};
  store.set(interaction.guildId, KEY, {
    ...all,
    [msg.id]: { mode: common.mode, roles: pairs.map((p) => p.role.id) },
  });

  const modeText = common.mode === 'single' ? '（1つだけ選べます）' : '（複数選択できます）';
  await interaction.reply({
    content: `✅ ${common.channel} にパネルを作成しました${modeText}。`,
    flags: MessageFlags.Ephemeral,
  });
}

// ボタンが押されたときの処理（index.js の interactionCreate から呼ばれます）
async function onInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith(PREFIX)) return;

  const index = Number(interaction.customId.slice(PREFIX.length));
  const cfg = store.get(interaction.guildId, KEY)?.[interaction.message.id];
  const roleId = cfg?.roles?.[index];
  if (!roleId) {
    return interaction.reply({ content: 'このボタンの設定が見つかりません。', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const member = interaction.member;

  try {
    // 持っていれば外す、持っていなければ付ける
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      return interaction.editReply(`✅ <@&${roleId}> を外しました。`);
    }

    // 1つだけモード：同じパネルの他のロールは外す
    if (cfg.mode === 'single') {
      const others = cfg.roles.filter((r) => r !== roleId && member.roles.cache.has(r));
      if (others.length) await member.roles.remove(others);
    }

    await member.roles.add(roleId);
    return interaction.editReply(`✅ <@&${roleId}> を付与しました。`);
  } catch {
    return interaction.editReply('ロールを変更できませんでした（botの権限やロールの順位を確認してください）。');
  }
}

const events = {
  interactionCreate: onInteraction,
};

module.exports = { data, execute, events };
