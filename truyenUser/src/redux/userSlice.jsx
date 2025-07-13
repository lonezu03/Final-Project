// src/redux/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; // axios gốc vẫn được dùng cho các API không cần auth (như login, register)
import apiClient from '../services/api'; // Import apiClient đã cấu hình
import { rooturl } from './element'; // Import đường dẫn gốc từ file element
import { LyberiNovels } from './novelSlice'; // <<-- THÊM IMPORT NÀY Ở ĐẦU FILE
import { confirmTransactions } from './transactionSlice'; 

const userApiBase = `${rooturl}/user`; // Chỉ dùng cho các API không cần auth

// --- API DEFINITIONS ---

// 1. API ĐĂNG KÝ USER MỚI
export const registerUser = createAsyncThunk(
  'user/registerUser',
  async (registrationPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${userApiBase}/createUser`, registrationPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      } else if (response.data && response.data.code === 9999) {
        return rejectWithValue(response.data.message || "Unknown error from backend (9999)");
      } else {
        return rejectWithValue(response.data?.message || 'User registration failed: Invalid response.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 2. API ĐĂNG NHẬP THƯỜNG (EMAIL & PASSWORD)
export const loginUserWithPassword = createAsyncThunk(
  'user/loginUserWithPassword',
  async (loginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${userApiBase}/login`, loginCredentials, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Giả sử backend trả về: { code: 1000, message: "...", result: { user: {...}, token: "..." } }
      if (response.data && response.data.code === 1000 && response.data.result && response.data.result.token) {
        return response.data.result; // Trả về object chứa user info và token
      } else {
        return rejectWithValue(response.data?.message || 'Login failed: Invalid response or missing token.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Login API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 3. API ĐĂNG NHẬP CHỈ BẰNG EMAIL
export const loginUserByEmailOnly = createAsyncThunk(
  'user/loginByEmailOnly',
  async (emailPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${userApiBase}/loginByEmail`, emailPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data && response.data.code === 1000 && response.data.result && response.data.result.token) {
        return response.data.result;
      } else {
        return rejectWithValue(response.data?.message || 'Login (by email only) failed: Invalid response or missing token.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Login (by email only) API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 4. API CREATE USER BY EMAIL (GOOGLE LOGIN/SYNC)
export const createUserByEmailOnly = createAsyncThunk(
  'user/createUserByEmailOnly',
  async (emailPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${userApiBase}/createUserByEmail`, emailPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Giả sử API này cũng trả về token nếu user được tạo mới và tự động login
      if (response.data && response.data.code === 1000 && response.data.result && response.data.result.token) {
        return response.data.result;
      } else if (response.data && response.data.code === 1000 && response.data.result) {
        // Trường hợp chỉ trả về user info, không có token (ví dụ: user đã tồn tại)
        return { ...response.data.result, token: null }; // Trả về token là null để không ghi đè token hiện có nếu có
      } else {
        return rejectWithValue(response.data?.message || 'Create user (by email only) failed: Invalid response.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Create user (by email only) API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 5. API Send OTP - Sử dụng apiClient nếu cần xác thực (ví dụ: đổi mật khẩu)
export const sendOTP = createAsyncThunk(
  'user/sendOTP',
  async (emailData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('email', emailData.email);
      // Nếu sendOTP không cần token, dùng axios.post(`${userApiBase}/sendOTP`, formData);
      const response = await apiClient.post(`/user/sendOTP`, formData); // Đường dẫn tương đối với baseURL của apiClient
      if (response.data && response.data.code === 1000 && response.data.result) {
        return {
          otpSent: true,
          receivedOtp: response.data.result,
          message: response.data.message || "OTP sent successfully"
        };
      } else {
        return rejectWithValue(response.data?.message || 'Send OTP failed: Invalid response.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Send OTP API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 6. API Upload Avatar - Sử dụng apiClient
export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async ({ email, imageFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await apiClient.post(`/user/uploadAvatar?email=${encodeURIComponent(email)}`, formData);
      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result; // Backend nên trả về object user đã cập nhật
      } else {
        return rejectWithValue(response.data?.message || 'Upload avatar failed: Invalid response.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Upload avatar API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 7. API CREATE HISTORY - Sử dụng apiClient
export const createHistory = createAsyncThunk(
  'user/createHistory',
  // Payload giờ sẽ là một object chứa các thông tin cần thiết
  async ({  email, idChapter, readPlace }, { rejectWithValue }) => {
    try {
      // Tạo payload JSON như trong Postman
      const payload = {
        email,
        idChapter,
        readPlace, // Vị trí đọc
      };
      console.log("Attempting to create/update history with payload:", JSON.stringify(payload, null, 2)); // Log payload

      // Sử dụng apiClient để tự động gửi token
      // Endpoint là /user/createHistory và method là POST
      const response = await apiClient.post(`/user/createHistory`, payload, {
        headers: {
          'Content-Type': 'application/json', // Đảm bảo header này được đặt nếu backend yêu cầu
        }
      });

      // Kiểm tra response từ backend
      if (response.data && (response.data.code === 1000 || response.data.code === "1000")) {
        // Backend có thể trả về thông tin lịch sử đã được tạo/cập nhật
        // hoặc chỉ một thông báo thành công.
        // Nếu response.data.result chứa dữ liệu lịch sử, bạn có thể muốn trả về nó.
        // Ở đây, chúng ta trả về response.data để có thể lấy message.
        console.log("Create/update history successful:", response.data);
        return response.data; // Hoặc response.data.result nếu bạn chỉ muốn phần result
      } else {
        console.error("Create/update history failed with backend response:", response.data);
        return rejectWithValue(response.data?.message || 'Create/update history failed: Invalid response from server.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Create/update history API error.';
      console.error("Create/update history API error:", errorMsg, error.response || error);
      return rejectWithValue(errorMsg);
    }
  }
);

// 8. API DELETE HISTORY - Sử dụng apiClient
export const deleteHistory = createAsyncThunk(
  'user/deleteHistory',
  async (historyData, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/user/deleteHistory`, { data: historyData });
      if (response.data && (response.data.code === "1000" || response.data.code === 1000)) {
        return response.data;
      } else {
        return rejectWithValue(response.data?.message || 'Delete history failed: Invalid response.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Delete history API error.';
      return rejectWithValue(errorMsg);
    }
  }
);

// 9. API GET ALL HISTORY BY USER - Sử dụng apiClient
export const getAllHistoryByUser = createAsyncThunk(
  'user/getAllHistoryByUser',
  async (idUser, { rejectWithValue }) => { // Đổi thành idUser nếu API dùng idUser
    try {
      const response = await apiClient.get(`/user/getHistory?idUser=${encodeURIComponent(idUser)}`);
      if (response.data && (response.data.code === 1000 || response.data.code === "1000") && Array.isArray(response.data.result)) {
        return response.data.result;
      } else if (response.data && (response.data.code === 1000 || response.data.code === "1000") && response.data.result === null) {
        return [];
      } else {
        return rejectWithValue(response.data?.message || 'Failed to fetch history: Invalid response.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Get all history API error.';
      return rejectWithValue(errorMsg);
    }
  }
);
//10

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ userNameUser, dobUser }, { getState, rejectWithValue }) => {
    try {
      const { currentUser } = getState().user;
      if (!currentUser) {
        return rejectWithValue('Người dùng chưa đăng nhập.');
      }

      
      let formattedDob = null;
      if (dobUser && dobUser.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Nếu dobUser là một chuỗi hợp lệ dạng 'YYYY-MM-DD'
        // Tạo một đối tượng Date và chuyển nó sang chuỗi ISO 8601.
        // new Date('2003-11-05') sẽ hiểu là ngày 5/11/2003 lúc 00:00:00 giờ địa phương.
        // toISOString() sẽ chuyển nó về giờ UTC.
        formattedDob = new Date(dobUser).toISOString();
      }

      const payload = {
        idUser: currentUser?.idUser, // Giữ nguyên idUser từ currentUser
        userNameUser: userNameUser,
        // Sử dụng ngày tháng đã được định dạng lại
        dobUser: formattedDob,
      };

      // Xóa các trường không cần thiết
      delete payload.token; 
      delete payload.historyRead;
      delete payload.commentRespones;

      console.log("Sending final payload to backend:", payload);

      const response = await apiClient.put('/user/updateUser', payload);

      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data.message || 'Cập nhật thông tin thất bại.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật thông tin.');
    }
  }
);


export const changeUserPassword = createAsyncThunk(
  'user/changePassword',
  async ({ newPassword }, { getState, rejectWithValue }) => {
    try {
      // Lấy state hiện tại của user để xây dựng payload
      const { currentUser } = getState().user;
       if (!currentUser) {
        return rejectWithValue('Người dùng chưa đăng nhập.');
      }

      const payload = {
        ...currentUser, // Bắt đầu với tất cả thông tin người dùng hiện tại
        passwordUser: newPassword, // Ghi đè bằng mật khẩu mới
      };

      // Xóa các trường không cần thiết
      delete payload.token;
      delete payload.historyRead;
      delete payload.commentRespones;

      console.log("Sending payload to /user/updateUser for password change:", payload);
      
      // Chúng ta không gửi oldPassword vì API không yêu cầu
      const response = await apiClient.put('/user/updateUser', payload);

      if (response.data && response.data.code === 1000) {
        // Trả về user object mới (có thể chứa token mới nếu backend cấp lại)
        return response.data.result;
      }
      return rejectWithValue(response.data.message || 'Đổi mật khẩu thất bại.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi đổi mật khẩu.');
    }
  }
);


export const updateUserAvatar = createAsyncThunk(
  'user/updateAvatar',
  async (avatarFile, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);

      // Endpoint có thể là /user/update-avatar hoặc tương tự
      const response = await apiClient.post('/user/update-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.code === 1000) {
        return response.data.result; // API trả về user object đã cập nhật
      }
      return rejectWithValue(response.data.message || 'Cập nhật avatar thất bại.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật avatar.');
    }
  }
);
//api createReviewNovel
// API tạo đánh giá tiểu thuyết
export const createReviewNovel = createAsyncThunk(
  'user/createReviewNovel',
  async ({ idUser, idNovel, rating, reviewMC, reviewSC, reviewWorld, reviewPersonal }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        `${rooturl}/user/createReviewNovel`,
        {
          idUser,
          idNovel,
          rating,
          reviewMC,
          reviewSC,
          reviewWorld,
          reviewPersonal
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data && response.data.code === 200) {
        return response.data.result; // Trả về kết quả đánh giá mới
      } else {
        // Kiểm tra nếu API trả về lỗi khác
        return rejectWithValue(response.data?.message || 'Lỗi khi tạo đánh giá.');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tạo đánh giá.');
    }
  }
);
export const followNovel = createAsyncThunk(
  'user/followNovel',
  async ({ idUser, idNovel }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/novel/followNovel', { idUser, idNovel });

      // Kiểm tra nếu kết quả trả về hợp lệ
      if (response.data?.code === 1000) {
        if (response.data.result === true) {
          // Theo dõi thành công
          return { idNovel, result: true };
        } else if (response.data.result === false) {
          // Bỏ theo dõi thành công
          return { idNovel, result: false };
        }
      }
      return rejectWithValue(response.data?.message || 'Theo dõi thất bại');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi theo dõi truyện.');
    }
  }
);
export const refreshUser = createAsyncThunk(
  'user/refresh',
  async (_, { getState, rejectWithValue }) => {
    const { currentUser } = getState().user;
    if (!currentUser?.idUser) {
      return rejectWithValue('Không có người dùng để làm mới.');
    }
    try {
      // API yêu cầu gửi idUser trong body dưới dạng chuỗi
      const response = await apiClient.post('/user/refreshUser', currentUser.idUser, {
          headers: {
              // Quan trọng: Báo cho server biết bạn đang gửi một chuỗi text
              'Content-Type': 'application/json' 
          }
      });

      if (response.data && response.data.code === 1073741824 && response.data.result) {
        return response.data.result; // Trả về object user mới và đầy đủ
      }
      return rejectWithValue(response.data?.message || 'Không thể làm mới thông tin người dùng.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi làm mới thông tin người dùng.');
    }
  }
);
export const loadAndRefreshUser = createAsyncThunk(
  'user/loadAndRefresh',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      // BƯỚC 1: Tải dữ liệu từ localStorage để UI hiển thị ngay lập tức
      const savedUserString = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('authToken');
      
      if (savedUserString && savedToken) {
        const user = JSON.parse(savedUserString);
        // Dispatch một action đồng bộ để cập nhật state ngay lập tức
        dispatch(setUserFromStorage({ user, token: savedToken }));

        // BƯỚC 2: Gọi refreshUser để lấy dữ liệu và token mới nhất từ server
        // Dùng unwrap() sẽ ném lỗi nếu refreshUser bị rejected, và khối catch sẽ bắt được
        const refreshedUser = await dispatch(refreshUser()).unwrap();
        
        // Nếu refresh thành công, trả về dữ liệu mới nhất để cập nhật lần cuối
        return refreshedUser;
      }

      // Nếu không có dữ liệu trong storage, không làm gì cả
      return rejectWithValue('No user data in storage.');

    } catch (error) {
      // Lỗi này xảy ra khi dispatch(refreshUser()).unwrap() thất bại (ví dụ: token hết hạn)
      console.log('Refresh token failed, logging out.', error);
      // Tự động đăng xuất người dùng một cách "thầm lặng"
      dispatch(logoutUser()); 
      return rejectWithValue(error);
    }
  }
);
 const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };
    
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

const handleLoginOrUpdateSuccess = (state, action) => {
      state.loading = false;
      state.error = null;
      state.currentUser = action.payload; // Payload là user object đầy đủ
      // Giả sử token cũng nằm trong user object trả về
      if (action.payload.token) {
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      }
      localStorage.setItem('user', JSON.stringify(action.payload));
    };
// --- SLICE DEFINITION ---
// const initialState = {
//   currentUser: null, // Sẽ lưu thông tin user (không bao gồm token)
//   token: localStorage.getItem('authToken') || null, // Chỉ lưu token
//   usersList: [],
//   userHistory: [],
//   loading: false,
//   isOtpSending: false,
//   isHistoryLoading: false,
//   error: null,
//   otpMessage: null,
//   historyActionStatus: null,
// };
const initialState = {
  currentUser: null,
  token: localStorage.getItem('authToken') || null,
  usersList: [],
  userHistory: [], 
  followedNovels: [],

  loading: false, 
  historyLoading: false,
  isOtpSending: false,
  isUserHistoryLoading: false, 
  reviewData: null, 
  error: null,
  otpMessage: null,
  historyActionStatus: null, 
  forgotPassword: {
      status: 'idle', 
      error: null,
      message: null,
  }
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.token = null;
      state.error = null;
      state.historyActionStatus = null;
      state.userHistory = [];
      state.otpMessage = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    },
    clearUserError: (state) => { state.error = null; },
    clearOtpMessage: (state) => { state.otpMessage = null; },
    clearHistoryActionStatus: (state) => { state.historyActionStatus = null; },
    setUserFromStorage: (state, action) => {
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
    },
      loadUserFromStorage: (state) => {
      const savedUserString = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('authToken');
      if (savedUserString) {
        try {
          state.currentUser = JSON.parse(savedUserString);
        } catch (e) {
          console.error("Error parsing currentUser from localStorage", e);
          localStorage.removeItem('currentUser');
        }
      }
      if (savedToken) {
        state.token = savedToken;
      }
    },
    clearUserHistory: (state) => {
      state.userHistory = [];
      state.isHistoryLoading = false;
    }
  },
  extraReducers: (builder) => {
    const handleAuthSuccess = (state, action) => {
      state.loading = false;
      // Giả sử action.payload là { user: {...}, token: "..." }
      // Hoặc action.payload là object user đã chứa token: action.payload.token
      // Hoặc action.payload chỉ là user, và token nằm ở response.data.token (cần điều chỉnh)
      const userData = action.payload.user || action.payload; // Lấy thông tin user
      const token = action.payload.token;

      state.currentUser = userData;
      if (token) { // Chỉ cập nhật token nếu có token mới
        state.token = token;
        localStorage.setItem('authToken', token);
      }
      localStorage.setItem('currentUser', JSON.stringify(userData)); // Lưu user info (không có token)
      state.userHistory = []; // Xóa lịch sử của người dùng cũ
      state.error = null;
    };

    const handleAuthPending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const handleAuthRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.currentUser = null;
      state.token = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    };

    builder
      // Register User
      .addCase(registerUser.pending, handleAuthPending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Đăng ký thành công có thể chưa đăng nhập ngay, chỉ set currentUser
        state.currentUser = action.payload; // Payload là user info
        // Token sẽ được set khi login
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login User With Password & Login User By Email Only & Create User By Email Only
      

      // Send OTP
      .addCase(sendOTP.pending, (state) => { state.isOtpSending = true; state.error = null; state.otpMessage = null; })
      .addCase(sendOTP.fulfilled, (state, action) => { state.isOtpSending = false; state.otpMessage = action.payload.message; })
      .addCase(sendOTP.rejected, (state, action) => { state.isOtpSending = false; state.error = action.payload; })

      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUser && state.currentUser.emailUser === action.payload.emailUser) {
          // Giả sử action.payload là object user đã được cập nhật từ backend
          state.currentUser = { ...state.currentUser, ...action.payload };
          localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Create History
       .addCase(createHistory.pending, (state) => {
        state.historyLoading = true; // Sử dụng loading state riêng cho history
        state.error = null;
        state.historyActionStatus = null;
      })
      .addCase(createHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyActionStatus = action.payload.message || 'Lịch sử đọc đã được cập nhật.';
        // Tùy chọn: Nếu API trả về danh sách lịch sử đã cập nhật, bạn có thể cập nhật state.userHistory ở đây.
        // Hoặc, bạn có thể dispatch lại getAllHistoryByUser sau khi hành động này thành công
        // để đảm bảo danh sách lịch sử luôn mới nhất.
        // Ví dụ: nếu action.payload.result là một history item mới/đã cập nhật:
        // const updatedHistoryItem = action.payload.result;
        // const index = state.userHistory.findIndex(item => item.id?.idNovel === updatedHistoryItem.id?.idNovel && item.id?.idChapter === updatedHistoryItem.id?.idChapter);
        // if (index !== -1) {
        //   state.userHistory[index] = updatedHistoryItem;
        // } else {
        //   state.userHistory.unshift(updatedHistoryItem);
        // }
      })
     .addCase(createHistory.rejected, (state, action) => {
    state.historyLoading = false;
    // THÊM LOG NÀY VÀO ĐỂ CHẮC CHẮN BẮT ĐƯỢC LỖI
    console.error('[createHistory REJECTED]', action.payload); 
    state.error = action.payload;
    state.historyActionStatus = `Lỗi cập nhật lịch sử: ${action.payload}`;
})

      // Delete History
      .addCase(deleteHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
        state.historyActionStatus = null;
      })
      .addCase(deleteHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyActionStatus = action.payload.message || 'Lịch sử đã được xóa.';
        // Sau khi xóa, bạn có thể muốn lọc state.userHistory
        // Giả sử action.meta.arg là historyData đã gửi đi (chứa idUser, idNovel, idChapter)
        if (action.meta.arg) {
            const { idUser, idNovel, idChapter } = action.meta.arg;
            state.userHistory = state.userHistory.filter(item =>
                !(item.id.idUser === idUser && item.id.idNovel === idNovel /* && item.id.idChapter === idChapter nếu có */)
            );
        }
      })
      .addCase(deleteHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
        state.historyActionStatus = `Lỗi xóa lịch sử: ${action.payload}`;
      })

      // Get All History By User
      .addCase(getAllHistoryByUser.pending, (state) => {
        state.isUserHistoryLoading = true; // Sử dụng cờ loading riêng
        state.error = null;
      })
      .addCase(getAllHistoryByUser.fulfilled, (state, action) => {
        state.isUserHistoryLoading = false;
        state.userHistory = action.payload;
      })
      .addCase(getAllHistoryByUser.rejected, (state, action) => {
        state.isUserHistoryLoading = false;
        state.error = action.payload;
        state.userHistory = [];
      }
    )
      .addCase(updateUserProfile.pending, handlePending)
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updatedUserData = action.payload; // Dữ liệu user mới từ API

        if (state.currentUser) {
          // TỐT NHẤT: Chỉ cập nhật các trường đã thay đổi.
          // Không ghi đè toàn bộ object.
          state.currentUser.userNameUser = updatedUserData.userNameUser;
          state.currentUser.dobUser = updatedUserData.dobUser;
          state.currentUser.imageUser = updatedUserData.imageUser; // Thêm các trường khác nếu có
          // TUYỆT ĐỐI KHÔNG LÀM: state.currentUser = updatedUserData;

          // Cập nhật localStorage với object đã được merge một cách an toàn
          localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        }
      })
      .addCase(updateUserProfile.rejected, handleRejected)

      // Xử lý riêng cho changeUserPassword
      // (cũng nên tách ra để tránh các hiệu ứng phụ không mong muốn)
      .addCase(changeUserPassword.pending, handlePending)
      .addCase(changeUserPassword.fulfilled, (state, action) => {
          // Khi đổi mật khẩu thành công, ta nên xử lý giống như một lần login mới
          // để đảm bảo mọi thông tin (kể cả token nếu có) đều được làm mới.
          // Do đó, ở đây có thể dùng lại handleAuthSuccess hoặc một phiên bản của nó.
          const userData = action.payload.user || action.payload;
          const token = action.payload.token;

          state.currentUser = userData;
          if (token) {
              state.token = token;
              localStorage.setItem('authToken', token);
          }
          localStorage.setItem('currentUser', JSON.stringify(userData));
          state.error = null;
      })
      .addCase(changeUserPassword.rejected, handleRejected)
      .addCase(createReviewNovel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReviewNovel.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewData = action.payload; // Lưu kết quả đánh giá mới vào state
      })
      .addCase(createReviewNovel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Lưu lỗi nếu có
      })
      .addCase(followNovel.fulfilled, (state, action) => {
  state.loading = false;
  const { idNovel, result } = action.payload;

  if (result === true) {
    // Nếu kết quả là true, thêm vào danh sách theo dõi
    if (!state.followedNovels.includes(idNovel)) {
      state.followedNovels.push(idNovel);
    }
  } else if (result === false) {
    // Nếu kết quả là false, xóa khỏi danh sách theo dõi
    state.followedNovels = state.followedNovels.filter(novelId => novelId !== idNovel);
  }
})

   .addCase(LyberiNovels.fulfilled, (state, action) => {
      // action.payload là mảng các object truyện [{idNovel: "..."}, ...]
      // Chúng ta chỉ cần lấy ra mảng các ID
      if (Array.isArray(action.payload)) {
        state.followedNovels = action.payload.map(novel => novel.idNovel);
      }
    })
    .addCase(LyberiNovels.rejected, (state, action) => {
      state.followedNovels = []; // Reset nếu lỗi
      console.error("Lỗi LyberiNovels:", action.payload);
    })
    .addCase(confirmTransactions.fulfilled, (state, action) => {
        // action.payload từ confirmTransactions là { success: true, confirmedChapters: ["..."] }
        const newPurchasedChapters = action.payload.confirmedChapters;
        if (state.currentUser && Array.isArray(newPurchasedChapters)) {
            // Tạo một Set để tránh trùng lặp và thêm các chương mới vào
            const updatedSet = new Set([...(state.currentUser.purchasedChapterIds || []), ...newPurchasedChapters]);
            state.currentUser.purchasedChapterIds = Array.from(updatedSet);
            // Cập nhật lại localStorage
            localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        }
    }) .addCase(refreshUser.fulfilled, (state, action) => {
        // Đây là reducer quan trọng nhất
        // Nó sẽ ghi đè toàn bộ thông tin user cũ bằng dữ liệu mới nhất từ server
        state.currentUser = action.payload;
        
        // Cập nhật lại token nếu có token mới được trả về
        if(action.payload.token) {
            state.token = action.payload.token;
            localStorage.setItem('authToken', action.payload.token);
        }
        
        // Cập nhật lại localStorage
        localStorage.setItem('currentUser', JSON.stringify(action.payload));
        
        state.loading = false;
        state.error = null;
    })
    .addCase(refreshUser.pending, (state) => {
        state.loading = true;
    })
    .addCase(refreshUser.rejected, (state, action) => {
        state.loading = false;
        // Có thể không cần báo lỗi ra UI, chỉ log ra console
        console.error('Refresh user failed:', action.payload);
    })
     .addCase(loadAndRefreshUser.pending, (state) => {
            // Có thể không cần làm gì ở đây, vì UI đã hiển thị dữ liệu cũ
        })
        .addCase(loadAndRefreshUser.fulfilled, (state, action) => {
            // Reducer này sẽ ghi đè dữ liệu từ storage bằng dữ liệu mới nhất từ server
            state.currentUser = action.payload;
            if(action.payload.token) {
                state.token = action.payload.token;
                localStorage.setItem('authToken', action.payload.token);
            }
            localStorage.setItem('currentUser', JSON.stringify(action.payload));
        })
        .addCase(loadAndRefreshUser.rejected, (state, action) => {
            // Không cần làm gì ở đây vì logic logout đã được xử lý bên trong thunk
            // Chỉ đảm bảo state không bị treo ở trạng thái loading
            state.loading = false;
        })

      // .addMatcher cho các hành động login vẫn giữ nguyên
      .addMatcher(
        (action) => [
          loginUserWithPassword.fulfilled.type,
          loginUserByEmailOnly.fulfilled.type,
          createUserByEmailOnly.fulfilled.type,
        ].includes(action.type),
        handleAuthSuccess
      )      
      .addMatcher(
        (action) => [
          loginUserWithPassword.fulfilled.type,
          loginUserByEmailOnly.fulfilled.type,
          createUserByEmailOnly.fulfilled.type, // Nếu createUserByEmailOnly cũng đăng nhập và trả token
        ].includes(action.type),
        handleAuthSuccess
      )
      .addMatcher(
        (action) => [
          loginUserWithPassword.pending.type,
          loginUserByEmailOnly.pending.type,
          createUserByEmailOnly.pending.type,
        ].includes(action.type),
        handleAuthPending
      )
      .addMatcher(
        (action) => [
          loginUserWithPassword.rejected.type,
          loginUserByEmailOnly.rejected.type,
          createUserByEmailOnly.rejected.type,
        ].includes(action.type),
        handleAuthRejected
      )
      ;
  }
});

export const {
  logoutUser,
  clearUserError,
  clearOtpMessage,
  setUserFromStorage, 
    loadUserFromStorage,

  clearHistoryActionStatus,
  clearUserHistory
} = userSlice.actions;

export const selectAuthToken = (state) => state.user.token;
export const selectCurrentUser = (state) => state.user.currentUser;


export default userSlice.reducer;