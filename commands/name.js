const {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

// ボットの「ニックネーム」をこのサーバーだけで変更する（他のサーバーには影響しません）
const data = new SlashCommandBuilder()
  .setName('name')
  .setDescription('このサーバーでのボットの名前を変更します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
  .addStringOption((o) =>
    o
      .setName('name')
      .setDescription('新しい名前（空欄で元の名前に戻します）')
      .setMaxLength(32),
  );

async function execute(interaction) {
  const name = interaction.options.getString('name');
  const me = interaction.guild.members.me;

  try {
    await me.setNickname(name ?? null, 'ボット名変更コマンド');
    await interaction.reply({
      content: name
        ? `✅ このサーバーでのボットの名前を「${name}」に変更しました。`
        : '✅ このサーバーでのボットの名前を元に戻しました。',
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    await interaction.reply({
      content: `名前を変更できませんでした（権限や使えない文字を確認してください）: ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = { data, execute };
