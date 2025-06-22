// src/redux/chapterSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api'; // Sử dụng apiClient cho tất cả các request /chapter/getAll

// Base URL tương đối cho API chapter (sẽ được ghép với baseURL của apiClient)
const API_BASE_CHAPTER = "/chapter";

// Action để lấy danh sách chương cho DetailPage (và các nơi khác cần dữ liệu đầy đủ)
// API: POST /chapter/getAll
// Body: { "idNovel": "string", "token"?: "string" }
// Nếu có token, backend trả về contentChapter.
export const getAllChapters = createAsyncThunk(
  'chapters/getAllChapters',
  async (novelId, { rejectWithValue, getState }) => {
    try {
      const token = getState().user.token; // Lấy token từ userSlice (nếu có)
      const payload = {
        idNovel: novelId,
      };
      if (token) {
        payload.token = token; // Chỉ gửi token nếu user đã đăng nhập
      }
      // console.log(`Dispatching getAllChapters for novel ${novelId}, payload:`, payload);

      const response = await apiClient.post(`${API_BASE_CHAPTER}/getAll`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        const chapters = response.data.result;
        // Backend CẦN trả về idChapter và chapterNumber
        return chapters.sort((a, b) => {
          const numA = a.chapterNumber !== null && a.chapterNumber !== undefined ? Number(a.chapterNumber) : (parseInt(a.idChapter, 10) || 0);
          const numB = b.chapterNumber !== null && b.chapterNumber !== undefined ? Number(b.chapterNumber) : (parseInt(b.idChapter, 10) || 0);
          return numA - numB;
        });
      }
      return rejectWithValue(response.data?.message || 'Failed to fetch chapters for detail page');
    } catch (error) {
      console.error(`Error fetching chapters for DetailPage (novelId: ${novelId}):`, error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Error fetching chapters for detail page');
    }
  }
);

// Action để lấy danh sách chương đã được map cho dropdown của ReadingPage
// API: POST /chapter/getAll
// Body: { "idNovel": "string" } (KHÔNG GỬI TOKEN để chỉ lấy title)
export const getNovelChaptersList = createAsyncThunk(
  'chapters/getNovelChaptersList',
  async (novelId, { rejectWithValue }) => {
    try {
      const payload = {
        idNovel: novelId,
        // KHÔNG gửi token ở đây để chỉ lấy danh sách tiêu đề, id, number
      };
      // console.log(`Dispatching getNovelChaptersList for novel ${novelId}, payload:`, payload);

      const response = await apiClient.post(`${API_BASE_CHAPTER}/getAll`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        const chapters = response.data.result;
        // Backend CẦN trả về idChapter và chapterNumber
        const sortedChapters = chapters.sort((a, b) => {
          const numA = a.chapterNumber !== null && a.chapterNumber !== undefined ? Number(a.chapterNumber) : (parseInt(a.idChapter, 10) || 0);
          const numB = b.chapterNumber !== null && b.chapterNumber !== undefined ? Number(b.chapterNumber) : (parseInt(b.idChapter, 10) || 0);
          return numA - numB;
        });
        return sortedChapters.map(chap => ({
          idChapter: chap.idChapter, // Cần có
          chapterNumber: chap.chapterNumber !== null && chap.chapterNumber !== undefined ? chap.chapterNumber : `ID: ${chap.idChapter}`, // Cần có hoặc suy luận
          titleChapter: chap.titleChapter || "Chưa có tiêu đề"
        }));
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách chương cho dropdown.');
    } catch (error) {
      console.error(`Lỗi khi tải danh sách chương cho ReadingPage (novelId: ${novelId}):`, error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải danh sách chương cho dropdown.');
    }
  }
);

// Action để lấy nội dung chi tiết của một chương
// Sẽ cố gắng lấy từ state.chapters (đã fetch bởi getAllChapters với token)
// Nếu không có, và user đã login, sẽ trigger getAllChapters với token.
export const getChapterContentById = createAsyncThunk(
  'chapters/getChapterContentById',
  async ({ novelId, chapterId }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.user.token; // Kiểm tra user có đăng nhập không

    // 1. Kiểm tra trong state.chapters (danh sách có thể đã chứa content)
    const existingChapterWithContent = state.chapters.chapters.find(
      chap => String(chap.idChapter) === String(chapterId) && chap.novelId === novelId && chap.contentChapter
    );
    if (existingChapterWithContent) {
      console.log("Lấy nội dung chương từ state.chapters:", existingChapterWithContent);
      return existingChapterWithContent;
    }

    // 2. Nếu không có content và user đã đăng nhập, fetch lại TOÀN BỘ chương của novel đó với token
    // Điều này giả định rằng khi user click đọc 1 chương, ta muốn load hết content của truyện đó nếu có token.
    if (token) {
      console.log(`Nội dung chương ${chapterId} chưa có (hoặc novelId khác), đang fetch toàn bộ chương của novel ${novelId} KÈM NỘI DUNG.`);
      try {
        // Gọi getAllChapters (sẽ gửi token trong payload vì token tồn tại)
        const actionResult = await dispatch(getAllChapters(novelId));

        if (getAllChapters.fulfilled.match(actionResult)) {
          const chaptersFetchedWithContent = actionResult.payload; // Đây là mảng các chương mới fetch, có content
          const targetChapter = chaptersFetchedWithContent.find(chap => String(chap.idChapter) === String(chapterId));

          if (targetChapter && targetChapter.contentChapter) {
            return targetChapter;
          } else if (targetChapter) {
            // Có chương nhưng không có content (ví dụ: token không hợp lệ dù đã gửi)
            return rejectWithValue(`Nội dung cho chương ${chapterId} không có dù đã fetch (token có thể không hợp lệ hoặc API lỗi).`);
          } else {
            return rejectWithValue(`Chương ${chapterId} không tìm thấy sau khi fetch với token.`);
          }
        } else {
          // Nếu getAllChapters bị rejected
          return rejectWithValue(actionResult.payload || 'Không thể tải nội dung chương sau khi fetch lại.');
        }
      } catch (error) {
        return rejectWithValue(error.message || 'Lỗi khi tải nội dung chương.');
      }
    } else {
      // Nếu không có token (user chưa login) và chương cũng không có content trong state.chapters
      // thì chỉ trả về thông tin chương không có nội dung (nếu có trong state.chaptersForReadingPageDropdown)
      // hoặc báo lỗi là cần đăng nhập để xem nội dung.
      const chapterInfoOnly = state.chapters.chaptersForReadingPageDropdown.find(chap => String(chap.idChapter) === String(chapterId));
      if (chapterInfoOnly) {
        console.warn(`Chương ${chapterId} có thông tin nhưng không có nội dung (user chưa đăng nhập).`);
        return { ...chapterInfoOnly, contentChapter: "Vui lòng đăng nhập để đọc nội dung chương này." }; // Trả về object có contentChapter báo lỗi
      }
      return rejectWithValue('Vui lòng đăng nhập để xem nội dung chương hoặc chương không tồn tại.');
    }
  }
);

// ... (increaseChapterView, createChapter giữ nguyên) ...
export const increaseChapterView = createAsyncThunk( /* ... */ );
export const createChapter = createAsyncThunk( /* ... */ );


const initialState = {
  chapters: [], // Lưu trữ danh sách chương ĐẦY ĐỦ (có thể có contentChapter nếu user login và getAllChapters được gọi với token)
  chaptersForReadingPageDropdown: [], // Danh sách chương chỉ với title, number, id cho dropdown
  currentChapterContent: null,      // Object chương hiện tại đang đọc (bao gồm contentChapter)

  loadingAllChapters: false,        // Loading cho getAllChapters
  errorAllChapters: null,
  loadingDropdownChapters: false,   // Loading cho getNovelChaptersList
  errorDropdownChapters: null,
  loadingSpecificContent: false,    // Loading cho getChapterContentById
  errorSpecificContent: null,
};

const chapterSlice = createSlice({
  name: 'chapters',
  initialState,
  reducers: {
    clearChapterState: (state) => {
      state.chapters = [];
      state.chaptersForReadingPageDropdown = [];
      state.currentChapterContent = null;
      state.loadingAllChapters = false;
      state.errorAllChapters = null;
      state.loadingDropdownChapters = false;
      state.errorDropdownChapters = null;
      state.loadingSpecificContent = false;
      state.errorSpecificContent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getAllChapters (cho DetailPage, có thể có content)
      .addCase(getAllChapters.pending, (state) => { state.loadingAllChapters = true; state.errorAllChapters = null; })
      .addCase(getAllChapters.fulfilled, (state, action) => {
        state.loadingAllChapters = false;
        // Gán novelId vào mỗi chapter để dễ quản lý nếu state.chapters lưu của nhiều truyện
        state.chapters = action.payload.map(chap => ({...chap, novelId: action.meta.arg}));
        state.errorAllChapters = null;
      })
      .addCase(getAllChapters.rejected, (state, action) => {
        state.loadingAllChapters = false; state.errorAllChapters = action.payload; state.chapters = [];
      })

      // getNovelChaptersList (cho dropdown trang đọc, chỉ title/number)
      .addCase(getNovelChaptersList.pending, (state) => { state.loadingDropdownChapters = true; state.errorDropdownChapters = null; })
      .addCase(getNovelChaptersList.fulfilled, (state, action) => {
        state.loadingDropdownChapters = false;
        state.chaptersForReadingPageDropdown = action.payload; // payload đã được map
        state.errorDropdownChapters = null;
      })
      .addCase(getNovelChaptersList.rejected, (state, action) => {
        state.loadingDropdownChapters = false; state.errorDropdownChapters = action.payload; state.chaptersForReadingPageDropdown = [];
      })

      // getChapterContentById
      .addCase(getChapterContentById.pending, (state) => { state.loadingSpecificContent = true; state.errorSpecificContent = null; })
      .addCase(getChapterContentById.fulfilled, (state, action) => {
        state.loadingSpecificContent = false;
        state.currentChapterContent = action.payload; // action.payload là object chương đầy đủ content
        state.errorSpecificContent = null;

        // Đồng bộ state.chapters nếu getChapterContentById fetch dữ liệu mới có content
        // Điều này xảy ra khi action.meta.requestId của getChapterContentById khớp với một
        // action getAllChapters (được dispatch bên trong getChapterContentById)
        // Tuy nhiên, logic này có thể phức tạp. Đơn giản hơn là DetailPage luôn gọi getAllChapters với token nếu user login.
        // Hoặc ReadingPage sẽ trigger getAllChapters với token khi cần content.
        // Hiện tại, getAllChapters đã cập nhật state.chapters.
      })
      .addCase(getChapterContentById.rejected, (state, action) => {
        state.loadingSpecificContent = false; state.errorSpecificContent = action.payload; state.currentChapterContent = null;
      });
      // ... (extraReducers cho increaseChapterView, createChapter)
  },
});

export const { clearChapterState } = chapterSlice.actions;

// Selectors
export const selectAllChaptersForNovel = (state) => state.chapters.chapters;
export const selectChaptersForReadingDropdown = (state) => state.chapters.chaptersForReadingPageDropdown;
export const selectCurrentChapterContent = (state) => state.chapters.currentChapterContent;

export const selectLoadingAllChapters = (state) => state.chapters.loadingAllChapters;
export const selectErrorAllChapters = (state) => state.chapters.errorAllChapters;
export const selectLoadingDropdownChapters = (state) => state.chapters.loadingDropdownChapters;
export const selectErrorDropdownChapters = (state) => state.chapters.errorDropdownChapters;
export const selectLoadingSpecificContent = (state) => state.chapters.loadingSpecificContent;
export const selectErrorSpecificContent = (state) => state.chapters.errorSpecificContent;

export default chapterSlice.reducer;