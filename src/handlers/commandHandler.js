/**
 * @file handlers/commandHandler.js
 * @description Tự động quét thư mục commands và đăng ký slash commands lên Discord.
 */

const fs = require('fs');
const path = require('path');
const { REST, Routes, Collection } = require('discord.js');
const config = require('../config');
const logger = require('../logger');

/**
 * Nạp tất cả commands từ thư mục src/commands
 * @param {import('discord.js').Client} client
 */
async function loadCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      logger.debug('CommandHandler', `Đã nạp command: /${command.data.name}`);
    }
  }

  logger.info('CommandHandler', `Đã nạp ${client.commands.size} commands`);
}

/**
 * Đăng ký slash commands lên Discord API
 * @param {import('discord.js').Client} client
 */
async function registerCommands(client) {
  const commands = [];
  client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    logger.info('CommandHandler', `Đang đăng ký ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands },
    );
    logger.info('CommandHandler', 'Đăng ký slash commands thành công!');
  } catch (error) {
    logger.error('CommandHandler', 'Lỗi đăng ký slash commands', error);
  }
}

module.exports = { loadCommands, registerCommands };
