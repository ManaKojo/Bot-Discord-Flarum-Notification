/**
 * @file services/queueService.js
 * @description Hàng đợi xử lý tuần tự để tránh xung đột khi ghi database
 * và ngăn chặn việc gửi nhiều tin nhắn Discord cùng lúc (rate limit).
 */

const logger = require('../logger');
const { sleep } = require('../utils/helpers');
const config = require('../config');

class QueueService {
  constructor() {
    /** @type {Array<Function>} Hàng đợi các tác vụ */
    this._queue = [];
    /** @type {boolean} Đang xử lý hay không */
    this._processing = false;
  }

  /**
   * Thêm tác vụ vào hàng đợi
   * @param {Function} task - Hàm async cần thực thi
   * @returns {Promise<*>} Kết quả thực thi
   */
  enqueue(task) {
    return new Promise((resolve, reject) => {
      this._queue.push({ task, resolve, reject });
      this._process();
    });
  }

  /**
   * Xử lý hàng đợi theo thứ tự FIFO
   */
  async _process() {
    if (this._processing) return;
    this._processing = true;

    while (this._queue.length > 0) {
      const { task, resolve, reject } = this._queue.shift();
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        logger.error('Queue', 'Lỗi khi xử lý tác vụ trong hàng đợi', error.message);
        reject(error);
      }

      // Cooldown giữa các tác vụ để tránh rate limit
      if (this._queue.length > 0) {
        await sleep(config.queue.cooldown);
      }
    }

    this._processing = false;
  }

  /**
   * Số lượng tác vụ đang chờ
   * @returns {number}
   */
  get pending() {
    return this._queue.length;
  }

  /**
   * Xóa toàn bộ hàng đợi
   */
  clear() {
    this._queue = [];
  }
}

// Export singleton instance
module.exports = new QueueService();
