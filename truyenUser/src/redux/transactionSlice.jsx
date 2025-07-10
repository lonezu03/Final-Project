// src/redux/transactionSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// --- Async Thunks ---
export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/transaction/createTransaction', transactionData);
      if (response.data && response.data.code === 1000 && response.data.result === true) {
        // Trả về dữ liệu gốc để component có thể dùng cho bước confirm
        return { success: true, request: transactionData };
      }
      return rejectWithValue(response.data?.message || 'Không thể tạo giao dịch.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo giao dịch.');
    }
  }
);

export const confirmTransactions = createAsyncThunk(
  'transaction/confirm',
  async (confirmationData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/transaction/confirmTransactions', confirmationData);
      if (response.data && response.data.code === 1000 && response.data.result === true) {
        // Trả về danh sách chương đã xác nhận để cập nhật state
        return { success: true, confirmedChapters: confirmationData.listIdChapter };
      }
      return rejectWithValue(response.data?.message || 'Không thể xác nhận giao dịch.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi xác nhận giao dịch.');
    }
  }
);

// --- Slice Definition ---
const initialState = {
  createStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: null,
  confirmStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  confirmError: null,
  pendingTransaction: null, // Lưu giao dịch đang chờ xác nhận
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    resetTransactionState: (state) => {
      Object.assign(state, initialState); // Reset tất cả về ban đầu
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Cases for createTransaction ---
      .addCase(createTransaction.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.pendingTransaction = action.payload.request;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload;
      })
      // --- Cases for confirmTransactions ---
      .addCase(confirmTransactions.pending, (state) => {
        state.confirmStatus = 'loading';
        state.confirmError = null;
      })
      .addCase(confirmTransactions.fulfilled, (state, action) => {
        state.confirmStatus = 'succeeded';
        state.pendingTransaction = null; // Xóa giao dịch đang chờ
      })
      .addCase(confirmTransactions.rejected, (state, action) => {
        state.confirmStatus = 'failed';
        state.confirmError = action.payload;
      });
  },
});

export const { resetTransactionState } = transactionSlice.actions;
export default transactionSlice.reducer;