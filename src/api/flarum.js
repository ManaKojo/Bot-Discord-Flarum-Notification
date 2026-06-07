/**
 * @file api/flarum.js
 * @description Client gọi Flarum REST API với retry, timeout và xử lý lỗi.
 * Hỗ trợ lấy danh sách discussions mới nhất kèm tags và user.
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../logger');
const { sleep } = require('../utils/helpers');

/**
 * Tạo axios instance với cấu hình sẵn
 */
const flarumClient = axios.create({
  baseURL: config.flarum.apiUrl,
  timeout: config.api.timeout,
  // headers: {
  //   'Content-Type': 'application/json',
  //   ...(config.flarum.apiToken
  //     ? { Authorization: `Token ${config.flarum.apiToken}` }
  //     : {}),
  // },
  headers: {
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'Accept':
      'application/json,text/plain,*/*',
    'Accept-Language':
      'en-US,en;q=0.9',

    ...(config.flarum.apiToken
      ? { Authorization: `Token ${config.flarum.apiToken}` }
      : {}),
  }
});

// debug xem tsao lại bị lỗi 403
function debugAxiosError(error) {
  console.log('========== AXIOS DEBUG ==========');

  console.log('Message:', error.message);

  if (error.config) {
    console.log('BaseURL:', error.config.baseURL);
    console.log('URL:', error.config.url);
    console.log('Method:', error.config.method);
    console.log('Headers:', error.config.headers);
  }

  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Response Headers:', error.response.headers);

    if (typeof error.response.data === 'string') {
      console.log(error.response.data.substring(0, 5000));
    } else {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('=================================');
}
/**
 * Gọi API với cơ chế retry tự động
 * @param {Function} requestFn - Hàm gọi axios
 * @param {number} retries - Số lần retry tối đa
 * @returns {Promise<*>}
 */
async function withRetry(requestFn, retries = config.api.retryCount) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const isLastAttempt = attempt === retries;

      // debugAxiosError(error); // Hàm để test 

      // Không retry nếu là lỗi 4xx (client error)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      if (isLastAttempt) {
        logger.error('FlarumAPI', `Thất bại sau ${retries} lần thử`, error.message);
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
      logger.warn('FlarumAPI', `Lần thử ${attempt}/${retries} thất bại. Retry sau ${delay}ms...`);
      await sleep(delay);

    }
  }
}

/**
 * Lấy danh sách discussions mới nhất từ Flarum
 * @param {Object} options
 * @param {number} [options.page] - Trang hiện tại (mặc định 1)
 * @param {number} [options.limit] - Số lượng mỗi trang (mặc định 20)
 * @returns {Promise<Object>} JSON:API response
 */
async function getDiscussions({ page = 1, limit = 20 } = {}) {
  return withRetry(async () => {
    const response = await flarumClient.get('/discussions', {
      params: {
        'include': 'tags,user',
        'sort': '-createdAt',
        'page[offset]': (page - 1) * limit,
        'page[limit]': limit,
      },
    });
    return response.data;
  });
}

/**
 * Lấy chi tiết một discussion theo ID
 * @param {number} discussionId
 * @returns {Promise<Object>}
 */
async function getDiscussion(discussionId) {
  return withRetry(async () => {
    const response = await flarumClient.get(`/discussions/${discussionId}`, {
      params: {
        include: 'tags,user,firstPost',
      },
    });
    return response.data;
  });
}

/**
 * Trích xuất thông tin hữu ích từ JSON:API response của Flarum
 * @param {Object} apiResponse - Raw JSON:API response
 * @returns {Array<Object>} Danh sách discussions đã parse
 */
function parseDiscussions(apiResponse) {
  if (!apiResponse || !apiResponse.data) return [];

  const included = apiResponse.included || [];

  // Tạo map lookup cho included resources
  const includedMap = {};
  for (const item of included) {
    const key = `${item.type}-${item.id}`;
    includedMap[key] = item;
  }

  return apiResponse.data.map(discussion => {
    const attrs = discussion.attributes || {};
    const relationships = discussion.relationships || {};

    // Trích xuất tags
    const tags = [];
    if (relationships.tags && relationships.tags.data) {
      for (const tagRef of relationships.tags.data) {
        const tagData = includedMap[`tags-${tagRef.id}`];
        if (tagData) {
          tags.push({
            id: tagData.id,
            name: tagData.attributes.name,
            slug: tagData.attributes.slug,
            color: tagData.attributes.color,
            icon: tagData.attributes.icon,
          });
        }
      }
    }

    // Trích xuất user
    let author = null;
    if (relationships.user && relationships.user.data) {
      const userData = includedMap[`users-${relationships.user.data.id}`];
      if (userData) {
        author = {
          id: userData.id,
          username: userData.attributes.username,
          displayName: userData.attributes.displayName || userData.attributes.username,
          avatarUrl: userData.attributes.avatarUrl,
        };
      }
    }

    // Trích xuất nội dung bài viết đầu tiên (firstPost)
    let firstPostContent = '';
    if (relationships.firstPost && relationships.firstPost.data) {
      const postData = includedMap[`posts-${relationships.firstPost.data.id}`];
      if (postData && postData.attributes) {
        firstPostContent = postData.attributes.contentHtml || postData.attributes.content || '';
      }
    }

    return {
      id: parseInt(discussion.id, 10),
      title: attrs.title || 'Không có tiêu đề',
      slug: attrs.slug || '',
      createdAt: attrs.createdAt,
      commentCount: attrs.commentCount || 0,
      participantCount: attrs.participantCount || 0,
      firstPostContent,
      tags,
      author,
    };
  });
}

/**
 * Kiểm tra kết nối tới Flarum API
 * @returns {Promise<{ok: boolean, latency: number}>}
 */
async function healthCheck() {
  const start = Date.now();
  try {
    await flarumClient.get('/discussions', {
      params: { 'page[limit]': 1 },
      timeout: 5000,
    });
    return { ok: true, latency: Date.now() - start };
  } catch (error) {
    return { ok: false, latency: Date.now() - start, error: error.message };
  }
}

module.exports = {
  getDiscussions,
  getDiscussion,
  parseDiscussions,
  healthCheck,
};
