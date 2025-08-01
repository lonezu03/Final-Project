// src/redux/chapterSlice.js
// 
// LOGIC TỐI ƯU HÓA API:
// 1. DetailPage gọi getAllChapters() -> Lưu toàn bộ chapters vào state.chapters
// 2. ReadingPage gọi getAllChapters() -> Sau đó gọi getNovelChaptersList() -> Tái sử dụng dữ liệu từ state
// 3. getChapterContentById() -> Kiểm tra state trước, chỉ gọi getAllChapters() nếu cần
// 4. Không còn gọi API /chapter/getAll nhiều lần -> Tiết kiệm băng thông
//
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api'; // Luôn dùng apiClient vì API có thể yêu cầu token
import { rooturl } from './element'; // Import đường dẫn gốc từ file element
const API_BASE_CHAPTER = "/chapter"; // Base URL tương đối

// Action để lấy danh sách chương đầy đủ (có thể có content nếu có token)
// Sẽ được dùng bởi DetailPage và được gọi lại bởi getChapterContentById nếu cần
export const getAllChapters = createAsyncThunk(
  'chapters/getAllChapters',
  async (novelId, { rejectWithValue, getState }) => {
    try {
      const token = getState().user.token;
      const payload = { 
        idNovel: String(novelId) // Đảm bảo idNovel là string
      };
      if (token) {
        payload.token = token;
      }
      
      console.log('🔍 [getAllChapters] Calling API with payload:', payload);
      console.log('🔍 [getAllChapters] Current token:', token ? 'EXISTS' : 'NO TOKEN');
      console.log('🔍 [getAllChapters] Full URL:', `${rooturl}${API_BASE_CHAPTER}/getAll`);
      console.log('🔍 [getAllChapters] novelId type:', typeof novelId, 'value:', novelId);
      
      const response = await apiClient.post(`${API_BASE_CHAPTER}/getAll`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('✅ [getAllChapters] API Response:', response.data);

      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        const chapters = response.data.result;
        
        // Nếu không có token, API chỉ trả về titleChapter
        if (!token && chapters.length > 0 && chapters[0].idChapter === undefined) {
          // Tạo dữ liệu giả cho chapters khi chưa đăng nhập
          return chapters.map((chapter, index) => ({
            ...chapter,
            idChapter: `temp_${index}`, // ID tạm thời
            indexChapter: index,
            coinPrice: 0,
            isLoginRequired: true // Flag để biết cần đăng nhập
          }));
        }
        
        // Khi có token, backend PHẢI trả về idChapter và indexChapter
        if (token && chapters.length > 0 && (chapters[0].idChapter === undefined || chapters[0].indexChapter === undefined)) {
            return rejectWithValue('Dữ liệu chương từ API không có idChapter hoặc indexChapter.');
        }
        
        return chapters.sort((a, b) => (Number(a.indexChapter) || 0) - (Number(b.indexChapter) || 0));
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách chương.');
    } catch (error) {
      console.error('❌ [getAllChapters] API Error:', error);
      console.error('❌ [getAllChapters] Error message:', error.message);
      console.error('❌ [getAllChapters] Response status:', error.response?.status);
      console.error('❌ [getAllChapters] Response data:', error.response?.data);
      console.error('❌ [getAllChapters] Response headers:', error.response?.headers);
      console.error('❌ [getAllChapters] Request config:', error.config);
      
      // Nếu lỗi 401 hoặc 403, có thể do token hết hạn
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('⚠️ [getAllChapters] Token might be expired, trying without token...');
        try {
          // Thử gọi lại API mà không cần token
          const fallbackPayload = { idNovel: String(novelId) };
          const fallbackResponse = await apiClient.post(`${API_BASE_CHAPTER}/getAll`, fallbackPayload, {
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (fallbackResponse.data && fallbackResponse.data.code === 1000) {
            console.log('✅ [getAllChapters] Fallback API success');
            return fallbackResponse.data.result || [];
          }
        } catch (fallbackError) {
          console.error('❌ [getAllChapters] Fallback also failed:', fallbackError);
        }
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải danh sách chương.');
    }
  }
);

// Action để lấy danh sách chương cho dropdown của ReadingPage
// KHÔNG GỌI API - chỉ tái sử dụng dữ liệu từ getAllChapters
export const getNovelChaptersList = createAsyncThunk(
  'chapters/getNovelChaptersList',
  async (novelId, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState();
      
      // Kiểm tra xem đã có dữ liệu chapters cho novelId này chưa
      const existingChapters = state.chapters.chapters.filter(chap => chap.novelId === novelId);
      
      if (existingChapters.length > 0) {
        console.log('✅ [getNovelChaptersList] Tái sử dụng dữ liệu từ getAllChapters');
        // Tái sử dụng dữ liệu đã có, map sang định dạng dropdown
        const sortedChapters = [...existingChapters].sort((a, b) => (Number(a.indexChapter) || 0) - (Number(b.indexChapter) || 0));
        
        return sortedChapters.map(chap => ({
          idChapter: String(chap.idChapter),
          chapterNumber: (chap.indexChapter !== null && chap.indexChapter !== undefined) ? Number(chap.indexChapter) + 1 : 'N/A',
          titleChapter: chap.titleChapter || "Chưa có tiêu đề"
        }));
      }
      
      // Nếu chưa có dữ liệu, gọi getAllChapters trước
      console.log('🔄 [getNovelChaptersList] Chưa có dữ liệu, gọi getAllChapters trước');
      const getAllResult = await dispatch(getAllChapters(novelId));
      
      if (getAllChapters.fulfilled.match(getAllResult)) {
        const chaptersFromGetAll = getAllResult.payload;
        const sortedChapters = [...chaptersFromGetAll].sort((a, b) => (Number(a.indexChapter) || 0) - (Number(b.indexChapter) || 0));
        
        return sortedChapters.map(chap => ({
          idChapter: String(chap.idChapter),
          chapterNumber: (chap.indexChapter !== null && chap.indexChapter !== undefined) ? Number(chap.indexChapter) + 1 : 'N/A',
          titleChapter: chap.titleChapter || "Chưa có tiêu đề"
        }));
      } else {
        return rejectWithValue(getAllResult.payload || 'Không thể tải danh sách chương.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Lỗi khi tải danh sách chương cho dropdown.');
    }
  }
);

// Action để lấy nội dung chi tiết của một chương
// LOGIC MỚI: Tái sử dụng dữ liệu từ getAllChapters thay vì gọi API riêng
export const getChapterContentById = createAsyncThunk(
  'chapters/getChapterContentById',
  async ({ novelId, chapterId }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.user.token;

    // 1. Kiểm tra trong state.chapters đã có nội dung chưa
    const existingChapterWithContent = state.chapters.chapters.find(
      chap => String(chap.idChapter) === String(chapterId) && chap.novelId === novelId && chap.contentChapter
    );
    if (existingChapterWithContent) {
      console.log('✅ [getChapterContentById] Sử dụng nội dung đã có trong state');
      return existingChapterWithContent;
    }

    // 2. Kiểm tra có chương không có content -> cần gọi getAllChapters để lấy content
    const existingChapterWithoutContent = state.chapters.chapters.find(
      chap => String(chap.idChapter) === String(chapterId) && chap.novelId === novelId
    );
    
    if (existingChapterWithoutContent && !existingChapterWithoutContent.contentChapter) {
      console.log('🔄 [getChapterContentById] Chapter tồn tại nhưng chưa có content, gọi getAllChapters');
      // Chapter đã tồn tại nhưng chưa có content, gọi getAllChapters với token để lấy content
      try {
        const actionResult = await dispatch(getAllChapters(novelId));
        
        if (getAllChapters.fulfilled.match(actionResult)) {
          const chaptersFetchedWithContent = actionResult.payload;
          const targetChapter = chaptersFetchedWithContent.find(chap => String(chap.idChapter) === String(chapterId));

          if (targetChapter) {
              // Nếu có token mà backend vẫn không trả content, trả về thông báo lỗi trong content
              if (token && !targetChapter.contentChapter) {
                   return { ...targetChapter, contentChapter: "Lỗi: Không thể tải nội dung chương (token có thể không hợp lệ)." };
              }
              // Nếu không có token, trả về thông báo yêu cầu đăng nhập
              if (!token && !targetChapter.contentChapter) {
                   return { ...targetChapter, contentChapter: "Vui lòng đăng nhập để đọc nội dung chương này." };
              }
              return targetChapter;
          } else {
            return rejectWithValue(`Chương ${chapterId} không tìm thấy sau khi fetch.`);
          }
        } else {
          return rejectWithValue(actionResult.payload || 'Không thể tải nội dung chương.');
        }
      } catch (error) {
        return rejectWithValue(error.message || 'Lỗi khi tải nội dung chương.');
      }
    }

    // 3. Nếu chưa có dữ liệu gì, gọi getAllChapters trước
    console.log('🔄 [getChapterContentById] Chưa có dữ liệu chapter, gọi getAllChapters');
    try {
      const actionResult = await dispatch(getAllChapters(novelId));

      if (getAllChapters.fulfilled.match(actionResult)) {
        const chaptersFetchedWithContent = actionResult.payload;
        const targetChapter = chaptersFetchedWithContent.find(chap => String(chap.idChapter) === String(chapterId));

        if (targetChapter) {
            // Nếu có token mà backend vẫn không trả content, trả về thông báo lỗi trong content
            if (token && !targetChapter.contentChapter) {
                 return { ...targetChapter, contentChapter: "Lỗi: Không thể tải nội dung chương (token có thể không hợp lệ)." };
            }
            // Nếu không có token, trả về thông báo yêu cầu đăng nhập
            if (!token && !targetChapter.contentChapter) {
                 return { ...targetChapter, contentChapter: "Vui lòng đăng nhập để đọc nội dung chương này." };
            }
            return targetChapter;
        } else {
          return rejectWithValue(`Chương ${chapterId} không tìm thấy sau khi fetch.`);
        }
      } else {
        return rejectWithValue(actionResult.payload || 'Không thể tải nội dung chương.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Lỗi khi tải nội dung chương.');
    }
  }
);
//api tăng view
export const increaseChapterView = createAsyncThunk(
  'chapters/increaseView',
  async (idChapter, { rejectWithValue }) => {
    try {
      // Gọi API để tăng lượt xem
      const response = await apiClient.get(`/chapter/increaseViewChapter/${idChapter}`);
      if (response.data && response.data.code === 1000) {
        // Trả về số lượt xem mới của chương
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Failed to increase view for chapter');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Error increasing chapter view');
    }
  }
);


const initialState = {
  chapters: [], // Danh sách chương đầy đủ (từ getAllChapters)
  chaptersForReadingPageDropdown: [], // Danh sách đã map cho dropdown (từ getNovelChaptersList)
  currentChapterContent: null, // Object chương hiện tại đang đọc
  chapterViews: {},

  loadingAllChapters: false,
  errorAllChapters: null,
  loadingDropdownChapters: false,
  errorDropdownChapters: null,
  loadingContent: false,      // <-- Đổi tên từ loadingSpecificContent
  errorContent: null,         // <-- Đổi tên từ errorSpecificContent
};

const chapterSlice = createSlice({
  name: 'chapters',
  initialState,
  reducers: {
    clearChapterState: (state) => {
      // Reset tất cả về trạng thái ban đầu
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // getAllChapters
      .addCase(getAllChapters.pending, (state) => { state.loadingAllChapters = true; state.errorAllChapters = null; })
      .addCase(getAllChapters.fulfilled, (state, action) => {
        state.loadingAllChapters = false;
        // Gán novelId vào mỗi chapter để tiện cho việc kiểm tra sau này
        state.chapters = action.payload.map(chap => ({...chap, novelId: action.meta.arg}));
        state.errorAllChapters = null;
      })
      .addCase(getAllChapters.rejected, (state, action) => {
        state.loadingAllChapters = false; state.errorAllChapters = action.payload; state.chapters = [];
      })

      // getNovelChaptersList
      .addCase(getNovelChaptersList.pending, (state) => {
        state.loadingDropdownChapters = true;
        state.errorDropdownChapters = null;
      })
      .addCase(getNovelChaptersList.fulfilled, (state, action) => {
        state.loadingDropdownChapters = false;
        state.chaptersForReadingPageDropdown = action.payload; // payload đã được map
        state.errorDropdownChapters = null;
      })
      .addCase(getNovelChaptersList.rejected, (state, action) => {
        state.loadingDropdownChapters = false;
        state.errorDropdownChapters = action.payload;
        state.chaptersForReadingPageDropdown = [];
      })

      // getChapterContentById
      .addCase(getChapterContentById.pending, (state, action) => {
        const requestedChapterId = action.meta.arg.chapterId;
        // Chỉ đặt trạng thái loading nếu chúng ta đang tải một chương MỚI
        // hoặc chưa có chương nào được tải.
        if (!state.currentChapterContent || String(state.currentChapterContent.idChapter) !== String(requestedChapterId)) {
          state.loadingContent = true;
          state.errorContent = null;
        }
      })
      .addCase(getChapterContentById.fulfilled, (state, action) => {
        state.loadingContent = false;
        state.errorContent = null;
        const newContent = action.payload;

        // --- LOGIC QUAN TRỌNG ĐỂ TRÁNH RE-RENDER ---
        // Chỉ cập nhật state nếu:
        // 1. Chưa có chương nào (lần tải đầu tiên).
        // 2. ID của chương mới khác với chương hiện tại.
        // 3. ID giống nhau, nhưng nội dung (contentChapter) đã thay đổi (ví dụ: từ placeholder sang nội dung thật).
        if (
          !state.currentChapterContent ||
          String(state.currentChapterContent.idChapter) !== String(newContent.idChapter) ||
          state.currentChapterContent.contentChapter !== newContent.contentChapter
        ) {
          console.log('[Reducer] Cập nhật currentChapterContent vì dữ liệu mới hoặc khác biệt.');
          state.currentChapterContent = newContent;
        } else {
          console.log('[Reducer] Bỏ qua cập nhật currentChapterContent vì dữ liệu giống hệt.');
        }
      })
      .addCase(getChapterContentById.rejected, (state, action) => {
        state.loadingContent = false;
        state.errorContent = action.payload;
        // Chỉ xóa nội dung nếu lỗi thuộc về chương đang xem
        const requestedChapterId = action.meta.arg.chapterId;
        if (state.currentChapterContent && String(state.currentChapterContent.idChapter) === String(requestedChapterId)) {
          state.currentChapterContent = null;
        }
      })
      // increaseChapterView
       .addCase(increaseChapterView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(increaseChapterView.fulfilled, (state, action) => {
        state.loading = false;
        // Cập nhật số lượt xem của chapter sau khi tăng
        const { idChapter, views } = action.payload;
        state.chapterViews[idChapter] = views; // Cập nhật thông tin lượt xem
      })
      .addCase(increaseChapterView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearChapterState } = chapterSlice.actions;

// Selectors (Giữ nguyên tên để các component khác không bị lỗi)
export const selectAllChaptersForNovel = (state) => state.chapters.chapters;
export const selectChaptersForReadingDropdown = (state) => state.chapters.chaptersForReadingPageDropdown;
export const selectCurrentChapterContent = (state) => state.chapters.currentChapterContent;
export const selectLoadingAllChapters = (state) => state.chapters.loadingAllChapters;
export const selectErrorAllChapters = (state) => state.chapters.errorAllChapters;
export const selectLoadingDropdownChapters = (state) => state.chapters.loadingDropdownChapters;
export const selectErrorDropdownChapters = (state) => state.chapters.errorDropdownChapters;
export const selectLoadingSpecificContent = (state) => state.chapters.loadingContent;
export const selectErrorSpecificContent = (state) => state.chapters.errorContent;

export default chapterSlice.reducer;