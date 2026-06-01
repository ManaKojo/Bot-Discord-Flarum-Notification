/**
 * @file config/index.js
 * @description Nạp và export toàn bộ cấu hình từ file .env
 * Tập trung quản lý biến môi trường, không hardcode giá trị nào trong code.
 */

require('dotenv').config();

const config = {
  // === Discord ===
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    adminRoleIds: process.env.ADMIN_ROLE_IDS
      ? process.env.ADMIN_ROLE_IDS.split(',').map(id => id.trim())
      : [],
  },

  // === Flarum ===
  flarum: {
    apiUrl: process.env.FLARUM_API || 'https://example.com/api',
    baseUrl: process.env.FLARUM_BASE || 'https://example.com',
    apiToken: process.env.FLARUM_API_TOKEN || '',
  },

  // === Polling ===
  poll: {
    interval: parseInt(process.env.POLL_INTERVAL, 10) || 30000,
  },

  // === Ngôn ngữ & Hiển thị ===
  language: process.env.DEFAULT_LANGUAGE || 'vi',
  contentPreviewLength: parseInt(process.env.CONTENT_PREVIEW_LENGTH, 10) || 300,
  forumName: process.env.FORUM_NAME || 'Flarum Forum',

  // === Auto Approve ===
  autoApprove: {
    authors: process.env.AUTO_APPROVE_AUTHORS
      ? process.env.AUTO_APPROVE_AUTHORS.split(',').map(a => a.trim().toLowerCase())
      : [],
    tags: process.env.AUTO_APPROVE_TAGS
      ? process.env.AUTO_APPROVE_TAGS.split(',').map(t => t.trim().toLowerCase())
      : [],
  },

  // === API nâng cao ===
  api: {
    retryCount: parseInt(process.env.API_RETRY_COUNT, 10) || 3,
    timeout: parseInt(process.env.API_TIMEOUT, 10) || 10000,
  },

  // === Queue ===
  queue: {
    cooldown: parseInt(process.env.QUEUE_COOLDOWN, 10) || 2000,
  },
};

module.exports = config;
