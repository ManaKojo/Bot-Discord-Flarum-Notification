/**
 * @file commands/list-tags.js
 * @description Slash command liệt kê tất cả tag đang theo dõi.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const dbService = require('../database/dbService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-tags')
    .setDescription('Hiển thị danh sách tag đang theo dõi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const tags = dbService.getAllTagConfigs();

    if (tags.length === 0) {
      return interaction.reply({ content: '📭 Chưa có tag nào được cấu hình. Sử dụng `/setup-tag` để thêm.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏷️ Danh sách Tag đang theo dõi')
      .setDescription(`Tổng cộng **${tags.length}** tag được cấu hình.`)
      .setTimestamp();

    for (const tag of tags) {
      embed.addFields({
        name: `${tag.tag_name || tag.tag_slug}  (\`${tag.tag_slug}\`)`,
        value: [
          `📋 Kênh duyệt: <#${tag.review_channel_id}>`,
          `📢 Kênh thông báo: <#${tag.announce_channel_id}>`,
          `👥 Role: ${tag.role_mention_id ? `<@&${tag.role_mention_id}>` : 'Không có'}`,
          `⚡ Auto: ${tag.auto_approve ? '✅' : '❌'} | 🔔 Mention: ${tag.mention_toggle ? '✅' : '❌'}`,
          `🎨 Màu: \`${tag.embed_color}\``,
        ].join('\n'),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
