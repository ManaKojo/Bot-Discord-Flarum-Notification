/**
 * @file buttons/reviewButtons.js
 * @description Tạo hàng nút (Action Row) cho tin nhắn duyệt bài và thông báo.
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const { buildDiscussionUrl } = require('../utils/helpers');

/**
 * Tạo hàng nút duyệt/từ chối cho embed review
 * @param {number} discussionId - ID bài viết
 * @param {string} slug - Slug bài viết
 * @returns {ActionRowBuilder}
 */
function createReviewButtons(discussionId, slug) {
  const postUrl = buildDiscussionUrl(config.flarum.baseUrl, slug, discussionId);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_${discussionId}`)
      .setLabel('Duyệt')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_${discussionId}`)
      .setLabel('Từ chối')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel('Xem bài viết')
      .setEmoji('🔗')
      .setStyle(ButtonStyle.Link)
      .setURL(postUrl),
  );
}

/**
 * Tạo nút link xem bài viết cho embed thông báo
 * @param {number} discussionId
 * @param {string} slug
 * @returns {ActionRowBuilder}
 */
function createAnnouncementButtons(discussionId, slug) {
  const postUrl = buildDiscussionUrl(config.flarum.baseUrl, slug, discussionId);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🔗 Xem bài viết')
      .setStyle(ButtonStyle.Link)
      .setURL(postUrl),
  );
}

/**
 * Tạo hàng nút đã vô hiệu (sau khi duyệt/từ chối)
 * @returns {ActionRowBuilder}
 */
function createDisabledButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('disabled_approve')
      .setLabel('Đã xử lý')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );
}

module.exports = { createReviewButtons, createAnnouncementButtons, createDisabledButtons };
