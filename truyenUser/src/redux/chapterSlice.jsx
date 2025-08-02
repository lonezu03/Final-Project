// src/redux/chapterSlice.js
// 
// LOGIC TỐI ƯU HÓA API - PHIÊN BẢN TỐI ƯU:
// 1. DetailPage gọi getAllChapters() -> KHÔNG gửi token -> Server trả về nhanh (chỉ metadata)
// 2. ReadingPage gọi generateDropdownFromExistingChapters() -> Tái sử dụng dữ liệu từ state  
// 3. getChapterContentById() -> Gọi getChapterById() sử dụng API GET /chapter/{idChapter} (whitelist)
// 4. Tách biệt hoàn toàn: metadata (getAllChapters) vs content (getChapterById)
// 5. Giảm tải server: getAllChapters nhanh hơn, getChapterById chỉ gọi khi cần nội dung
//
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';
import { rooturl } from './element';

const API_BASE_CHAPTER = "/chapter";

// Đơn giản hóa: Action để lấy danh sách chương
export const getAllChapters = createAsyncThunk(
  'chapters/getAllChapters',
  async (novelId, { rejectWithValue }) => {
    try {
      const payload = { 
        idNovel: String(novelId)
      };
      
      console.log('🔍 [getAllChapters] API call with payload:', payload);
      console.log('🔍 [getAllChapters] URL:', `${rooturl}${API_BASE_CHAPTER}/getAll`);
      
      const response = await apiClient.post(`${API_BASE_CHAPTER}/getAll`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('✅ [getAllChapters] API Response:', response.data);

      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        const chapters = response.data.result;
        
        if (chapters.length > 0) {
          const firstChapter = chapters[0];
          if (!firstChapter.idChapter) {
            console.warn('⚠️ [getAllChapters] Response missing idChapter:', firstChapter);
            return rejectWithValue('Dữ liệu chương từ API không đầy đủ (thiếu idChapter).');
          }
        }
        
        console.log('📋 [getAllChapters] Chapters received:', chapters.length, 'chapters');
        return chapters;
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách chương.');
    } catch (error) {
      console.error('❌ [getAllChapters] API Error:', error);
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
        // Không sort theo indexChapter vì API response không có field này
        
        return existingChapters.map((chap, index) => ({
          idChapter: String(chap.idChapter),
          chapterNumber: index + 1, // Dùng index từ array thay vì indexChapter
          titleChapter: chap.titleChapter || "Chưa có tiêu đề"
        }));
      }
      
      // Nếu chưa có dữ liệu, gọi getAllChapters trước
      console.log('🔄 [getNovelChaptersList] Chưa có dữ liệu, gọi getAllChapters trước');
      const getAllResult = await dispatch(getAllChapters(novelId));
      
      if (getAllChapters.fulfilled.match(getAllResult)) {
        const chaptersFromGetAll = getAllResult.payload;
        // Không sort theo indexChapter vì API response không có field này
        
        return chaptersFromGetAll.map((chap, index) => ({
          idChapter: String(chap.idChapter),
          chapterNumber: index + 1, // Dùng index từ array thay vì indexChapter
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

// Action để tạo dropdown từ dữ liệu chapters có sẵn trong state (KHÔNG GỌI API)
export const generateDropdownFromExistingChapters = createAsyncThunk(
  'chapters/generateDropdownFromExistingChapters',
  async (novelId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const existingChapters = state.chapters.chapters.filter(chap => 
        String(chap.novelId) === String(novelId) || String(chap.idNovel) === String(novelId)
      );
      
      if (existingChapters.length === 0) {
        console.log('⚠️ [generateDropdownFromExistingChapters] Không có dữ liệu chapters trong state cho novelId:', novelId);
        return [];
      }
      
      console.log('✅ [generateDropdownFromExistingChapters] Tạo dropdown từ', existingChapters.length, 'chapters có sẵn');
      
      // Sắp xếp theo indexChapter và tạo dropdown data
      const sortedChapters = [...existingChapters].sort((a, b) => 
        (Number(a.indexChapter) || 0) - (Number(b.indexChapter) || 0)
      );
      
      return sortedChapters.map(chap => ({
        idChapter: String(chap.idChapter),
        indexChapter: chap.indexChapter, // Thêm indexChapter để dùng trong ReadingPage
        chapterNumber: (chap.indexChapter !== null && chap.indexChapter !== undefined) 
          ? Number(chap.indexChapter) + 1 
          : 'N/A',
        titleChapter: chap.titleChapter || "Chưa có tiêu đề",
        coinPrice: chap.coinPrice || 0, // QUAN TRỌNG: Thêm coinPrice để kiểm tra quyền truy cập
        cointRentPrice: chap.cointRentPrice || 0, // Thêm giá thuê
        dayRentAmount: chap.dayRentAmount || 0, // Thêm số ngày thuê
        novelId: String(novelId) // Thêm novelId để dễ kiểm tra
      }));
    } catch (error) {
      console.error('❌ [generateDropdownFromExistingChapters] Error:', error);
      return rejectWithValue(error.message || 'Lỗi khi tạo dropdown từ state');
    }
  }
);

// Action để lấy nội dung chapter theo ID (thay thế getFreeChapterContent)
// Sử dụng API GET /chapter/{idChapter} - API whitelist không cần token
export const getChapterById = createAsyncThunk(
  'chapters/getChapterById',
  async (chapterId, { rejectWithValue }) => {
    try {
      console.log('🔍 [getChapterById] Fetching chapter content for ID:', chapterId);
      
      // Gọi API GET /chapter/{idChapter} - API whitelist
      const response = await apiClient.get(`${API_BASE_CHAPTER}/${chapterId}`);

      console.log('✅ [getChapterById] API Response:', response.data);

      if (response.data && response.data.code === 1000 && response.data.result) {
        return response.data.result;
      }
      
      return rejectWithValue(response.data?.message || 'Không thể tải nội dung chapter');
    } catch (error) {
      console.error('❌ [getChapterById] API Error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải nội dung chapter');
    }
  }
);

// Action để lấy nội dung chi tiết của một chương
// LOGIC MỚI: Sử dụng API GET /chapter/{idChapter} thay vì getAllChapters
export const getChapterContentById = createAsyncThunk(
  'chapters/getChapterContentById',
  async ({ novelId, chapterId }, { getState, dispatch, rejectWithValue }) => {
    // 1. Kiểm tra trong state.chapters đã có nội dung chưa
    const state = getState();
    const existingChapterWithContent = state.chapters.chapters.find(
      chap => String(chap.idChapter) === String(chapterId) && chap.novelId === novelId && chap.contentChapter
    );
    
    if (existingChapterWithContent) {
      console.log('✅ [getChapterContentById] Sử dụng nội dung đã có trong state');
      return existingChapterWithContent;
    }

    // 2. Gọi API GET /chapter/{idChapter} để lấy nội dung
    console.log('🔄 [getChapterContentById] Gọi API GET /chapter/{idChapter} cho chapterId:', chapterId);
    try {
      const actionResult = await dispatch(getChapterById(chapterId));
      
      if (getChapterById.fulfilled.match(actionResult)) {
        const chapterData = actionResult.payload;
        
        // Thêm novelId vào dữ liệu để tiện quản lý
        const chapterWithNovelId = {
          ...chapterData,
          novelId: String(novelId)
        };
        
        console.log('✅ [getChapterContentById] Lấy thành công chapter content từ API GET');
        return chapterWithNovelId;
      } else {
        return rejectWithValue(actionResult.payload || 'Không thể tải nội dung chương.');
      }
    } catch (error) {
      console.error('❌ [getChapterContentById] Error:', error);
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
  currentNovelId: null, // ID của novel hiện tại để validation

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
        state.currentNovelId = action.meta.arg; // Lưu ID của novel hiện tại
        state.errorAllChapters = null;
        
        console.log('✅ [chapterSlice] getAllChapters fulfilled:', {
          totalChapters: action.payload.length,
          novelId: action.meta.arg,
          firstChapter: action.payload[0],
          stateChapters: state.chapters.length
        });
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

      // generateDropdownFromExistingChapters (action mới không gọi API)
      .addCase(generateDropdownFromExistingChapters.pending, (state) => {
        state.loadingDropdownChapters = true;
        state.errorDropdownChapters = null;
      })
      .addCase(generateDropdownFromExistingChapters.fulfilled, (state, action) => {
        state.loadingDropdownChapters = false;
        state.chaptersForReadingPageDropdown = action.payload;
        state.errorDropdownChapters = null;
        console.log('✅ [Reducer] Dropdown được tạo từ state với', action.payload.length, 'chapters');
      })
      .addCase(generateDropdownFromExistingChapters.rejected, (state, action) => {
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
      
      // getFreeChapterContent -> getChapterById
      .addCase(getChapterById.pending, (state, action) => {
        const requestedChapterId = action.meta.arg;
        // Chỉ đặt trạng thái loading nếu chúng ta đang tải một chương MỚI
        if (!state.currentChapterContent || String(state.currentChapterContent.idChapter) !== String(requestedChapterId)) {
          state.loadingContent = true;
          state.errorContent = null;
        }
      })
      .addCase(getChapterById.fulfilled, (state, action) => {
        state.loadingContent = false;
        state.errorContent = null;
        const newContent = action.payload;
        
        // Cập nhật currentChapterContent
        state.currentChapterContent = newContent;
        console.log('[Reducer] Updated currentChapterContent with chapter content:', newContent.idChapter);
      })
      .addCase(getChapterById.rejected, (state, action) => {
        state.loadingContent = false;
        state.errorContent = action.payload;
        console.log('[Reducer] Failed to fetch chapter content:', action.payload);
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