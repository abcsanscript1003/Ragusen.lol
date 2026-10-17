// 簡単なJSONファイルによる保存（data.json）。件数が増えたらSQLiteなどに置き換えられます
const fs = require('node:fs');
const path = require('node:path');

const FILE = path.join(__dirname, '..', 'data.json');
const DEFAULT = {
  warnings: [], // { guildId, userId, moderatorId, reason, createdAt }
  timedRoles: [], // { guildId, userId, roleId, expiresAt }
  logChannels: {}, // guildId -> channelId
  welcome: {}, // guildId -> { channelId, message, roleId }
};

function load() {
  try {
    return { ...structuredClone(DEFAULT), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = { load, save };
