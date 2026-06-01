/**
 * @file embeds/reviewEmbed.js
 * @description Tạo embed duyệt bài viết gửi vào kênh review.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { truncateText, stripHtml, formatDiscordTimestamp, buildDiscussionUrl, parseColor } = require('../utils/helpers');

function createReviewEmbed(discussion, tagConfig) {
  const postUrl = buildDiscussionUrl(config.flarum.baseUrl, discussion.slug, discussion.id);
  const contentPreview = truncateText(stripHtml(discussion.firstPostContent), config.contentPreviewLength);
  const tagName = discussion.tags.map(t => t.name).join(', ') || 'Không rõ';
  const tagColor = tagConfig.embed_color || discussion.tags[0]?.color || '#5865F2';

  const embed = new EmbedBuilder()
    .setColor(parseColor(tagColor))
    .setTitle('📋 Yêu cầu duyệt bài viết')
    .setDescription('Bài viết mới cần được duyệt trước khi đăng thông báo.')
    .addFields(
      { name: '📝 Tiêu đề', value: discussion.title || 'Không có tiêu đề', inline: false },
      { name: '🏷️ Tag', value: tagName, inline: true },
      { name: '👤 Tác giả', value: discussion.author?.displayName || 'Ẩn danh', inline: true },
      { name: '🕒 Thời gian', value: discussion.createdAt ? formatDiscordTimestamp(discussion.createdAt) : 'N/A', inline: true },
      { name: '🔢 ID', value: `\`#${discussion.id}\``, inline: true },
      { name: '💬 Bình luận', value: `${discussion.commentCount}`, inline: true },
      { name: '📄 Xem trước', value: contentPreview || '*Không có nội dung*', inline: false },
    )
    .setURL(postUrl)
    .setFooter({ text: `${config.forumName} • Bấm nút bên dưới để duyệt hoặc từ chối` })
    .setTimestamp();

  if (discussion.author?.avatarUrl) embed.setThumbnail(discussion.author.avatarUrl);
  return embed;
}

function createApprovedReviewEmbed(discussion, moderatorName) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`✅ Đã duyệt: ${discussion.title || `#${discussion.id}`}`)
    .setDescription(`Bài viết đã được **${moderatorName}** duyệt và đăng thông báo.`)
    .setFooter({ text: config.forumName })
    .setTimestamp();
}

function createRejectedReviewEmbed(discussion, moderatorName) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`❌ Đã từ chối: ${discussion.title || `#${discussion.id}`}`)
    .setDescription(`Bài viết đã bị **${moderatorName}** từ chối.`)
    .setFooter({ text: config.forumName })
    .setTimestamp();
}

module.exports = { createReviewEmbed, createApprovedReviewEmbed, createRejectedReviewEmbed };
