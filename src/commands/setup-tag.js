/**
 * @file commands/setup-tag.js
 * @description Slash command thiết lập cấu hình tag mới để theo dõi.
 */

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const dbService = require('../database/dbService');
const logger = require('../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tag')
    .setDescription('Thiết lập cấu hình theo dõi tag Flarum mới')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('tag_slug').setDescription('Slug của tag trên Flarum (vd: news, event)').setRequired(true))
    .addStringOption(opt => opt.setName('tag_name').setDescription('Tên hiển thị của tag (vd: Tin tức)').setRequired(true))
    .addChannelOption(opt => opt.setName('review_channel').setDescription('Kênh duyệt bài viết').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addChannelOption(opt => opt.setName('announce_channel').setDescription('Kênh đăng thông báo').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addRoleOption(opt => opt.setName('mention_role').setDescription('Role sẽ được mention khi đăng thông báo').setRequired(false))
    .addBooleanOption(opt => opt.setName('auto_approve').setDescription('Tự động duyệt bài (bỏ qua review)').setRequired(false))
    .addBooleanOption(opt => opt.setName('mention_toggle').setDescription('Bật/tắt mention role').setRequired(false))
    .addStringOption(opt => opt.setName('embed_color').setDescription('Màu embed hex (vd: #FF5733)').setRequired(false)),

  async execute(interaction) {
    const tagSlug = interaction.options.getString('tag_slug').toLowerCase().trim();
    const tagName = interaction.options.getString('tag_name').trim();
    const reviewChannel = interaction.options.getChannel('review_channel');
    const announceChannel = interaction.options.getChannel('announce_channel');
    const mentionRole = interaction.options.getRole('mention_role');
    const autoApprove = interaction.options.getBoolean('auto_approve') ?? false;
    const mentionToggle = interaction.options.getBoolean('mention_toggle') ?? true;
    const embedColor = interaction.options.getString('embed_color') || '#5865F2';

    try {
      dbService.upsertTagConfig(tagSlug, {
        tagName,
        reviewChannelId: reviewChannel.id,
        announceChannelId: announceChannel.id,
        roleMentionId: mentionRole?.id || null,
        autoApprove,
        mentionToggle,
        embedColor,
      });

      await interaction.reply({
        content: [
          `✅ **Đã thiết lập tag thành công!**`,
          '',
          `🏷️ **Tag:** \`${tagSlug}\` (${tagName})`,
          `📋 **Kênh duyệt:** ${reviewChannel}`,
          `📢 **Kênh thông báo:** ${announceChannel}`,
          `👥 **Role mention:** ${mentionRole ? mentionRole : 'Không có'}`,
          `⚡ **Tự động duyệt:** ${autoApprove ? 'Bật' : 'Tắt'}`,
          `🔔 **Mention:** ${mentionToggle ? 'Bật' : 'Tắt'}`,
          `🎨 **Màu embed:** \`${embedColor}\``,
        ].join('\n'),
        ephemeral: true,
      });

      logger.info('SetupTag', `Tag "${tagSlug}" được thiết lập bởi ${interaction.user.tag}`);
    } catch (error) {
      logger.error('SetupTag', 'Lỗi thiết lập tag', error);
      await interaction.reply({ content: '❌ Đã xảy ra lỗi khi thiết lập tag.', ephemeral: true });
    }
  },
};
