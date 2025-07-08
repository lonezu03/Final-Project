// src/redux/paymentSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api'; // Sử dụng apiClient đã cấu hình

// --- Async Thunks ---

/**
 * Action để tạo một giao dịch thanh toán mới.
 * Sẽ gọi API /api/payment/create và nhận về URL để chuyển hướng người dùng.
 */
export const createPaymentTransaction = createAsyncThunk(
  'payment/createTransaction',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/payment/create', paymentData);

      // SỬA LẠI ĐIỀU KIỆN KIỂM TRA CHO ĐÚNG VỚI CẤU TRÚC RESPONSE
      if (response.data && response.data.zaloPayResponse?.response_data?.order_url) {
        console.log("API call successful, returning data:", response.data);
        return response.data; // Trả về toàn bộ object khi thành công
      }
      
      // Nếu không có order_url, reject với message từ API
      const errorMessage = response.data?.zaloPayResponse?.response_data?.return_message || 'Không thể tạo yêu cầu thanh toán từ API.';
      console.error("API call failed logic check:", errorMessage);
      return rejectWithValue(errorMessage);
    } catch (error) {
      console.error("API call catched an error:", error.response?.data || error);
      return rejectWithValue(error.response?.data?.message || 'Lỗi mạng hoặc server khi tạo giao dịch.');
    }
  }
);
/**
 * Action để xác thực giao dịch sau khi người dùng được chuyển hướng về từ cổng thanh toán.
 * Sẽ gọi API /api/payment/callback-success.
 */
export const verifyPaymentCallback = createAsyncThunk(
  'payment/verifyCallback',
  async ({ idHistoryDeposit }, { rejectWithValue }) => {
    try {
      // Gọi API với query parameter
      const response = await apiClient.get(`/api/payment/callback-success?idHistoryDeposit=${idHistoryDeposit}`);

      // Giả sử API trả về một object chứa thông tin giao dịch nếu thành công
      // Ví dụ: { code: 200, message: "Thành công", result: { amount: 50000, ... } }
      if (response.data) { // Cần làm rõ cấu trúc response thành công
        return { success: true, data: response.data };
      }
      
      // Nếu không, coi như thất bại
      return rejectWithValue('Xác thực giao dịch không thành công.');
    } catch (error) {
      // Thường thì callback thất bại sẽ đi vào đây
      return rejectWithValue(error.response?.data?.message || 'Giao dịch không hợp lệ hoặc đã hết hạn.');
    }
  }
);


// --- Slice Definition ---

const initialState = {
  // Trạng thái cho việc tạo giao dịch
  creationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  creationError: null,
  paymentUrl: null, // URL để chuyển hướng người dùng đến cổng thanh toán
  historyDepositId: null, // ID để theo dõi giao dịch

  // Trạng thái cho việc xác thực callback
  verificationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  verificationError: null,
  verifiedTransaction: null, // Lưu thông tin giao dịch đã được xác thực
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Reducer để reset trạng thái sau khi đã xử lý xong
    resetPaymentState: (state) => {
      state.creationStatus = 'idle';
      state.creationError = null;
      state.paymentUrl = null;
      state.historyDepositId = null;
    },
    resetVerificationState: (state) => {
      state.verificationStatus = 'idle';
      state.verificationError = null;
      state.verifiedTransaction = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Cases for createPaymentTransaction ---
      .addCase(createPaymentTransaction.pending, (state) => {
        state.creationStatus = 'loading';
        state.creationError = null;
        state.paymentUrl = null;
      })
     .addCase(createPaymentTransaction.fulfilled, (state, action) => {
  state.creationStatus = 'succeeded';
  state.paymentUrl = action.payload.zaloPayResponse.response_data.order_url; // Đảm bảo lấy đúng order_url
  state.historyDepositId = action.payload.historyDepositId;
})
      .addCase(createPaymentTransaction.rejected, (state, action) => {
        state.creationStatus = 'failed';
        state.creationError = action.payload;
      })

      // --- Cases for verifyPaymentCallback ---
      .addCase(verifyPaymentCallback.pending, (state) => {
        state.verificationStatus = 'loading';
        state.verificationError = null;
      })
      .addCase(verifyPaymentCallback.fulfilled, (state, action) => {
        state.verificationStatus = 'succeeded';
        state.verifiedTransaction = action.payload.data; // Lưu lại kết quả xác thực
      })
      .addCase(verifyPaymentCallback.rejected, (state, action) => {
        state.verificationStatus = 'failed';
        state.verificationError = action.payload;
      });
  },
});

export const { resetPaymentState, resetVerificationState } = paymentSlice.actions;

export default paymentSlice.reducer;