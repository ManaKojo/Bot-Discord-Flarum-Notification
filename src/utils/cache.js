/**
 * @file utils/cache.js
 * @description Bộ nhớ đệm in-memory đơn giản để chống gửi trùng và giảm tải database.
 * Sử dụng Map với TTL (Time-To-Live) tự động xóa entry hết hạn.
 */

class Cache {
  /**
   * @param {number} ttl - Thời gian sống của mỗi entry (ms). Mặc định 10 phút.
   */
  constructor(ttl = 10 * 60 * 1000) {
    this._store = new Map();
    this._ttl = ttl;

    // Dọn dẹp cache định kỳ mỗi 5 phút
    this._cleanupInterval = setInterval(() => this._cleanup(), 5 * 60 * 1000);
    this._cleanupInterval.unref(); // Không giữ event loop
  }

  /**
   * Thêm hoặc cập nhật giá trị vào cache
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + this._ttl,
    });
  }

  /**
   * Lấy giá trị từ cache. Trả về undefined nếu không tồn tại hoặc hết hạn.
   * @param {string} key
   * @returns {*|undefined}
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Kiểm tra key có tồn tại và còn hiệu lực không
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Xóa entry khỏi cache
   * @param {string} key
   */
  delete(key) {
    this._store.delete(key);
  }

  /**
   * Xóa toàn bộ cache
   */
  clear() {
    this._store.clear();
  }

  /**
   * Dọn dẹp entry đã hết hạn
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt) {
        this._store.delete(key);
      }
    }
  }

  /**
   * Hủy interval dọn dẹp (gọi khi shutdown)
   */
  destroy() {
    clearInterval(this._cleanupInterval);
    this._store.clear();
  }
}

module.exports = Cache;
