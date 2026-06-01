/**
 * @file services/pollService.js
 * @description Dịch vụ polling Flarum API theo chu kỳ.
 * Phát hiện bài viết mới, lọc theo tag đã cấu hình, chống trùng, và đẩy vào queue.
 */

const flarumApi = require('../api/flarum');
const dbService = require('../database/dbService');
const queueService = require('./queueService');
const Cache = require('../utils/cache');
const config = require('../config');
const logger = require('../logger');
const { createReviewEmbed } = require('../embeds/reviewEmbed');
const { createAnnounceEmbed } = require('../embeds/announceEmbed');
const { createReviewButtons, createAnnouncementButtons } = require('../buttons/reviewButtons');

// Cache chống trùng trong bộ nhớ (TTL 10 phút)
const processedCache = new Cache(10 * 60 * 1000);

let pollInterval = null;
let client = null;

/**
 * Khởi tạo poll service với Discord client
 * @param {import('discord.js').Client} discordClient
 */
function init(discordClient) {
  client = discordClient;
}

/**
 * Bắt đầu polling
 */
function start() {
  if (pollInterval) {
    logger.warn('PollService', 'Polling đã đang chạy, bỏ qua start()');
    return;
  }

  logger.info('PollService', `Bắt đầu polling Flarum mỗi ${config.poll.interval / 1000}s`);

  // Chạy ngay lần đầu
  checkNewDiscussions();

  // Chạy định kỳ
  pollInterval = setInterval(() => {
    checkNewDiscussions();
  }, config.poll.interval);
}

/**
 * Dừng polling
 */
function stop() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    logger.info('PollService', 'Đã dừng polling');
  }
}

/**
 * Ép kiểm tra bài viết mới ngay lập tức
 */
async function forceCheck() {
  logger.info('PollService', 'Ép kiểm tra bài viết mới...');
  await checkNewDiscussions();
}

/**
 * Kiểm tra bài viết mới từ Flarum
 */
async function checkNewDiscussions() {
  try {
    const tagConfigs = dbService.getAllTagConfigs();
    if (tagConfigs.length === 0) {
      logger.debug('PollService', 'Chưa có tag nào được cấu hình, bỏ qua polling');
      return;
    }

    // Tạo set các tag slug đang theo dõi
    const watchedSlugs = new Set(tagConfigs.map(tc => tc.tag_slug));

    // Lấy discussions mới nhất
    const apiResponse = await flarumApi.getDiscussions({ limit: 20 });
    const discussions = flarumApi.parseDiscussions(apiResponse);

    for (const discussion of discussions) {
      // Kiểm tra cache in-memory (chống trùng nhanh)
      const cacheKey = `disc_${discussion.id}`;
      if (processedCache.has(cacheKey)) continue;

      // Kiểm tra database (chống trùng khi restart)
      if (dbService.isProcessed(discussion.id)) {
        processedCache.set(cacheKey, true);
        continue;
      }

      // Tìm tag khớp với cấu hình
      const matchedTag = discussion.tags.find(t => watchedSlugs.has(t.slug));
      if (!matchedTag) continue;

      const tagConfig = tagConfigs.find(tc => tc.tag_slug === matchedTag.slug);
      if (!tagConfig) continue;

      // Đánh dấu đã xử lý ngay trong cache
      processedCache.set(cacheKey, true);

      // Đẩy vào queue xử lý
      queueService.enqueue(async () => {
        await processDiscussion(discussion, tagConfig);
      }).catch(err => {
        logger.error('PollService', `Lỗi xử lý discussion #${discussion.id}`, err.message);
      });
    }
  } catch (error) {
    logger.error('PollService', 'Lỗi khi polling Flarum API', error.message);
  }
}

/**
 * Xử lý một discussion mới
 */
async function processDiscussion(discussion, tagConfig) {
  logger.info('PollService', `Bài viết mới: #${discussion.id} - ${discussion.title}`);

  // Kiểm tra auto approve
  const shouldAutoApprove = checkAutoApprove(discussion, tagConfig);

  if (shouldAutoApprove) {
    // Tự động duyệt - gửi thẳng thông báo
    logger.info('PollService', `Tự động duyệt bài #${discussion.id}`);
    dbService.markProcessed(discussion.id, tagConfig.tag_slug, discussion.title, 'approved');
    await sendAnnouncement(discussion, tagConfig);
  } else {
    // Gửi yêu cầu duyệt
    await sendReview(discussion, tagConfig);
  }
}

/**
 * Kiểm tra bài viết có đủ điều kiện auto approve không
 */
function checkAutoApprove(discussion, tagConfig) {
  // Nếu tag config bật auto approve
  if (tagConfig.auto_approve) return true;

  // Kiểm tra author nằm trong whitelist
  if (discussion.author) {
    const authorName = discussion.author.username.toLowerCase();
    if (config.autoApprove.authors.includes(authorName)) return true;
  }

  // Kiểm tra tag nằm trong whitelist
  const tagSlugs = discussion.tags.map(t => t.slug.toLowerCase());
  if (tagSlugs.some(slug => config.autoApprove.tags.includes(slug))) return true;

  return false;
}

/**
 * Gửi embed duyệt bài vào kênh review
 */
async function sendReview(discussion, tagConfig) {
  try {
    const channel = await client.channels.fetch(tagConfig.review_channel_id);
    if (!channel) {
      logger.error('PollService', `Không tìm thấy kênh review: ${tagConfig.review_channel_id}`);
      return;
    }

    const embed = createReviewEmbed(discussion, tagConfig);
    const buttons = createReviewButtons(discussion.id, discussion.slug);

    const message = await channel.send({ embeds: [embed], components: [buttons] });

    // Lưu vào database
    dbService.markProcessed(discussion.id, tagConfig.tag_slug, discussion.title, 'pending', message.id);
    logger.info('PollService', `Đã gửi yêu cầu duyệt bài #${discussion.id} vào kênh review`);
  } catch (error) {
    logger.error('PollService', `Lỗi gửi review cho bài #${discussion.id}`, error.message);
  }
}

/**
 * Gửi embed thông báo vào kênh announcement
 */
async function sendAnnouncement(discussion, tagConfig) {
  try {
    const channel = await client.channels.fetch(tagConfig.announce_channel_id);
    if (!channel) {
      logger.error('PollService', `Không tìm thấy kênh thông báo: ${tagConfig.announce_channel_id}`);
      return;
    }

    // Mention role nếu bật
    let mentionContent = '';
    if (tagConfig.mention_toggle && tagConfig.role_mention_id) {
      mentionContent = `<@&${tagConfig.role_mention_id}>\n📢 **Có bài viết mới!**`;
    }

    const embed = createAnnounceEmbed(discussion, tagConfig);
    const buttons = createAnnouncementButtons(discussion.id, discussion.slug);

    await channel.send({
      content: mentionContent || undefined,
      embeds: [embed],
      components: [buttons],
    });

    logger.info('PollService', `Đã gửi thông báo bài #${discussion.id} vào kênh thông báo`);
  } catch (error) {
    logger.error('PollService', `Lỗi gửi thông báo cho bài #${discussion.id}`, error.message);
  }
}

module.exports = { init, start, stop, forceCheck, sendAnnouncement };
