/**
 * @file commands/edit-tag.js
 * @description Slash command chỉnh sửa cấu hình tag đã có.
 */

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const dbService = require('../database/dbService');
const logger = require('../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit-tag')
    .setDescription('Chỉnh sửa cấu hình tag đang theo dõi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('tag_slug').setDescription('Slug tag cần sửa').setRequired(true))
    .addStringOption(opt => opt.setName('tag_name').setDescription('Tên hiển thị mới').setRequired(false))
    .addChannelOption(opt => opt.setName('review_channel').setDescription('Kênh duyệt mới').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addChannelOption(opt => opt.setName('announce_channel').setDescription('Kênh thông báo mới').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addRoleOption(opt => opt.setName('mention_role').setDescription('Role mention mới').setRequired(false))
    .addBooleanOption(opt => opt.setName('auto_approve').setDescription('Bật/tắt auto approve').setRequired(false))
    .addBooleanOption(opt => opt.setName('mention_toggle').setDescription('Bật/tắt mention').setRequired(false))
    .addStringOption(opt => opt.setName('embed_color').setDescription('Màu embed mới (hex)').setRequired(false)),

  async execute(interaction) {
    const tagSlug = interaction.options.getString('tag_slug').toLowerCase().trim();
    const existing = dbService.getTagConfig(tagSlug);

    if (!existing) {
      return interaction.reply({ content: `⚠️ Không tìm thấy tag \`${tagSlug}\`.`, ephemeral: true });
    }

    // Merge giá trị mới với giá trị cũ
    const updated = {
      tagName: interaction.options.getString('tag_name') ?? existing.tag_name,
      reviewChannelId: interaction.options.getChannel('review_channel')?.id ?? existing.review_channel_id,
      announceChannelId: interaction.options.getChannel('announce_channel')?.id ?? existing.announce_channel_id,
      roleMentionId: interaction.options.getRole('mention_role')?.id ?? existing.role_mention_id,
      autoApprove: interaction.options.getBoolean('auto_approve') ?? !!existing.auto_approve,
      mentionToggle: interaction.options.getBoolean('mention_toggle') ?? !!existing.mention_toggle,
      embedColor: interaction.options.getString('embed_color') ?? existing.embed_color,
    };

    try {
      dbService.upsertTagConfig(tagSlug, updated);

      await interaction.reply({
        content: `✅ Đã cập nhật cấu hình tag \`${tagSlug}\` thành công!\n\nSử dụng \`/list-tags\` để kiểm tra.`,
        ephemeral: true,
      });
      logger.info('EditTag', `Tag "${tagSlug}" được cập nhật bởi ${interaction.user.tag}`);
    } catch (error) {
      logger.error('EditTag', 'Lỗi cập nhật tag', error);
      await interaction.reply({ content: '❌ Đã xảy ra lỗi khi cập nhật tag.', ephemeral: true });
    }
  },
};
