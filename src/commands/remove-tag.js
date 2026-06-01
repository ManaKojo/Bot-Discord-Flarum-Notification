/**
 * @file commands/remove-tag.js
 * @description Slash command xóa cấu hình theo dõi tag.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dbService = require('../database/dbService');
const logger = require('../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-tag')
    .setDescription('Xóa cấu hình theo dõi tag Flarum')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('tag_slug').setDescription('Slug tag cần xóa').setRequired(true),
    ),

  async execute(interaction) {
    const tagSlug = interaction.options.getString('tag_slug').toLowerCase().trim();

    try {
      const removed = dbService.removeTagConfig(tagSlug);
      if (removed) {
        await interaction.reply({
          content: `✅ Đã xóa cấu hình tag \`${tagSlug}\` thành công.`,
          ephemeral: true,
        });
        logger.info('RemoveTag', `Tag "${tagSlug}" bị xóa bởi ${interaction.user.tag}`);
      } else {
        await interaction.reply({
          content: `⚠️ Không tìm thấy tag \`${tagSlug}\` trong cấu hình.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      logger.error('RemoveTag', 'Lỗi xóa tag', error);
      await interaction.reply({ content: '❌ Đã xảy ra lỗi khi xóa tag.', ephemeral: true });
    }
  },
};
