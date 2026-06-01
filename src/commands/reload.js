/**
 * @file commands/reload.js
 * @description Slash command nạp lại cấu hình mà không cần restart bot.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Nạp lại cấu hình bot (không cần restart)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Xóa cache config module
      const configPath = require.resolve('../config');
      delete require.cache[configPath];

      logger.info('Reload', `Cấu hình được reload bởi ${interaction.user.tag}`);
      await interaction.reply({ content: '✅ Đã nạp lại cấu hình thành công!', ephemeral: true });
    } catch (error) {
      logger.error('Reload', 'Lỗi reload', error);
      await interaction.reply({ content: '❌ Lỗi khi reload cấu hình.', ephemeral: true });
    }
  },
};
