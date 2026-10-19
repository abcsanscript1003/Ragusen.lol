const store = require('../store');

module.exports = {
  async run(message) {
    const isLocked = store.get(message.guild.id, 'bangLocked');

    if (isLocked) {
      store.set(message.guild.id, 'bangLocked', false);
      return message.reply('🔓 `!` コマンドのロックを解除しました。全員が使用可能です。');
    } else {
      store.set(message.guild.id, 'bangLocked', true);
      return message.reply('🔒 `!` コマンドをロックしました。管理者以外は使用できません。');
    }
  }
};
