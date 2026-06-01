/**
 * @file events/interactionCreate.js
 * @description Event handler xử lý tất cả interactions: slash commands và button clicks.
 */

const { Events } = require('discord.js');
const config = require('../config');
const dbService = require('../database/dbService');
const flarumApi = require('../api/flarum');
const pollService = require('../services/pollService');
const logger = require('../logger');
const { isAdmin } = require('../utils/helpers');
const { createApprovedReviewEmbed, createRejectedReviewEmbed } = require('../embeds/reviewEmbed');
const { createDisabledButtons } = require('../buttons/reviewButtons');

// Cooldown map chống spam interaction
const cooldowns = new Map();
const COOLDOWN_MS = 3000;

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    // === Slash Commands ===
    if (interaction.isChatInputCommand()) {
      return handleCommand(interaction);
    }

    // === Button Interactions ===
    if (interaction.isButton()) {
      return handleButton(interaction);
    }
  },
};

/**
 * Xử lý slash commands
 */
async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error('Interaction', `Lỗi command /${interaction.commandName}`, error.message);
    const reply = { content: '❌ Đã xảy ra lỗi khi thực thi lệnh.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}

/**
 * Xử lý button click (duyệt/từ chối)
 */
async function handleButton(interaction) {
  const customId = interaction.customId;

  // Chỉ xử lý nút approve/reject
  if (!customId.startsWith('approve_') && !customId.startsWith('reject_')) return;

  // Kiểm tra cooldown chống spam
  const cooldownKey = `${interaction.user.id}_${customId}`;
  if (cooldowns.has(cooldownKey)) {
    return interaction.reply({
      content: '⏳ Vui lòng đợi vài giây trước khi thao tác tiếp.',
      ephemeral: true,
    });
  }
  cooldowns.set(cooldownKey, true);
  setTimeout(() => cooldowns.delete(cooldownKey), COOLDOWN_MS);

  // Kiểm tra quyền admin
  if (!isAdmin(interaction.member, config.discord.adminRoleIds)) {
    return interaction.reply({
      content: '🔒 Bạn không có quyền thực hiện thao tác này.',
      ephemeral: true,
    });
  }

  // Parse discussion ID
  const parts = customId.split('_');
  const action = parts[0]; // approve hoặc reject
  const discussionId = parseInt(parts[1], 10);

  if (isNaN(discussionId)) {
    return interaction.reply({ content: '❌ ID bài viết không hợp lệ.', ephemeral: true });
  }

  // Kiểm tra đã xử lý chưa (chống duplicate interaction)
  const post = dbService.getProcessedPost(discussionId);
  if (!post) {
    return interaction.reply({ content: '⚠️ Không tìm thấy bài viết trong hệ thống.', ephemeral: true });
  }
  if (post.status !== 'pending') {
    return interaction.reply({
      content: `⚠️ Bài viết này đã được xử lý (${post.status}).`,
      ephemeral: true,
    });
  }

  await interaction.deferUpdate();

  try {
    if (action === 'approve') {
      await handleApprove(interaction, discussionId, post);
    } else if (action === 'reject') {
      await handleReject(interaction, discussionId, post);
    }
  } catch (error) {
    logger.error('Interaction', `Lỗi xử lý button ${customId}`, error.message);
    await interaction.followUp({ content: '❌ Đã xảy ra lỗi khi xử lý.', ephemeral: true }).catch(() => {});
  }
}

/**
 * Xử lý duyệt bài
 */
async function handleApprove(interaction, discussionId, post) {
  const moderatorName = interaction.user.displayName || interaction.user.username;

  // Cập nhật database
  dbService.updatePostStatus(discussionId, 'approved');
  dbService.logApproval(discussionId, interaction.user.id, moderatorName);

  // Cập nhật embed review thành đã duyệt
  const approvedEmbed = createApprovedReviewEmbed(
    { title: post.title, id: discussionId },
    moderatorName,
  );
  await interaction.editReply({
    embeds: [approvedEmbed],
    components: [createDisabledButtons()],
  });

  // Gửi thông báo sang kênh announcement
  const tagConfig = dbService.getTagConfig(post.tag_slug);
  if (tagConfig) {
    try {
      // Lấy thông tin chi tiết bài viết từ Flarum
      const apiResponse = await flarumApi.getDiscussion(discussionId);
      const discussions = flarumApi.parseDiscussions({ data: [apiResponse.data], included: apiResponse.included || [] });
      const discussion = discussions[0];

      if (discussion) {
        await pollService.sendAnnouncement(discussion, tagConfig);
      }
    } catch (err) {
      logger.error('Interaction', `Lỗi lấy chi tiết bài #${discussionId} để gửi thông báo`, err.message);
      // Fallback: gửi thông báo với thông tin tối thiểu
      await pollService.sendAnnouncement(
        { id: discussionId, title: post.title, slug: '', tags: [{ name: tagConfig.tag_name, slug: post.tag_slug }], author: null, firstPostContent: '', createdAt: post.created_at, commentCount: 0 },
        tagConfig,
      );
    }
  }

  logger.info('Interaction', `✅ Bài #${discussionId} được duyệt bởi ${moderatorName}`);
}

/**
 * Xử lý từ chối bài
 */
async function handleReject(interaction, discussionId, post) {
  const moderatorName = interaction.user.displayName || interaction.user.username;

  // Cập nhật database
  dbService.updatePostStatus(discussionId, 'rejected');
  dbService.logRejection(discussionId, interaction.user.id, moderatorName);

  // Cập nhật embed review thành đã từ chối
  const rejectedEmbed = createRejectedReviewEmbed(
    { title: post.title, id: discussionId },
    moderatorName,
  );
  await interaction.editReply({
    embeds: [rejectedEmbed],
    components: [createDisabledButtons()],
  });

  logger.info('Interaction', `❌ Bài #${discussionId} bị từ chối bởi ${moderatorName}`);
}
