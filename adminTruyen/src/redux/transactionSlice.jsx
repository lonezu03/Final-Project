import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../services/api'; // BƯỚC 1: Import apiClient

// Create async thunk for fetching all transactions
export const getAllTransactions = createAsyncThunk(
  'transaction/getAllTransactions',
  async (statusDeposit, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/transaction/getAllTransaction', {
        params: { statusDeposit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  transactions: [],
  loading: false,
  error: null,
  success: false
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearTransactionState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getAllTransactions
      .addCase(getAllTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.result;
        state.success = true;
      })
      .addCase(getAllTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch transactions';
      });
  },
});

// Export actions
export const { clearTransactionState } = transactionSlice.actions;

// Export selectors
export const selectTransactions = (state) => state.transaction.transactions;
export const selectTransactionLoading = (state) => state.transaction.loading;
export const selectTransactionError = (state) => state.transaction.error;
export const selectTransactionSuccess = (state) => state.transaction.success;

// Export reducer
export default transactionSlice.reducer;