/**
 * @file commands/ping.js
 * @description Slash command kiểm tra độ trễ của bot.
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiểm tra độ trễ của bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Đang đo...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsHeartbeat = interaction.client.ws.ping;

    await interaction.editReply({
      content: `🏓 **Pong!**\n⏱️ Roundtrip: **${roundtrip}ms**\n💓 WebSocket: **${wsHeartbeat}ms**`,
    });
  },
};
