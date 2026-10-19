const fs = require('node:fs');
const path = require('node:path');

// 簡易的な保存先（サーバーごとの設定を data.json に保存）
const FILE = path.join(__dirname, '..', 'data.json');

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function get(guildId, key) {
  return readAll()[guildId]?.[key];
}

function set(guildId, key, value) {
  const all = readAll();
  all[guildId] = { ...all[guildId], [key]: value };
  writeAll(all);
}

// 全サーバー分の設定を返す（定期処理用）
module.exports = { get, set, getAll: readAll };
