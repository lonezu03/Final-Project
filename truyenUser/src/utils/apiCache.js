// src/utils/apiCache.js
/**
 * Enhanced Global cache để tránh spam API calls với time-based caching
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.lastFetchTime = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 phút
    this.MIN_REQUEST_INTERVAL = 2000; // 2 giây giữa các request giống nhau
  }

  // Tạo key duy nhất cho mỗi API call
  generateKey(actionType, params) {
    return `${actionType}_${JSON.stringify(params || {})}`;
  }

  // Kiểm tra xem có nên gọi API không
  shouldFetch(actionType, params = {}) {
    const key = this.generateKey(actionType, params);
    const now = Date.now();
    
    // Kiểm tra xem có request đang pending không
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ [APICache] Request ${key} is already pending`);
      return false;
    }
    
    // Kiểm tra interval giữa các request
    const lastFetch = this.lastFetchTime.get(key);
    if (lastFetch && (now - lastFetch) < this.MIN_REQUEST_INTERVAL) {
      console.log(`🚫 [APICache] Request ${key} too frequent, skipping`);
      return false;
    }
    
    return true;
  }

  // Đánh dấu request bắt đầu
  markRequestStart(actionType, params = {}) {
    const key = this.generateKey(actionType, params);
    this.pendingRequests.set(key, true);
    this.lastFetchTime.set(key, Date.now());
    console.log(`🔄 [APICache] Starting request ${key}`);
  }

  // Đánh dấu request hoàn thành
  markRequestComplete(actionType, params = {}) {
    const key = this.generateKey(actionType, params);
    this.pendingRequests.delete(key);
    console.log(`✅ [APICache] Completed request ${key}`);
  }

  // Xóa cache cho một key cụ thể
  invalidateCache(actionType, params = {}) {
    const key = this.generateKey(actionType, params);
    this.cache.delete(key);
    console.log(`🗑️ [APICache] Invalidated cache for ${key}`);
  }

  // Xóa toàn bộ cache khi user logout
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.lastFetchTime.clear();
    console.log(`🗑️ [APICache] Cleared all cache`);
  }
}

// Tạo instance singleton
const apiCacheInstance = new APICache();

// Legacy API cache flags để tương thích với code cũ
const apiCache = {
  novelsLoading: false,
  novelsLoaded: false,
  categoriesLoading: false,
  categoriesLoaded: false,
};

export const setNovelsLoading = (loading) => {
  apiCache.novelsLoading = loading;
  if (loading === false) {
    apiCache.novelsLoaded = true;
  }
};

export const setNovelsLoaded = (loaded) => {
  apiCache.novelsLoaded = loaded;
};

export const isNovelsLoading = () => apiCache.novelsLoading;
export const isNovelsLoaded = () => apiCache.novelsLoaded;

export const setCategoriesLoading = (loading) => {
  apiCache.categoriesLoading = loading;
  if (loading === false) {
    apiCache.categoriesLoaded = true;
  }
};

export const setCategoriesLoaded = (loaded) => {
  apiCache.categoriesLoaded = loaded;
};

export const isCategoriesLoading = () => apiCache.categoriesLoading;
export const isCategoriesLoaded = () => apiCache.categoriesLoaded;

// Function để reset cache khi cần thiết (logout, refresh, etc.)
export const resetApiCache = () => {
  apiCache.novelsLoading = false;
  apiCache.novelsLoaded = false;
  apiCache.categoriesLoading = false;
  apiCache.categoriesLoaded = false;
};

// New enhanced API cache functions
export const shouldFetchData = (actionType, params) => {
  return apiCacheInstance.shouldFetch(actionType, params);
};

export const markFetchStart = (actionType, params) => {
  apiCacheInstance.markRequestStart(actionType, params);
};

export const markFetchComplete = (actionType, params) => {
  apiCacheInstance.markRequestComplete(actionType, params);
};

export const invalidateCache = (actionType, params) => {
  apiCacheInstance.invalidateCache(actionType, params);
};

export const clearAllCache = () => {
  apiCacheInstance.clearCache();
};

export default apiCache;
