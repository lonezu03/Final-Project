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
export const getTransactions = createAsyncThunk(
  'transaction/getTransactions',
  async (idUser, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/transaction/getTransaction?idUser=${idUser}`);
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể lấy danh sách giao dịch.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
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
  transactions: [],
  transactionLoading: false, // Separate loading for transactions
  error: null,
  transactionError: null,
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
      })
       .addCase(getTransactions.pending, (state) => {
        state.transactionLoading = true;
        state.transactionError = null;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.transactionLoading = false;
        state.transactions = action.payload;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError = action.payload;
      });
  },
});

export const { resetTransactionState } = transactionSlice.actions;
export default transactionSlice.reducer;