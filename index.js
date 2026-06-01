/**
 * @file index.js
 * @description Entry point - Khởi tạo Discord Client, database, nạp commands/events và đăng nhập.
 *
 * Flarum Discord Notification Bot
 * - Theo dõi bài viết mới từ Flarum Forum
 * - Hệ thống duyệt bài với nút bấm
 * - Multi-tag, auto-approve, chống trùng
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./src/config');
const logger = require('./src/logger');
const dbService = require('./src/database/dbService');
const { loadCommands } = require('./src/handlers/commandHandler');
const fs = require('fs');
const path = require('path');

// =========================================
// Khởi tạo Discord Client
// =========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// =========================================
// Khởi tạo hệ thống
// =========================================
async function main() {
  logger.info('Main', '🔧 Đang khởi tạo hệ thống...');

  // Validate cấu hình
  if (!config.discord.token) {
    logger.error('Main', 'DISCORD_TOKEN chưa được cấu hình trong file .env');
    process.exit(1);
  }
  if (!config.discord.clientId) {
    logger.error('Main', 'CLIENT_ID chưa được cấu hình trong file .env');
    process.exit(1);
  }
  if (!config.discord.guildId) {
    logger.error('Main', 'GUILD_ID chưa được cấu hình trong file .env');
    process.exit(1);
  }

  // Khởi tạo database
  await dbService.initialize();

  // Nạp commands
  await loadCommands(client);

  // Nạp events
  loadEvents(client);

  // Đăng nhập Discord
  try {
    await client.login(config.discord.token);
  } catch (error) {
    logger.error('Main', 'Không thể đăng nhập Discord', error.message);
    process.exit(1);
  }
}

/**
 * Nạp tất cả event handlers từ thư mục events
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, 'src', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    logger.debug('Main', `Đã nạp event: ${event.name}`);
  }

  logger.info('Main', `Đã nạp ${eventFiles.length} events`);
}

// =========================================
// Global Error Handlers - Chống crash
// =========================================
process.on('unhandledRejection', (error) => {
  logger.error('Process', 'Unhandled Rejection', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Process', 'Uncaught Exception', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Main', '🛑 Đang tắt bot...');
  const pollService = require('./src/services/pollService');
  pollService.stop();
  dbService.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Main', '🛑 Nhận tín hiệu SIGTERM, đang tắt bot...');
  const pollService = require('./src/services/pollService');
  pollService.stop();
  dbService.close();
  client.destroy();
  process.exit(0);
});

// =========================================
// Chạy bot
// =========================================
main().catch(error => {
  logger.error('Main', 'Lỗi nghiêm trọng khi khởi tạo', error);
  process.exit(1);
});
