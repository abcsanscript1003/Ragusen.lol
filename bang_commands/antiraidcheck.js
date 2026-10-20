const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  async run(message) {
    // 管理者のみ実行可能（セキュリティ情報のため）
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.author.send('❌ このコマンドは管理者のみ実行できます。').catch(() => {});
    }

    await message.author.send('🔍 サーバー内のBotをスキャンして荒らし対策Botを探しています...').catch(() => {});

    try {
      const members = await message.guild.members.fetch();
      const bots = members.filter(m => m.user.bot);

      // 荒らし対策Botの判定キーワード
      const keywords = ['anti', 'raid', 'security', 'guard', 'sentinel', 'bastion', 'shield', 'protect', 'nuke', 'safe', 'secure', 'moderator', 'defender'];
      
      // 危険な権限とそのスコア
      const dangerousPerms = {
        [PermissionFlagsBits.Administrator]: 5,
        [PermissionFlagsBits.ManageGuild]: 3,
        [PermissionFlagsBits.KickMembers]: 2,
        [PermissionFlagsBits.BanMembers]: 2,
        [PermissionFlagsBits.ManageRoles]: 2,
        [PermissionFlagsBits.ManageChannels]: 2,
        [PermissionFlagsBits.ModerateMembers]: 2,
        [PermissionFlagsBits.ViewAuditLog]: 1,
        [PermissionFlagsBits.ManageWebhooks]: 1,
      };

      const results = [];

      for (const [id, member] of bots) {
        let score = 0;
        const perms = member.permissions.toArray();
        const roles = member.roles.cache.map(r => r.name).join(' ').toLowerCase();
        const botName = member.user.username.toLowerCase();
        const displayName = member.displayName.toLowerCase();

        // 権限によるスコアリング
        for (const [perm, points] of Object.entries(dangerousPerms)) {
          if (member.permissions.has(perm)) score += points;
        }

        // 名前・ロール名によるスコアリング
        for (const kw of keywords) {
          if (botName.includes(kw) || displayName.includes(kw)) score += 2;
          if (roles.includes(kw)) score += 2;
        }

        // オンライン状態なら少し加点（稼働中）
        if (member.presence?.status === 'online') score += 1;

        if (score >= 5) {
          results.push({ member, score, perms });
        }
      }

      // スコア順にソート
      results.sort((a, b) => b.score - a.score);

      if (results.length === 0) {
        return message.author.send('✅ このサーバーには、明らかな荒らし対策Botは見つかりませんでした。').catch(() => {});
      }

      // 結果をEmbedで送信
      const embed = new EmbedBuilder()
        .setTitle('🛡️ 荒らし対策Bot 検出レポート')
        .setDescription(`サーバー「${message.guild.name}」で稼働中と推測される荒らし対策Botは **${results.length}体** です。`)
        .setColor(0xff0000)
        .setTimestamp();

      for (const res of results.slice(0, 5)) { // 最大5体まで表示
        const status = res.member.presence?.status || 'offline';
        const statusEmoji = status === 'online' ? '🟢' : status === 'idle' ? '🟡' : '⚫';
        
        embed.addFields({
          name: `${statusEmoji} ${res.member.user.tag} (スコア: ${res.score})`,
          value: `**ID:** \`${res.member.id}\`\n**主要権限:** ${res.perms.filter(p => ['Administrator', 'ManageGuild', 'KickMembers', 'BanMembers', 'ManageRoles', 'ManageChannels'].includes(p)).join(', ') || 'なし'}\n**ロール:** ${res.member.roles.cache.map(r => r.name).join(', ') || 'なし'}`.slice(0, 1024),
        });
      }

      if (results.length > 5) {
        embed.setFooter({ text: `他 ${results.length - 5} 体のBotが検出されました。` });
      }

      await message.author.send({ embeds: [embed] }).catch(() => {});
      console.log(`[anti-antiraidcheck] ${message.author.tag} がスキャンを実行しました。検出数: ${results.length}`);

    } catch (e) {
      console.error('anti-antiraidcheck エラー:', e);
      await message.author.send(`❌ スキャン中にエラーが発生しました:\n${e.message}`).catch(() => {});
    }
  }
};
