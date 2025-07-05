// src/redux/novelSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; // Dùng cho các API public không cần token
import apiClient from '../services/api'; // Dùng cho các API cần token (đã cấu hình interceptor)
import { rooturl } from './element'; // Import đường dẫn gốc từ file element
// Base URL cho các API public liên quan đến novel
const publicApiBaseNovel = `${rooturl}/novel`;
// Base URL tương đối cho các API cần token (sẽ được ghép với baseURL của apiClient)
const protectedApiBaseNovel = "/novel"; // Ví dụ: /novel/create, /novel/update/:id

// --- API THUNKS ---

// 1. Lấy tất cả truyện (API Public - không cần token)
export const getAllNovels = createAsyncThunk(
  'novels/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${publicApiBaseNovel}/getAll`);
      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách truyện.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải danh sách truyện.');
    }
  }
);

// 2. Lấy truyện theo ID (API Public - không cần token)
export const getNovelById = createAsyncThunk(
  'novels/getById',
  async (idNovel, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${publicApiBaseNovel}/${idNovel}`);
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || `Không thể tải truyện với ID ${idNovel}.`);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || `Lỗi khi tải truyện với ID ${idNovel}.`);
    }
  }
);

// 3. Tạo truyện mới (API cần token)
export const createNovel = createAsyncThunk(
  'novels/create',
  async (novelData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`${protectedApiBaseNovel}/create`, novelData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể tạo truyện mới.');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Không có quyền truy cập hoặc phiên đăng nhập hết hạn.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tạo truyện mới.');
    }
  }
);

// 4. Cập nhật truyện (API cần token)
export const updateNovel = createAsyncThunk(
  'novels/update',
  async ({ idNovel, novelUpdateData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`${protectedApiBaseNovel}/update/${idNovel}`, novelUpdateData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể cập nhật truyện.');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Không có quyền truy cập hoặc phiên đăng nhập hết hạn.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi cập nhật truyện.');
    }
  }
);

// 5. Xóa truyện (API cần token)
export const deleteNovel = createAsyncThunk(
  'novels/delete',
  async (idNovel, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`${protectedApiBaseNovel}/delete/${idNovel}`);
      if (response.data && response.data.code === 1000) {
        return idNovel;
      }
      return rejectWithValue(response.data?.message || `Không thể xóa truyện với ID ${idNovel}.`);
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Không có quyền truy cập hoặc phiên đăng nhập hết hạn.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || `Lỗi khi xóa truyện với ID ${idNovel}.`);
    }
  }
);

// API SEARCH NOVELS
export const searchNovels = createAsyncThunk(
  'novels/search',
  async ({ searchCriteria, paginationAndSortParams }, { rejectWithValue }) => {
    try {
      let queryString = '';
      if (paginationAndSortParams) {
        const params = new URLSearchParams();
        if (paginationAndSortParams.page !== undefined && paginationAndSortParams.page !== null) {
          params.append('page', paginationAndSortParams.page);
        }
        if (paginationAndSortParams.size !== undefined && paginationAndSortParams.size !== null) {
          params.append('size', paginationAndSortParams.size);
        }
        if (paginationAndSortParams.sort) {
          if (Array.isArray(paginationAndSortParams.sort)) {
            paginationAndSortParams.sort.forEach(sortParam => {
              if (sortParam) params.append('sort', sortParam);
            });
          } else {
            params.append('sort', paginationAndSortParams.sort);
          }
        }
        queryString = params.toString() ? `?${params.toString()}` : '';
      }


      const response = await apiClient.post(`${publicApiBaseNovel}/search${queryString}`, searchCriteria || {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && Array.isArray(response.data.content) && response.data.pageable) {
        console.log("Thunk searchNovels returning fulfilled with:", response.data);
        return response.data; // Trả về toàn bộ object response.data (chứa content, pageable, ...)
      } else {
        // Nếu response không có cấu trúc mong đợi (thiếu content hoặc pageable)
        console.error("API Search Response Issue (trong thunk): Dữ liệu trả về không đúng cấu trúc.", response.data);
        return rejectWithValue(response.data?.message || 'Dữ liệu tìm kiếm không hợp lệ.');
      }
    } catch (error) {
      console.error("Lỗi API khi tìm kiếm truyện (trong thunk catch):", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tìm kiếm truyện.');
    }
  }
);
// api follow
export const followNovel = createAsyncThunk('novels/followNovel', async (payload) => {
  const response = await axios.post(`${apiBase}/followNovel`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data.result; // Trả về kết quả từ API
});

export const fetchHotNovels = createAsyncThunk(
  'novels/fetchHot', // Đổi tên action type
  async ({ page, size, idUser }, { rejectWithValue }) => {
    try {
      // Payload cho API search
      const searchCriteria = {}; // Không có điều kiện tìm kiếm cụ thể
      const paginationAndSortParams = {
        page,
        size,
        // sort: ['rating,desc'] // Sắp xếp theo rating giảm dần
      };

      // Xây dựng query string
      const params = new URLSearchParams();
      params.append('page', paginationAndSortParams.page);
      params.append('size', paginationAndSortParams.size);
      //  params.append('sort', paginationAndSortParams.sort);
      if (idUser) {
        params.append('idUser', idUser); // Thêm idUser nếu có
      }
      const queryString = `?${params.toString()}`;

      // Gọi API search
      const response = await apiClient.post(`/novel/search${queryString}`, searchCriteria);
      
      if (response.data && Array.isArray(response.data.content)) {
        return response.data; // Trả về toàn bộ object phân trang { content, totalPages, number, ... }
      }
      return rejectWithValue('Dữ liệu trả về không hợp lệ.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải truyện hot.');
    }
  }
);
// --- API lấy ds tuyện yêu thích ---
export const LyberiNovels = createAsyncThunk(
  'novels/lyberi',
  async ({ idUser }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`${publicApiBaseNovel}/search`, { idUser }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Kiểm tra xem có trả về dữ liệu hợp lệ không
      if (response.data && Array.isArray(response.data.content)) {
        // Lọc các truyện có `isFollow: true`
        const followedNovels = response.data.content.filter(novel => novel.isFollow);
        if (followedNovels.length === 0) {
          return rejectWithValue('Bạn chưa theo dõi truyện nào.');
        }
        return followedNovels; // Trả về danh sách truyện yêu thích
      } else {
        console.error("Dữ liệu trả về không đúng cấu trúc.", response.data);
        return rejectWithValue('Dữ liệu trả về không hợp lệ.');
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách truyện yêu thích:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi lấy danh sách truyện yêu thích.');
    }
  }
);

// --- SLICE DEFINITION ---
const initialPaginationState = {
  pageNumber: 0,
  pageSize: 20,
  totalPages: 0,
  totalElements: 0,
  last: true,
  first: true,
  numberOfElements: 0,
  empty: true,
  sort: { sorted: false, unsorted: true, empty: true },
};

const initialState = {
  novels: [], // << State mới để lưu danh sách truyện gốc từ getAllNovels
  searchedNovels: [], 

  hotNovels: {
    list: [],
    totalPages: 0,
    currentPage: 0,
    loading: false,
    error: null
  },
  followedNovels: [], // Lưu các truyện mà người dùng đã theo dõi

  currentNovel: null,
  loadingAll: false, // Loading cho getAllNovels
  searchLoading: false, // Loading cho searchNovels
  getByIdLoading: false, // Loading cho getNovelById
  actionLoading: false, // Loading cho create, update, delete
  error: null,
  pagination: initialPaginationState, // Pagination này sẽ dành cho searchResults
};
const novelSlice = createSlice({
  name: 'novels',
  initialState,
  reducers: {
    clearCurrentNovel: (state) => {
      state.currentNovel = null;
      state.error = null;
    },
    setCurrentNovelFromList: (state, action) => {
      const novelIdToSet = action.payload;
      state.currentNovel = state.novels.find(novel => novel.idNovel === novelIdToSet) || null;
      state.error = null;
    },
    clearSearchedNovels: (state) => {
        state.novels = []; // Có thể bạn muốn giữ lại danh sách novels từ getAllNovels
                            // Hoặc tạo một state riêng cho kết quả tìm kiếm, ví dụ: state.searchedNovels
        state.pagination = initialPaginationState;
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- getAllNovels ---
      .addCase(getAllNovels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllNovels.fulfilled, (state, action) => {
        state.loading = false;
        state.novels = action.payload;
        // Khi getAllNovels được gọi, không cập nhật pagination của search
      })
      .addCase(getAllNovels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.novels = [];
      })

      // --- getNovelById ---
       .addCase(getNovelById.pending, (state) => {
        state.getByIdLoading = true;
        state.error = null;
    })
    .addCase(getNovelById.fulfilled, (state, action) => {
        state.getByIdLoading = false;
        state.currentNovel = action.payload;
    })
    .addCase(getNovelById.rejected, (state, action) => {
        state.getByIdLoading = false;
        state.error = action.payload;
        state.currentNovel = null;
    })

      // --- createNovel ---
      .addCase(createNovel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNovel.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.idNovel) {
          state.novels.unshift(action.payload);
        } else {
          console.warn("Create novel fulfilled nhưng payload không hợp lệ:", action.payload);
        }
      })
      .addCase(createNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- updateNovel ---
      .addCase(updateNovel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNovel.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.idNovel) {
          const updatedNovel = action.payload;
          const index = state.novels.findIndex((novel) => novel.idNovel === updatedNovel.idNovel);
          if (index !== -1) {
            state.novels[index] = updatedNovel;
          }
          if (state.currentNovel && state.currentNovel.idNovel === updatedNovel.idNovel) {
            state.currentNovel = updatedNovel;
          }
        } else {
          console.warn("Update novel fulfilled nhưng payload không hợp lệ:", action.payload);
        }
      })
      .addCase(updateNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- fetchHotNovels ---
     .addCase(fetchHotNovels.pending, (state) => {
        state.hotNovels.loading = true;
        state.hotNovels.error = null;
      })
      .addCase(fetchHotNovels.fulfilled, (state, action) => {
        state.hotNovels.loading = false;
        state.hotNovels.list = action.payload.content;
        state.hotNovels.totalPages = action.payload.totalPages;
        state.hotNovels.currentPage = action.payload.number;
      })
      .addCase(fetchHotNovels.rejected, (state, action) => {
        state.hotNovels.loading = false;
        state.hotNovels.error = action.payload;
        state.hotNovels.list = [];
      })
      // --- deleteNovel ---
      .addCase(deleteNovel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNovel.fulfilled, (state, action) => {
        state.loading = false;
        const deletedNovelId = action.payload;
        state.novels = state.novels.filter((novel) => novel.idNovel !== deletedNovelId);
        if (state.currentNovel && state.currentNovel.idNovel === deletedNovelId) {
          state.currentNovel = null;
        }
      })
      .addCase(deleteNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- searchNovels ---
      .addCase(searchNovels.pending, (state) => {
      state.searchLoading = true;
      state.error = null;
    })
    .addCase(searchNovels.fulfilled, (state, action) => {
      state.searchLoading = false;
      state.error = null;
      if (action.payload && Array.isArray(action.payload.content)) {
          state.searchedNovels = action.payload.content;
          state.pagination = {
            pageNumber: action.payload.number,
            pageSize: action.payload.size,
            totalPages: action.payload.totalPages,
            totalElements: action.payload.totalElements,
            last: action.payload.last,
            first: action.payload.first,
          };
        }
    })
    .addCase(searchNovels.rejected, (state, action) => {
      state.searchLoading = false;
      state.error = action.payload;
      state.searchedNovels = []; // Reset state mới
      state.pagination = initialPaginationState;
    })
     .addCase(followNovel.pending, (state) => {
        state.loading = true; // Đang chờ yêu cầu
      })
      .addCase(followNovel.fulfilled, (state, action) => {
        state.loading = false;
        // Thêm truyện đã theo dõi vào danh sách followedNovels
        if (action.payload) {
          state.followedNovels.push(action.payload);
        }
      })
      .addCase(followNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message; // Xử lý lỗi khi có vấn đề
      })
      .addCase(LyberiNovels.fulfilled, (state, action) => {
        // Lưu truyện yêu thích vào `followedNovels`
        state.followedNovels = action.payload;
      })
      .addCase(LyberiNovels.rejected, (state, action) => {
        state.error = action.payload;
        state.followedNovels = [];
      });
    
  }
});

export const { clearCurrentNovel, setCurrentNovelFromList, clearSearchedNovels } = novelSlice.actions;

export const selectAllFetchedNovels = (state) => state.novels.novels;
export const selectSearchedNovels = (state) => state.novels.searchedNovels; // Cho kết quả tìm kiếm
export const selectPaginationInfo = (state) => state.novels.pagination; // Đổi tên cho rõ ràng
export const selectAllNovelsLoading = (state) => state.novels.loadingAll;
export const selectSearchLoading = (state) => state.novels.searchLoading; // Đổi tên
export const selectNovelsError = (state) => state.novels.error; // <<<< ĐẢM BẢO SELECTOR NÀY TỒN TẠI VÀ ĐƯỢC EXPORT
export const selectSearchPagination = (state) => state.novels.pagination;


export default novelSlice.reducer;