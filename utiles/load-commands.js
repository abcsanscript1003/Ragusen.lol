const fs = require('node:fs');
const path = require('node:path');

// commands/ フォルダ内のすべての .js を読み込む。
// 1ファイルで複数コマンドを出す場合は配列で export する。
module.exports = function loadCommands() {
  const dir = path.join(__dirname, '..', 'commands');
  const list = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = require(path.join(dir, file));
    list.push(...(Array.isArray(mod) ? mod : [mod]));
  }
  return list;
};
