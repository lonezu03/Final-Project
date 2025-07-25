import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

const apiPath = "/comment";

// --- ASYNC THUNKS ---

// Lấy tất cả bình luận theo người dùng
export const getAllCommentsByUser = createAsyncThunk(
  'comments/getAllByUser',
  async (idUser, { rejectWithValue }) => {
    try {
      console.log('Fetching comments for user:', idUser);
      const response = await apiClient.get(`${apiPath}/getAllByUser/${idUser}`);
      
      if (response.data && response.data.code === 1000) {
        return response.data.result || [];
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách bình luận của người dùng.');
    } catch (error) {
      console.error('Get comments by user error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải bình luận theo người dùng.');
    }
  }
);


// Tìm kiếm bình luận theo truyện (POST /comment/search)
export const searchCommentsByNovel = createAsyncThunk(
  'comments/searchByNovel',
  async ({ idNovel }, { rejectWithValue }) => {
    try {
      const body = {
        idNovel,
       
      };
      const response = await apiClient.post(`/comment/search`, body);
      if (response.data && response.data.content) {
        // Trả về mảng bình luận và thông tin phân trang
        return {
          comments: response.data.content,
          totalItems: response.data.totalElements,
          totalPages: response.data.totalPages,
          currentPage: response.data.pageable?.pageNumber + 1 || page
        };
      }
      return rejectWithValue(response.data?.message || 'Không thể tìm kiếm bình luận của truyện.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tìm kiếm bình luận theo truyện.');
    }
  }
);

// Lấy tất cả bình luận theo chương
export const getAllCommentsByChapter = createAsyncThunk(
  'comments/getAllByChapter',
  async (idChapter, { rejectWithValue }) => {
    try {
      console.log('Fetching comments for chapter:', idChapter);
      const response = await apiClient.get(`${apiPath}/getAllByChapter/${idChapter}`);
      
      if (response.data && response.data.code === 1000) {
        return response.data.result || [];
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách bình luận của chương.');
    } catch (error) {
      console.error('Get comments by chapter error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải bình luận theo chương.');
    }
  }
);

// Xóa bình luận
export const deleteComment = createAsyncThunk(
  'comments/delete',
  async (idComment, { rejectWithValue }) => {
    try {
      console.log('Deleting comment:', idComment);
      const response = await apiClient.delete(`${apiPath}/${idComment}`);
      
      if (response.data && response.data.code === 1000) {
        return { idComment, result: response.data.result };
      }
      return rejectWithValue(response.data?.message || 'Không thể xóa bình luận.');
    } catch (error) {
      console.error('Delete comment error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi xóa bình luận.');
    }
  }
);

// --- SLICE DEFINITION ---

const initialState = {
  // Comments data
  commentsByUser: [],
  commentsByNovel: [],
  novelCommentsPaging: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20,
  },
  commentsByChapter: [],
  
  // Loading states
  loadingByUser: false,
  loadingByNovel: false,
  loadingByChapter: false,
  deletingComment: false,
  
  // Error states
  errorByUser: null,
  errorByNovel: null,
  errorByChapter: null,
  deleteError: null,
  
  // Search and filter states
  searchQuery: '',
  filterType: 'all', // 'all', 'user', 'novel', 'chapter'
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 10,
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    // Search and filter reducers
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when searching
    },
    
    setFilterType: (state, action) => {
      state.filterType = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },
    
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    clearComments: (state) => {
      state.commentsByUser = [];
      state.commentsByNovel = [];
      state.commentsByChapter = [];
    },
    
    clearErrors: (state) => {
      state.errorByUser = null;
      state.errorByNovel = null;
      state.errorByChapter = null;
      state.deleteError = null;
    }
  },
  extraReducers: (builder) => {
    // Helper functions
    const handlePending = (state, loadingField) => {
      state[loadingField] = true;
    };
    
    const handleRejected = (state, action, loadingField, errorField) => {
      state[loadingField] = false;
      state[errorField] = action.payload;
    };

    builder
      // GET ALL BY USER
      .addCase(getAllCommentsByUser.pending, (state) => {
        handlePending(state, 'loadingByUser');
        state.errorByUser = null;
      })
      .addCase(getAllCommentsByUser.fulfilled, (state, action) => {
        state.loadingByUser = false;
        state.commentsByUser = action.payload;
      })
      .addCase(getAllCommentsByUser.rejected, (state, action) => {
        handleRejected(state, action, 'loadingByUser', 'errorByUser');
      })

      // SEARCH COMMENTS BY NOVEL
      .addCase(searchCommentsByNovel.pending, (state) => {
        handlePending(state, 'loadingByNovel');
        state.errorByNovel = null;
      })
      .addCase(searchCommentsByNovel.fulfilled, (state, action) => {
        state.loadingByNovel = false;
        state.commentsByNovel = action.payload.comments;
        state.novelCommentsPaging = {
          totalItems: action.payload.totalItems,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          itemsPerPage: 20,
        };
      })
      .addCase(searchCommentsByNovel.rejected, (state, action) => {
        handleRejected(state, action, 'loadingByNovel', 'errorByNovel');
      })

      // GET ALL BY CHAPTER
      .addCase(getAllCommentsByChapter.pending, (state) => {
        handlePending(state, 'loadingByChapter');
        state.errorByChapter = null;
      })
      .addCase(getAllCommentsByChapter.fulfilled, (state, action) => {
        state.loadingByChapter = false;
        state.commentsByChapter = action.payload;
      })
      .addCase(getAllCommentsByChapter.rejected, (state, action) => {
        handleRejected(state, action, 'loadingByChapter', 'errorByChapter');
      })

      // DELETE COMMENT
      .addCase(deleteComment.pending, (state) => {
        state.deletingComment = true;
        state.deleteError = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.deletingComment = false;
        const { idComment } = action.payload;
        
        // Remove comment from all arrays
        state.commentsByUser = state.commentsByUser.filter(comment => comment.idComment !== idComment);
        state.commentsByNovel = state.commentsByNovel.filter(comment => comment.idComment !== idComment);
        state.commentsByChapter = state.commentsByChapter.filter(comment => comment.idComment !== idComment);
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.deletingComment = false;
        state.deleteError = action.payload;
      });
  }
});

// Export actions
export const {
  setSearchQuery,
  setFilterType,
  setCurrentPage,
  clearComments,
  clearErrors
} = commentSlice.actions;

// Selectors
export const selectFilteredComments = (state) => {
  const { searchQuery, filterType } = state.comments;
  let allComments = [];
  
  // Combine all comments based on filter type
  switch (filterType) {
    case 'user':
      allComments = state.comments.commentsByUser;
      break;
    case 'novel':
      allComments = state.comments.commentsByNovel;
      break;
    case 'chapter':
      allComments = state.comments.commentsByChapter;
      break;
    default:
      // Combine all comments with unique IDs
      const userComments = state.comments.commentsByUser || [];
      const novelComments = state.comments.commentsByNovel || [];
      const chapterComments = state.comments.commentsByChapter || [];
      
      const commentMap = new Map();
      [...userComments, ...novelComments, ...chapterComments].forEach(comment => {
        commentMap.set(comment.idComment, comment);
      });
      
      allComments = Array.from(commentMap.values());
  }
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    allComments = allComments.filter(comment => 
      (comment.contentComment && comment.contentComment.toLowerCase().includes(query)) ||
      (comment.userName && comment.userName.toLowerCase().includes(query)) ||
      (comment.titleChapter && comment.titleChapter.toLowerCase().includes(query))
    );
  }
  
  return allComments;
};

export const selectPaginatedComments = (state) => {
  const comments = selectFilteredComments(state);
  const { currentPage, itemsPerPage } = state.comments;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    comments: comments.slice(startIndex, endIndex),
    totalItems: comments.length,
    totalPages: Math.ceil(comments.length / itemsPerPage),
    currentPage,
    itemsPerPage
  };
};

export default commentSlice.reducer;
