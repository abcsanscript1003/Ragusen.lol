const { Events } = require('discord.js');
const store = require('../store');

// 期限が切れた期限付きロールを外す
async function expireTempRoles(client) {
  const data = store.load();
  const now = Date.now();
  const expired = data.timedRoles.filter((t) => t.expiresAt <= now);
  if (expired.length === 0) return;

  // 先に保存しておくと、処理中に別のコマンドが書き込んでも上書きされない
  data.timedRoles = data.timedRoles.filter((t) => t.expiresAt > now);
  store.save(data);

  for (const t of expired) {
    try {
      const guild = await client.guilds.fetch(t.guildId);
      const member = await guild.members.fetch(t.userId);
      await member.roles.remove(t.roleId, '期限切れ');
    } catch (err) {
      console.error('期限付きロールの解除に失敗:', err.message);
    }
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`ログイン完了: ${client.user.tag}`);
    expireTempRoles(client);
    setInterval(() => expireTempRoles(client), 30 * 1000);
  },
};
