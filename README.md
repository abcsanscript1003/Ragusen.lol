# discord-mod-bot

ProBot代替のDiscordボットです。段階1として、モデレーション・ロール操作・期限付きロール・警告・ログ・ウェルカムメッセージ・埋め込みを入れています。

## 段階1に入っている機能

| コマンド | 内容 | 必要な権限 |
|---|---|---|
| `/kick` `/ban` | キック・BAN | キック／BAN |
| `/timeout` | 一定時間発言禁止 | タイムアウト |
| `/purge` | メッセージの一括削除（1〜100件） | メッセージ管理 |
| `/slowmode` | 低速モード（0で解除） | チャンネル管理 |
| `/addrole` `/removerole` | ロールの付与・解除 | ロール管理 |
| `/temprole` | 期限付きロール（時間が来ると自動で外れる） | ロール管理 |
| `/warn` `/warnings` | 警告の記録と履歴表示 | タイムアウト |
| `/embed` | 見出しと色を指定して埋め込み送信 | メッセージ管理 |
| `/setlog` | ログチャンネルの設定 | サーバー管理 |
| `/setwelcome` | 参加時のメッセージと自動ロール | サーバー管理 |

ログは、削除・編集・入退室・キックやBANなどの操作を記録します。

## セットアップ

1. [Discord開発者ポータル](https://discord.com/developers/applications)でアプリを作成し、Botタブでトークンを取得します。「SERVER MEMBERS INTENT」と「MESSAGE CONTENT INTENT」をオンにしてください。
2. `.env.example` をコピーして `.env` を作り、`DISCORD_TOKEN` と `CLIENT_ID` を入れます。
3. `npm install` を実行します。
4. `npm run deploy` でコマンドをDiscordに登録します（テストなら `GUILD_ID` を入れると即反映されます）。
5. `npm start` で起動します。

## Oracle Cloudで常時起動する

[Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)のUbuntuインスタンスにSSHで入り、Node.js 20以上を入れてから、GitHubのリポジトリをcloneします。`.env` は手動で作成してください（GitHubには上げません）。

自動起動には systemd を使います。`/etc/systemd/system/discord-bot.service` を作成し、`WorkingDirectory` にこのフォルダのパス、`ExecStart` に `/usr/bin/node src/index.js` を書いて有効化すると、再起動後も自動で立ち上がります。

## 注意

- 保存は `data.json` で行っています。件数が増えたらデータベースに置き換えられます。
- `.env` と `data.json` は `.gitignore` で除外されています。トークンを公開しないよう注意してください。
