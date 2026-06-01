/**
 * @file commands/forcecheck.js
 * @description Slash command ép bot kiểm tra bài viết mới ngay lập tức.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pollService = require('../services/pollService');
const logger = require('../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcecheck')
    .setDescription('Ép kiểm tra bài viết mới từ Flarum ngay lập tức')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      await pollService.forceCheck();
      await interaction.editReply({ content: '✅ Đã kiểm tra bài viết mới thành công!' });
      logger.info('ForceCheck', `Force check bởi ${interaction.user.tag}`);
    } catch (error) {
      logger.error('ForceCheck', 'Lỗi force check', error);
      await interaction.editReply({ content: '❌ Lỗi khi kiểm tra bài viết mới.' });
    }
  },
};
