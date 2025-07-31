// src/utils/apiCache.js
/**
 * Global cache để tránh spam API calls
 */

// Cache flags để theo dõi trạng thái loading
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

export default apiCache;
