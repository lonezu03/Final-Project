import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../services/api';
import { rooturl } from './element';
const userApiBase = rooturl + '/user'; 

// ====================================================================
// ASYNC THUNKS (Hành động gọi API)
// ====================================================================

/**
 * Đăng nhập bằng Email và Mật khẩu.
 */
export const loginUserWithPassword = createAsyncThunk(
  'user/loginUserWithPassword',
  async (loginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${userApiBase}/login`, loginCredentials);
      if (response.data && response.data.code === 1000 && response.data.result?.token) {
        return response.data.result; // Trả về { user: {...}, token: "..." }
      }
      return rejectWithValue(response.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

/**
 * Làm mới phiên đăng nhập khi tải lại trang.
 * Sẽ được gọi khi ứng dụng khởi động nếu có token trong localStorage.
 */
export const refreshUserSession = createAsyncThunk(
  'user/refreshSession',
  async (_, { getState, rejectWithValue }) => {
    const { token } = getState().user; // Lấy token từ Redux state
    if (!token) {
      return rejectWithValue('Không có token để làm mới phiên.');
    }

    try {
      // Giả sử API của bạn là POST /user/refreshUser và nhận token dạng text
      const response = await apiClient.post('/user/refreshUser', token, {
        headers: { 'Content-Type': 'text/plain' },
      });

      if (response.data && response.data.code === 1000 && response.data.result) {
        // Backend trả về object user mới và có thể là cả token mới
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể làm mới phiên.');
    } catch (error) {
      console.error("Lỗi làm mới phiên:", error.response?.data || error.message);
      return rejectWithValue('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
    }
  }
);


// ====================================================================
// SLICE DEFINITION (Định nghĩa Slice)
// ====================================================================

const initialState = {
  currentUser: null,
  token: localStorage.getItem('authToken') || null,
  loading: false, // Loading chung cho login, register,...
  isRefreshing: !!localStorage.getItem('authToken'), // Loading riêng cho việc refresh phiên
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.isRefreshing = false;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    },
     setUserFromStorage: (state, action) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
    
  },
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ---- Xử lý cho ĐĂNG NHẬP ----
    builder
      .addCase(loginUserWithPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserWithPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.isRefreshing = false; // Đăng nhập thành công, phiên đã hợp lệ
        
        // Payload là { user: {...}, token: "..." }
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        
        // Lưu vào localStorage
        localStorage.setItem('currentUser', JSON.stringify(action.payload.user));
        localStorage.setItem('authToken', action.payload.token);
      })
      .addCase(loginUserWithPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Gán lỗi để hiển thị trên UI
      });

    // ---- Xử lý cho LÀM MỚI PHIÊN ----
    builder
      .addCase(refreshUserSession.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshUserSession.fulfilled, (state, action) => {
        state.isRefreshing = false;
        
        const userData = action.payload.user || action.payload;
        const newToken = action.payload.token;

        state.currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));

        if (newToken) {
            state.token = newToken;
            localStorage.setItem('authToken', newToken);
        }
      })
      // .addCase(refreshUserSession.rejected, (state, action) => {
      //   state.isRefreshing = false;
      //   // Khi refresh thất bại, xóa thông tin đăng nhập cũ
      //   state.currentUser = null;
      //   state.token = null;
      //   localStorage.removeItem('currentUser');
      //   localStorage.removeItem('authToken');
      //   console.error('Refresh session rejected:', action.payload);
      // });
  }
});

// Export các actions và reducer
export const { logoutUser, clearUserError,setUserFromStorage } = userSlice.actions;
export default userSlice.reducer;