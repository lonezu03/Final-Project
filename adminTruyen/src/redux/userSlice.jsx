import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../services/api';
import { rooturl } from './element';
const userApiBase = rooturl + '/user'; 

// ====================================================================
// ASYNC THUNKS (Hành động gọi API)
// ====================================================================

/**
 * Lấy lịch sử nạp tiền của tất cả user
 */
export const getAllHistoryDeposit = createAsyncThunk(
  'user/getAllHistoryDeposit',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/user/getAllHistoryDeposit');
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

/**
 * Lấy tất cả báo cáo từ người dùng
 */
export const getAllReport = createAsyncThunk(
  'user/getAllReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/user/getAllReport');
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể lấy danh sách báo cáo.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

/**
 * Cập nhật báo cáo
 */
export const updateReport = createAsyncThunk(
  'user/updateReport',
  async ({ id, content, statusReport, statusProcessingStatus }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/user/updateReport', {
        id,
        content,
        statusReport,
        statusProcessingStatus
      });
      
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể cập nhật báo cáo.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

/**
 * Xóa báo cáo (soft delete)
 */
export const deleteReport = createAsyncThunk(
  'user/deleteReport',
  async (idReport, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/user/deleteReport/${idReport}`);
      
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể xóa báo cáo.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

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

export const getalluser = createAsyncThunk(
  'user/getalluser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/user/getAllUser');
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

/**
 * Cấp quyền manager cho user
 */
export const grantManagerRole = createAsyncThunk(
  'user/grantManagerRole',
  async (idUser, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/user/grantRole/${idUser}`);
      
      if (response.data && response.data.code === 1000 && response.data.result) {
        return {
          updatedUser: response.data.result,
          idUser: idUser
        };
      }
      return rejectWithValue(response.data?.message || 'Không thể cấp quyền manager.');
    } catch (error) {
      if (error.response?.status === 404) {
        return rejectWithValue('Không tìm thấy người dùng với ID này.');
      }
      return rejectWithValue(error.response?.data?.message || 'Lỗi kết nối đến máy chủ.');
    }
  }
);

// ====================================================================
// SLICE DEFINITION (Định nghĩa Slice)
// ====================================================================

const initialState = {
  currentUser: (() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('authToken') || null,
  loading: false, // Loading chung cho login, register,...
  isRefreshing: !!localStorage.getItem('authToken'), // Loading riêng cho việc refresh phiên
  error: null,
  allUsers: [], // Danh sách tất cả người dùng
  allHistoryDeposit: [], // Danh sách lịch sử nạp tiền
  allReports: [], // Danh sách tất cả báo cáo
  reportsLoading: false, // Loading riêng cho việc lấy báo cáo
  reportUpdateLoading: false, // Loading riêng cho việc cập nhật báo cáo
  reportDeleteLoading: false, // Loading riêng cho việc xóa báo cáo
  grantRoleLoading: false, // Loading riêng cho việc cấp quyền
  grantRoleError: null,
  grantRoleSuccess: null,
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
    clearGrantRoleStatus: (state) => {
      state.grantRoleError = null;
      state.grantRoleSuccess = null;
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
      .addCase(refreshUserSession.rejected, (state, action) => {
        state.isRefreshing = false;
        state.currentUser = null;
        state.token = null;
        state.error = action.payload;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
      })
      // ---- Xử lý cho LẤY TẤT CẢ USER ----
      .addCase(getalluser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getalluser.fulfilled, (state, action) => { 
        state.loading = false;
        state.allUsers = action.payload; // Lưu danh sách người dùng vào state
      })
      .addCase(getalluser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Gán lỗi để hiển thị trên UI
      })
      // ---- Xử lý cho LẤY LỊCH SỬ NẠP TIỀN ----
      .addCase(getAllHistoryDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllHistoryDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.allHistoryDeposit = action.payload; // Lưu lịch sử nạp tiền vào state
      })
      .addCase(getAllHistoryDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Gán lỗi để hiển thị trên UI
      })
      // ---- Xử lý cho LẤY TẤT CẢ BÁO CÁO ----
      .addCase(getAllReport.pending, (state) => {
        state.reportsLoading = true;
        state.error = null;
      })
      .addCase(getAllReport.fulfilled, (state, action) => {
        state.reportsLoading = false;
        state.allReports = action.payload; // Lưu danh sách báo cáo vào state
      })
      .addCase(getAllReport.rejected, (state, action) => {
        state.reportsLoading = false;
        state.error = action.payload; // Gán lỗi để hiển thị trên UI
      })
      // ---- Xử lý cho CẬP NHẬT BÁO CÁO ----
      .addCase(updateReport.pending, (state) => {
        state.reportUpdateLoading = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.reportUpdateLoading = false;
        // Cập nhật báo cáo trong danh sách
        const updatedReport = action.payload;
        const reportIndex = state.allReports.findIndex(report => report.id === updatedReport.id);
        if (reportIndex !== -1) {
          state.allReports[reportIndex] = updatedReport;
        }
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.reportUpdateLoading = false;
        state.error = action.payload;
      })
      // ---- Xử lý cho XÓA BÁO CÁO ----
      .addCase(deleteReport.pending, (state) => {
        state.reportDeleteLoading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.reportDeleteLoading = false;
        // Xóa báo cáo khỏi danh sách (hoặc đánh dấu đã xóa)
        const deletedReport = action.payload;
        const reportIndex = state.allReports.findIndex(report => report.id === deletedReport.id);
        if (reportIndex !== -1) {
          // Có thể xóa hoàn toàn khỏi danh sách hoặc cập nhật deleteAt
          state.allReports.splice(reportIndex, 1); // Xóa khỏi danh sách để UI không hiển thị
        }
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.reportDeleteLoading = false;
        state.error = action.payload;
      })
      // ---- Xử lý cho CẤP QUYỀN MANAGER ----
      .addCase(grantManagerRole.pending, (state) => {
        state.grantRoleLoading = true;
        state.grantRoleError = null;
        state.grantRoleSuccess = null;
      })
      .addCase(grantManagerRole.fulfilled, (state, action) => {
        state.grantRoleLoading = false;
        state.grantRoleSuccess = 'Cấp quyền manager thành công!';
        const { updatedUser, idUser } = action.payload;
        // Cập nhật user trong danh sách allUsers
        const userIndex = state.allUsers.findIndex(user => user.idUser === idUser);
        if (userIndex !== -1) {
          state.allUsers[userIndex] = updatedUser;
        }
        // Nếu user được cấp quyền là current user, cập nhật thông tin và token
        if (state.currentUser && state.currentUser.idUser === idUser) {
          state.currentUser = updatedUser;
          if (updatedUser.token) {
            state.token = updatedUser.token;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            localStorage.setItem('authToken', updatedUser.token);
          }
        }
      })
      .addCase(grantManagerRole.rejected, (state, action) => {
        state.grantRoleLoading = false;
        state.grantRoleError = action.payload;
      });
  }
});

// Export các actions và reducer
export const { logoutUser, clearUserError, setUserFromStorage, clearGrantRoleStatus } = userSlice.actions;
export default userSlice.reducer;