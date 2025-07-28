// src/redux/transactionSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// --- Async Thunks ---
export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (transactionData, { rejectWithValue }) => {
    try {
      console.log('Sending transaction data:', transactionData);
      const response = await apiClient.post('/transaction/createTransaction', transactionData);
      console.log('Transaction response:', response.data);
      
      if (response.data && response.data.code === 1000 && response.data.result === true) {
        // Trả về dữ liệu gốc để component có thể dùng cho bước confirm
        return { success: true, request: transactionData };
      }
      return rejectWithValue(response.data?.message || 'Không thể tạo giao dịch.');
    } catch (error) {
      console.error('Create transaction error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tạo giao dịch.');
    }
  }
);

export const confirmTransactions = createAsyncThunk(
  'transaction/confirm',
  async (confirmationData, { rejectWithValue }) => {
    try {
      console.log('Sending confirmation data:', confirmationData);
      const response = await apiClient.post('/transaction/confirmTransactions', confirmationData);
      console.log('Confirmation response:', response.data);
      
      if (response.data && response.data.code === 1000 && response.data.result === true) {
        // Trả về danh sách chương đã xác nhận để cập nhật state
        return { success: true, confirmedChapters: confirmationData.listIdChapter };
      }
      return rejectWithValue(response.data?.message || 'Không thể xác nhận giao dịch.');
    } catch (error) {
      console.error('Confirm transaction error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi xác nhận giao dịch.');
    }
  }
);
export const getTransactions = createAsyncThunk(
  'transaction/getTransactions',
  async ({ idUser, statusDeposit = 'SUCCESS' }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/transaction/getTransaction?idUser=${idUser}&statusDeposit=${statusDeposit}`);
      if (response.data && response.data.code === 1000) {
        // Transform the novelBought object into a flat array of chapter IDs
        const novelBought = response.data.result.novelBought || {};
        const purchasedChapters = Object.values(novelBought).reduce((acc, novel) => {
          if (novel.chapterBoughtRespone && Array.isArray(novel.chapterBoughtRespone)) {
            const chapterIds = novel.chapterBoughtRespone.map(chapter => chapter.idChapter);
            return [...acc, ...chapterIds];
          }
          return acc;
        }, []);

        return {
          user: response.data.result.user,
          purchasedChapters, // Flat array of chapter IDs
          novelBought, // Original novelBought object for additional data
        };
      }
      return rejectWithValue(response.data?.message || 'Không thể lấy danh sách giao dịch.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

export const getAllTransactions = createAsyncThunk(
  'transaction/getAllTransactions',
  async ({ statusDeposit = 'SUCCESS' }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/transaction/getAllTransaction?statusDeposit=${statusDeposit}`);
      if (response.data && response.data.code === 1000) {
        // Process all transactions to separate rented and purchased chapters
        const allTransactions = response.data.result || [];
        
        const rentedChapters = [];
        const purchasedChapters = [];
        const rentedNovels = {};
        const purchasedNovels = {};

        allTransactions.forEach(transaction => {
          const novelBought = transaction.novelBought || {};
          
          Object.values(novelBought).forEach(novel => {
            if (novel.chapterBoughtRespone && Array.isArray(novel.chapterBoughtRespone)) {
              novel.chapterBoughtRespone.forEach(chapter => {
                // Check if chapter has rental expiration date (dayRentAmount is array format)
                if (chapter.dayRentAmount && Array.isArray(chapter.dayRentAmount)) {
                  rentedChapters.push(chapter.idChapter);
                  
                  // Convert dayRentAmount array to Date object
                  const [year, month, day, hour, minute, second, nano] = chapter.dayRentAmount;
                  const expirationDate = new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
                  
                  if (!rentedNovels[novel.idNovel]) {
                    rentedNovels[novel.idNovel] = {
                      ...novel,
                      chapterBoughtRespone: []
                    };
                  }
                  rentedNovels[novel.idNovel].chapterBoughtRespone.push({
                    ...chapter,
                    rentExpiration: expirationDate.toISOString() // Convert to ISO string for consistency
                  });
                } else {
                  purchasedChapters.push(chapter.idChapter);
                  
                  if (!purchasedNovels[novel.idNovel]) {
                    purchasedNovels[novel.idNovel] = {
                      ...novel,
                      chapterBoughtRespone: []
                    };
                  }
                  purchasedNovels[novel.idNovel].chapterBoughtRespone.push(chapter);
                }
              });
            }
          });
        });

        return {
          rentedChapters,
          purchasedChapters,
          rentedNovels,
          purchasedNovels,
          allTransactions
        };
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
  transactions: {
    user: null,
    purchasedChapters: [], // Store chapter IDs
    novelBought: {}, // Store full novelBought data
  },
  allTransactions: {
    rentedChapters: [], // Store rented chapter IDs
    purchasedChapters: [], // Store purchased chapter IDs
    rentedNovels: {}, // Store rented novels with expiration data
    purchasedNovels: {}, // Store purchased novels
    allTransactions: [] // Raw transaction data
  },
  transactionLoading: false, // Separate loading for transactions
  allTransactionLoading: false, // Loading for getAllTransactions
  error: null,
  transactionError: null,
  allTransactionError: null,
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
        state.transactions = {
          user: action.payload.user,
          purchasedChapters: action.payload.purchasedChapters,
          novelBought: action.payload.novelBought,
        };
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError = action.payload;
      })
      .addCase(getAllTransactions.pending, (state) => {
        state.allTransactionLoading = true;
        state.allTransactionError = null;
      })
      .addCase(getAllTransactions.fulfilled, (state, action) => {
        state.allTransactionLoading = false;
        state.allTransactions = {
          rentedChapters: action.payload.rentedChapters,
          purchasedChapters: action.payload.purchasedChapters,
          rentedNovels: action.payload.rentedNovels,
          purchasedNovels: action.payload.purchasedNovels,
          allTransactions: action.payload.allTransactions,
        };
      })
      .addCase(getAllTransactions.rejected, (state, action) => {
        state.allTransactionLoading = false;
        state.allTransactionError = action.payload;
      });
  },
});

export const { resetTransactionState } = transactionSlice.actions;
export default transactionSlice.reducer;