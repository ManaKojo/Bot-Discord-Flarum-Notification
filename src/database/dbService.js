/**
 * @file database/dbService.js
 * @description Quản lý cơ sở dữ liệu SQLite với sql.js (pure JS, không cần native build).
 * Tự động tạo database và tables nếu chưa tồn tại.
 * Cung cấp các phương thức CRUD cho tag configs và processed posts.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'bot.db');

let db = null;

/**
 * Lưu database ra file
 */
function saveToFile() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    logger.error('Database', 'Lỗi lưu database ra file', error.message);
  }
}

/**
 * Khởi tạo database và tạo các bảng cần thiết
 */
async function initialize() {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    // Đọc file database cũ nếu có
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      logger.info('Database', 'Đã mở database hiện tại');
    } else {
      db = new SQL.Database();
      logger.info('Database', 'Tạo database mới');
    }

    // Tạo bảng tag_configs
    db.run(`
      CREATE TABLE IF NOT EXISTS tag_configs (
        tag_slug TEXT PRIMARY KEY,
        tag_name TEXT NOT NULL DEFAULT '',
        review_channel_id TEXT NOT NULL,
        announce_channel_id TEXT NOT NULL,
        role_mention_id TEXT DEFAULT NULL,
        auto_approve INTEGER NOT NULL DEFAULT 0,
        mention_toggle INTEGER NOT NULL DEFAULT 1,
        embed_color TEXT NOT NULL DEFAULT '#5865F2',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng processed_posts
    db.run(`
      CREATE TABLE IF NOT EXISTS processed_posts (
        discussion_id INTEGER PRIMARY KEY,
        tag_slug TEXT NOT NULL,
        title TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        review_message_id TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng approvals
    db.run(`
      CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discussion_id INTEGER NOT NULL,
        moderator_id TEXT NOT NULL,
        moderator_name TEXT DEFAULT '',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng rejected_posts
    db.run(`
      CREATE TABLE IF NOT EXISTS rejected_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discussion_id INTEGER NOT NULL,
        moderator_id TEXT NOT NULL,
        moderator_name TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng bot_settings
    db.run(`
      CREATE TABLE IF NOT EXISTS bot_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    saveToFile();
    logger.info('Database', 'Khởi tạo cơ sở dữ liệu thành công');
  } catch (error) {
    logger.error('Database', 'Lỗi khởi tạo cơ sở dữ liệu', error);
    throw error;
  }
}

// === Helper: chạy SELECT trả về mảng objects ===
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// === Helper: chạy SELECT trả về 1 object hoặc undefined ===
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

// === Helper: chạy INSERT/UPDATE/DELETE ===
function execute(sql, params = []) {
  db.run(sql, params);
  saveToFile();
}

// =========================
//   TAG CONFIGS
// =========================

function upsertTagConfig(tagSlug, config) {
  execute(`
    INSERT OR REPLACE INTO tag_configs (tag_slug, tag_name, review_channel_id, announce_channel_id, role_mention_id, auto_approve, mention_toggle, embed_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    tagSlug,
    config.tagName || '',
    config.reviewChannelId,
    config.announceChannelId,
    config.roleMentionId || null,
    config.autoApprove ? 1 : 0,
    config.mentionToggle !== undefined ? (config.mentionToggle ? 1 : 0) : 1,
    config.embedColor || '#5865F2',
  ]);
  logger.info('Database', `Đã lưu cấu hình tag: ${tagSlug}`);
}

function getAllTagConfigs() {
  return queryAll('SELECT * FROM tag_configs');
}

function getTagConfig(tagSlug) {
  return queryOne('SELECT * FROM tag_configs WHERE tag_slug = ?', [tagSlug]);
}

function removeTagConfig(tagSlug) {
  const before = queryOne('SELECT tag_slug FROM tag_configs WHERE tag_slug = ?', [tagSlug]);
  if (!before) return false;
  execute('DELETE FROM tag_configs WHERE tag_slug = ?', [tagSlug]);
  return true;
}

// =========================
//   PROCESSED POSTS
// =========================

function isProcessed(discussionId) {
  return !!queryOne('SELECT discussion_id FROM processed_posts WHERE discussion_id = ?', [discussionId]);
}

function markProcessed(discussionId, tagSlug, title, status = 'pending', reviewMessageId = null) {
  const existing = queryOne('SELECT discussion_id FROM processed_posts WHERE discussion_id = ?', [discussionId]);
  if (existing) return; // Không ghi đè
  execute(`
    INSERT INTO processed_posts (discussion_id, tag_slug, title, status, review_message_id)
    VALUES (?, ?, ?, ?, ?)
  `, [discussionId, tagSlug, title, status, reviewMessageId]);
}

function updatePostStatus(discussionId, status) {
  execute('UPDATE processed_posts SET status = ? WHERE discussion_id = ?', [status, discussionId]);
}

function getProcessedPost(discussionId) {
  return queryOne('SELECT * FROM processed_posts WHERE discussion_id = ?', [discussionId]);
}

function setReviewMessageId(discussionId, messageId) {
  execute('UPDATE processed_posts SET review_message_id = ? WHERE discussion_id = ?', [messageId, discussionId]);
}

// =========================
//   APPROVALS / REJECTIONS
// =========================

function logApproval(discussionId, moderatorId, moderatorName) {
  execute(`INSERT INTO approvals (discussion_id, moderator_id, moderator_name) VALUES (?, ?, ?)`,
    [discussionId, moderatorId, moderatorName]);
}

function logRejection(discussionId, moderatorId, moderatorName, reason = '') {
  execute(`INSERT INTO rejected_posts (discussion_id, moderator_id, moderator_name, reason) VALUES (?, ?, ?, ?)`,
    [discussionId, moderatorId, moderatorName, reason]);
}

// =========================
//   BOT SETTINGS
// =========================

function getSetting(key) {
  const row = queryOne('SELECT value FROM bot_settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

function setSetting(key, value) {
  execute(`INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)`, [key, String(value)]);
}

// =========================
//   STATISTICS
// =========================

function countProcessed() {
  const row = queryOne('SELECT COUNT(*) as total FROM processed_posts');
  return row ? row.total : 0;
}

function countByStatus(status) {
  const row = queryOne('SELECT COUNT(*) as total FROM processed_posts WHERE status = ?', [status]);
  return row ? row.total : 0;
}

function close() {
  if (db) {
    saveToFile();
    db.close();
    logger.info('Database', 'Đã đóng kết nối cơ sở dữ liệu');
  }
}

module.exports = {
  initialize,
  upsertTagConfig,
  getAllTagConfigs,
  getTagConfig,
  removeTagConfig,
  isProcessed,
  markProcessed,
  updatePostStatus,
  getProcessedPost,
  setReviewMessageId,
  logApproval,
  logRejection,
  getSetting,
  setSetting,
  countProcessed,
  countByStatus,
  close,
};
