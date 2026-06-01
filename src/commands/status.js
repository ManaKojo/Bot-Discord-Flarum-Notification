/**
 * @file commands/status.js
 * @description Slash command hiển thị trạng thái hoạt động của bot.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const dbService = require('../database/dbService');
const flarumApi = require('../api/flarum');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Hiển thị trạng thái hoạt động của bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tags = dbService.getAllTagConfigs();
    const totalProcessed = dbService.countProcessed();
    const approved = dbService.countByStatus('approved');
    const rejected = dbService.countByStatus('rejected');
    const pending = dbService.countByStatus('pending');

    // Kiểm tra Flarum API
    const health = await flarumApi.healthCheck();

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new EmbedBuilder()
      .setColor(health.ok ? 0x57f287 : 0xed4245)
      .setTitle('📊 Trạng thái Bot')
      .addFields(
        { name: '⏱️ Uptime', value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: '🏷️ Tag theo dõi', value: `${tags.length}`, inline: true },
        { name: '📄 Tổng bài xử lý', value: `${totalProcessed}`, inline: true },
        { name: '✅ Đã duyệt', value: `${approved}`, inline: true },
        { name: '❌ Đã từ chối', value: `${rejected}`, inline: true },
        { name: '⏳ Chờ duyệt', value: `${pending}`, inline: true },
        { name: '🌐 Flarum API', value: health.ok ? `✅ Hoạt động (${health.latency}ms)` : `❌ Lỗi: ${health.error}`, inline: false },
        { name: '💾 RAM', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
