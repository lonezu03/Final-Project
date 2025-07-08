// src/redux/transactionSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api'; // Sử dụng apiClient đã cấu hình, giả sử nó đã có token

// --- Async Thunks ---

/**
 * Action để tạo một giao dịch mới (mua/thuê chương).
 * Sẽ gọi API POST /transaction/createTransaction.
 */
export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (transactionData, { rejectWithValue }) => {
    // transactionData: { idUser, idChapters, dateEndRent, amountCoin, typeTransaction }
    try {
      const response = await apiClient.post('/transaction/createTransaction', transactionData);
      
      // Giả sử response thành công có code là 200 và result là true
      if (response.data && response.data.code === 200 && response.data.result === true) {
        // Trả về dữ liệu gốc đã gửi đi để có thể sử dụng nếu cần
        return { success: true, request: transactionData, message: response.data.message };
      }
      
      // Nếu không, reject với message từ API
      return rejectWithValue(response.data?.message || 'Không thể tạo giao dịch.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo giao dịch.');
    }
  }
);

/**
 * Action để xác nhận lại các giao dịch.
 * Sẽ gọi API POST /transaction/confirmTransactions.
 */
export const confirmTransactions = createAsyncThunk(
  'transaction/confirm',
  async (confirmationData, { rejectWithValue }) => {
    // confirmationData: { idUser, listIdChapter }
    try {
      const response = await apiClient.post('/transaction/confirmTransactions', confirmationData);
      
      if (response.data && response.data.code === 200 && response.data.result === true) {
        return { success: true, message: response.data.message };
      }
      
      return rejectWithValue(response.data?.message || 'Không thể xác nhận giao dịch.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi xác nhận giao dịch.');
    }
  }
);


// --- Slice Definition ---

const initialState = {
  // Trạng thái cho việc tạo giao dịch
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastTransaction: null, // Lưu thông tin của giao dịch cuối cùng
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    // Reducer để reset trạng thái
    resetTransactionState: (state) => {
      state.status = 'idle';
      state.error = null;
      state.lastTransaction = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Cases for createTransaction ---
      .addCase(createTransaction.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Lưu lại thông tin về giao dịch vừa thành công
        state.lastTransaction = action.payload; 
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // payload là message lỗi từ rejectWithValue
      })

      // --- Cases for confirmTransactions ---
      .addCase(confirmTransactions.pending, (state) => {
        state.status = 'loading'; // Có thể dùng chung cờ loading
        state.error = null;
      })
      .addCase(confirmTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Có thể không cần lưu gì đặc biệt sau khi confirm, chỉ cần biết là thành công
      })
      .addCase(confirmTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { resetTransactionState } = transactionSlice.actions;

export default transactionSlice.reducer;