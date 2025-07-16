import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api'; // Sử dụng apiClient đã cấu hình

const apiPath = "/statistic";


/**
 * Lấy danh sách thống kê truyện dựa trên các tiêu chí.
 * API: GET /statistic/novel
 * @param {object} params - { top: number, sortBy: string, direction: string }
 */
export const getNovelStatistics = createAsyncThunk(
  'statistic/getNovelStats',
  async (params, { rejectWithValue }) => {
    try {
      // Ví dụ params: { top: 10, sortBy: 'TOTAL_VIEW', direction: 'DESC' }
      // axios sẽ tự động chuyển object này thành query string: ?top=10&sortBy=TOTAL_VIEW&direction=DESC
      const response = await apiClient.get(`${apiPath}/novel`, { params });
      
      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể tải dữ liệu thống kê truyện.');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi khi tải thống kê truyện.';
      console.error("Lỗi getNovelStatistics:", error.response || error);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Lấy dữ liệu thống kê doanh thu theo loại thời gian.
 * API: GET /statistic/amount
 * @param {string} type - 'DAY', 'MONTH', 'QUARTER', 'YEAR'
 */
export const getAmountStatistics = createAsyncThunk(
  'statistic/getAmountStats',
  async (type, { rejectWithValue }) => {
    try {
      // Ví dụ type: 'MONTH'
      // Gửi type như một query param: ?type=MONTH
      const response = await apiClient.get(`${apiPath}/amount`, { params: { type } });
      
      if (response.data && response.data.code === 1000) {
        // API trả về một object, ví dụ: { "Tháng 1": 1000, "Tháng 2": 2000 }
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể tải dữ liệu thống kê doanh thu.');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi khi tải thống kê doanh thu.';
      console.error("Lỗi getAmountStatistics:", error.response || error);
      return rejectWithValue(errorMsg);
    }
  }
);

// ====================================================================
// SLICE DEFINITION (Định nghĩa Slice)
// ====================================================================

const initialState = {
  novelStats: [],         // Lưu danh sách thống kê truyện
  amountStats: {},        // Lưu dữ liệu thống kê doanh thu
  loadingNovelStats: false,
  loadingAmountStats: false,
  error: null,
};

const statisticSlice = createSlice({
  name: 'statistic',
  initialState,
  reducers: {
    // Action để xóa dữ liệu cũ khi cần
    clearStatistics: (state) => {
      state.novelStats = [];
      state.amountStats = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý cho getNovelStatistics
      .addCase(getNovelStatistics.pending, (state) => {
        state.loadingNovelStats = true;
        state.error = null;
      })
      .addCase(getNovelStatistics.fulfilled, (state, action) => {
        state.loadingNovelStats = false;
        state.novelStats = action.payload; // Gán dữ liệu trả về
      })
      .addCase(getNovelStatistics.rejected, (state, action) => {
        state.loadingNovelStats = false;
        state.error = action.payload;
        state.novelStats = []; // Reset về mảng rỗng khi có lỗi
      })

      // Xử lý cho getAmountStatistics
      .addCase(getAmountStatistics.pending, (state) => {
        state.loadingAmountStats = true;
        state.error = null;
      })
      .addCase(getAmountStatistics.fulfilled, (state, action) => {
        state.loadingAmountStats = false;
        state.amountStats = action.payload; // Gán dữ liệu trả về
      })
      .addCase(getAmountStatistics.rejected, (state, action) => {
        state.loadingAmountStats = false;
        state.error = action.payload;
        state.amountStats = {}; // Reset về object rỗng khi có lỗi
      });
  },
});

export const { clearStatistics } = statisticSlice.actions;

export default statisticSlice.reducer;