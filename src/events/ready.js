/**
 * @file events/ready.js
 * @description Event handler khi bot khởi động và kết nối thành công.
 */

const { Events } = require('discord.js');
const { registerCommands } = require('../handlers/commandHandler');
const pollService = require('../services/pollService');
const logger = require('../logger');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.info('Bot', `✨ Bot đã đăng nhập: ${client.user.tag}`);
    logger.info('Bot', `📡 Đang hoạt động trên ${client.guilds.cache.size} server`);

    // Đăng ký slash commands
    await registerCommands(client);

    // Khởi tạo và bắt đầu polling
    pollService.init(client);
    pollService.start();

    // Cập nhật status
    client.user.setPresence({
      activities: [{ name: 'Flarum Forum 📢', type: 3 }],
      status: 'online',
    });

    logger.info('Bot', '🚀 Bot sẵn sàng hoạt động!');
  },
};
