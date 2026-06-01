/**
 * @file utils/helpers.js
 * @description Các hàm tiện ích dùng chung trong toàn bộ dự án.
 */

/**
 * Cắt ngắn chuỗi text và thêm dấu "..." nếu vượt quá độ dài tối đa.
 * @param {string} text - Chuỗi gốc
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string}
 */
function truncateText(text, maxLength = 300) {
  if (!text) return '';
  // Loại bỏ HTML tags cơ bản
  const cleaned = text.replace(/<[^>]*>/g, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + '...';
}

/**
 * Loại bỏ HTML tags khỏi chuỗi
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Định dạng thời gian dạng Discord relative timestamp
 * @param {string|Date} dateInput - Chuỗi ngày hoặc Date object
 * @returns {string} Discord timestamp format <t:unix:R>
 */
function formatDiscordTimestamp(dateInput) {
  const date = new Date(dateInput);
  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:R>`;
}

/**
 * Định dạng thời gian dạng đầy đủ DD/MM/YYYY HH:mm
 * @param {string|Date} dateInput
 * @returns {string}
 */
function formatFullDate(dateInput) {
  const date = new Date(dateInput);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/**
 * Tạo link bài viết Flarum từ slug và id
 * @param {string} baseUrl - URL gốc của Flarum
 * @param {string} slug - Slug bài viết
 * @param {number} id - ID bài viết
 * @returns {string}
 */
function buildDiscussionUrl(baseUrl, slug, id) {
  return `${baseUrl}/d/${slug || id}`;
}

/**
 * Delay thực thi (dùng cho queue, retry)
 * @param {number} ms - Số millisecond
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Kiểm tra member Discord có quyền admin hay không
 * @param {import('discord.js').GuildMember} member
 * @param {string[]} adminRoleIds - Danh sách Role ID cho phép
 * @returns {boolean}
 */
function isAdmin(member, adminRoleIds = []) {
  // Kiểm tra quyền Administrator
  if (member.permissions.has('Administrator')) return true;
  // Kiểm tra có role admin được chỉ định
  if (adminRoleIds.length > 0) {
    return adminRoleIds.some(roleId => member.roles.cache.has(roleId));
  }
  return false;
}

/**
 * Parse màu hex sang số nguyên cho Discord embed
 * @param {string} hexColor - Mã màu hex (vd: #FF5733)
 * @returns {number}
 */
function parseColor(hexColor) {
  if (!hexColor) return 0x5865f2; // Discord blurple mặc định
  const hex = hexColor.replace('#', '');
  return parseInt(hex, 16) || 0x5865f2;
}

module.exports = {
  truncateText,
  stripHtml,
  formatDiscordTimestamp,
  formatFullDate,
  buildDiscussionUrl,
  sleep,
  isAdmin,
  parseColor,
};
