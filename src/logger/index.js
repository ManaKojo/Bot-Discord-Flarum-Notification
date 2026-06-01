/**
 * @file logger/index.js
 * @description Logger hệ thống với phân loại INFO / WARN / ERROR
 * Hiển thị timestamp, tên module và nội dung chi tiết.
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

/**
 * Lấy timestamp hiện tại dạng YYYY-MM-DD HH:mm:ss
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Ghi log ra console với định dạng đẹp mắt
 * @param {'INFO'|'WARN'|'ERROR'|'DEBUG'} level - Mức độ log
 * @param {string} module - Tên module phát sinh log
 * @param {string} message - Nội dung thông điệp
 * @param {*} [data] - Dữ liệu bổ sung (optional)
 */
function log(level, module, message, data = null) {
  const timestamp = getTimestamp();

  const levelColors = {
    INFO: COLORS.green,
    WARN: COLORS.yellow,
    ERROR: COLORS.red,
    DEBUG: COLORS.gray,
  };

  const levelIcons = {
    INFO: '✅',
    WARN: '⚠️',
    ERROR: '❌',
    DEBUG: '🔍',
  };

  const color = levelColors[level] || COLORS.reset;
  const icon = levelIcons[level] || '';

  const formatted = `${COLORS.gray}[${timestamp}]${COLORS.reset} ${color}${COLORS.bright}[${level}]${COLORS.reset} ${COLORS.cyan}[${module}]${COLORS.reset} ${icon} ${message}`;

  if (level === 'ERROR') {
    console.error(formatted);
    if (data) console.error(data);
  } else if (level === 'WARN') {
    console.warn(formatted);
    if (data) console.warn(data);
  } else {
    console.log(formatted);
    if (data) console.log(data);
  }
}

const logger = {
  info: (module, message, data) => log('INFO', module, message, data),
  warn: (module, message, data) => log('WARN', module, message, data),
  error: (module, message, data) => log('ERROR', module, message, data),
  debug: (module, message, data) => log('DEBUG', module, message, data),
};

module.exports = logger;
