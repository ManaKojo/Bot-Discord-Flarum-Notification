/**
 * @file embeds/announceEmbed.js
 * @description Tạo embed thông báo bài viết đã duyệt gửi vào kênh thông báo.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { truncateText, stripHtml, formatDiscordTimestamp, buildDiscussionUrl, parseColor } = require('../utils/helpers');

function createAnnounceEmbed(discussion, tagConfig) {
  const postUrl = buildDiscussionUrl(config.flarum.baseUrl, discussion.slug, discussion.id);
  const contentPreview = truncateText(stripHtml(discussion.firstPostContent), config.contentPreviewLength);
  const tagName = discussion.tags.map(t => t.name).join(', ') || 'Không rõ';
  const tagColor = tagConfig.embed_color || discussion.tags[0]?.color || '#5865F2';

  const embed = new EmbedBuilder()
    .setColor(parseColor(tagColor))
    .setTitle(`📝 ${discussion.title || 'Bài viết mới'}`)
    .setURL(postUrl)
    .setDescription([
      `📢 **Bài viết mới** trong **[${tagName}]**`,
      '',
      `👤 **Tác giả:** ${discussion.author?.displayName || 'Ẩn danh'}`,
      `🕒 **Thời gian:** ${discussion.createdAt ? formatDiscordTimestamp(discussion.createdAt) : 'N/A'}`,
      `🏷️ **Tag:** ${tagName}`,
      '',
      `📄 **Nội dung xem trước:**`,
      contentPreview || '*Không có nội dung xem trước*',
    ].join('\n'))
    .setFooter({ text: `${config.forumName} • Bấm nút bên dưới để xem bài viết đầy đủ` })
    .setTimestamp();

  if (discussion.author?.avatarUrl) embed.setThumbnail(discussion.author.avatarUrl);
  return embed;
}

module.exports = { createAnnounceEmbed };
