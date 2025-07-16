import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios'; // Không dùng axios gốc nữa
import apiClient from '../services/api'; // BƯỚC 1: Import apiClient

const apiPath = "/novel";

export const getAllNovels = createAsyncThunk('novels/getAll', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`${apiPath}/getAll`);
    return response.data.result;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const getNovelById = createAsyncThunk('novels/getById', async (id, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`${apiPath}/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const createNovel = createAsyncThunk('novels/create', async (novelData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post(`${apiPath}/create`, novelData);
    return response.data.result;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateNovel = createAsyncThunk('novels/update', async (novelData, { rejectWithValue }) => {
  try {
   
    const response = await apiClient.put(`${apiPath}/update`, novelData);
    return response.data.result;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const deleteNovel = createAsyncThunk('novels/delete', async (id, { rejectWithValue }) => {
  try {
    const response = await apiClient.delete(`${apiPath}/${id}`);
   
    return id; 
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});
export const addAuthorToNovel = createAsyncThunk(
  'novels/addAuthor',
  async ({ idNovel, idAuthor }, { rejectWithValue }) => {
    try {
      const payload = { idNovel, idAuthor };
      const response = await apiClient.post(`${apiPath}/addAuthor`, payload);
      
      if (response.data && response.data.code !== 1000) {
        return rejectWithValue(response.data);
      }
      
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Lỗi không xác định.' });
    }
  }
);
// api link novel với category
/**
 * Thêm một thể loại vào danh sách thể loại của một truyện.
 * @param {object} payload - { idNovel: string, idCategory: string }
 */
export const addCategoryToNovel = createAsyncThunk(
  'novels/addCategory',
  async ({ idNovel, idCategory }, { rejectWithValue }) => {
    try {
      const payload = { idNovel, idCategory };
      const response = await apiClient.post(`${apiPath}/addCategory`, payload);
      
      if (response.data && response.data.code !== 1000) {
        return rejectWithValue(response.data);
      }
      
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Lỗi không xác định.' });
    }
  }
);


const novelSlice = createSlice({
  name: 'novels',
  initialState: {
    novels: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET ALL
      .addCase(getAllNovels.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAllNovels.fulfilled, (state, action) => {
        state.loading = false;
        state.novels = action.payload;
      })
      .addCase(getAllNovels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })
      // CREATE
      .addCase(createNovel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createNovel.fulfilled, (state, action) => {
        state.loading = false;
        state.novels.push(action.payload);
      })
      .addCase(createNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })
      // UPDATE
      .addCase(updateNovel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateNovel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.novels.findIndex((novel) => novel.idNovel === action.payload.idNovel);
        if (index !== -1) {
          state.novels[index] = action.payload;
        }
      })
      .addCase(updateNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })
      // DELETE
      .addCase(deleteNovel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteNovel.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload bây giờ là id đã xóa
        state.novels = state.novels.filter((novel) => novel.idNovel !== action.payload);
      })
      .addCase(deleteNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })
      .addMatcher(
        // Điều kiện: action phải là `fulfilled` của một trong hai thunk này
        (action) => [addAuthorToNovel.fulfilled.type, addCategoryToNovel.fulfilled.type].includes(action.type),
        // Hàm xử lý
        (state, action) => {
            // loading nên được set là false trong các trường hợp pending riêng
            state.loading = false; 
            state.error = null;
            
            // action.payload là object novel đã được cập nhật từ API
            const updatedNovel = action.payload;
            
            // Tìm index của novel cần cập nhật trong state.novels
            const index = state.novels.findIndex((novel) => novel.idNovel === updatedNovel.idNovel);
            
            // Nếu tìm thấy, thay thế novel cũ bằng novel mới
            if (index !== -1) {
                state.novels[index] = updatedNovel;
            }
        }
      )
      .addMatcher(
        (action) => [addAuthorToNovel.pending.type, addCategoryToNovel.pending.type].includes(action.type),
        (state) => {
            state.loading = true;
            state.error = null;
        }
      )
      .addMatcher(
        (action) => [addAuthorToNovel.rejected.type, addCategoryToNovel.rejected.type].includes(action.type),
        (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || "Thao tác thất bại.";
        }
      );
  }
});

export default novelSlice.reducer;