const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');

// 全員へのロール一括付与・一括解除（botは除く）
// 人数が多いと時間がかかるため、完了後に結果を返します。
const data = new SlashCommandBuilder()
  .setName('roleall')
  .setDescription('全員にロールを付与・解除します')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((s) =>
    s
      .setName('add')
      .setDescription('全員にロールを付与します')
      .addRoleOption((o) => o.setName('role').setDescription('付与するロール').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('remove')
      .setDescription('全員からロールを外します')
      .addRoleOption((o) => o.setName('role').setDescription('外すロール').setRequired(true)),
  );

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const role = interaction.options.getRole('role', true);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const members = await interaction.guild.members.fetch();
  let done = 0;
  let failed = 0;
  for (const member of members.values()) {
    if (member.user.bot) continue;
    try {
      if (sub === 'add') await member.roles.add(role);
      else await member.roles.remove(role);
      done++;
    } catch {
      failed++;
    }
  }

  const verb = sub === 'add' ? '付与' : '解除';
  await interaction.editReply(`✅ ${role} を ${done}人から${verb}しました（失敗: ${failed}人）。`);
}

module.exports = { data, execute };
