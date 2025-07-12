// src/redux/commentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../services/api';
import { rooturl } from './element'; // Import đường dẫn gốc từ file element
const API_BASE_URL_COMMENT_PUBLIC = `${rooturl}/comment`;

// --- API THUNKS ---

// GET /comment/getAllByChapter/{idChapter}
export const getCommentsByChapter = createAsyncThunk(
  'comments/getByChapter',
  async (idChapter, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL_COMMENT_PUBLIC}/getAllByChapter/${idChapter}`);
      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        return response.data.result;
      }
      return rejectWithValue(response.data.message || 'Failed to fetch comments by chapter');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Error fetching comments');
    }
  }
);

// GET /comment/getAllByNovel/{idNovel}
export const getCommentsByNovel = createAsyncThunk(
  'comments/getByNovel',
  async (idNovel, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL_COMMENT_PUBLIC}/getAllByNovel/${idNovel}`);
      if (response.data && response.data.code === 1000 && Array.isArray(response.data.result)) {
        return response.data.result;
      }
      return rejectWithValue(response.data.message || 'Failed to fetch comments by novel');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Error fetching comments by novel');
    }
  }
);

// POST /comment/create
export const createComment = createAsyncThunk(
  'comments/create',
  // Thay đổi tên từ parentIdComment thành idParent để khớp với backend
  async ({ contentComment, idUser, idChapter, idParent = null }, { rejectWithValue }) => {
    try {
      const payload = {
        contentComment,
        user: idUser,    // API yêu cầu trường 'user' với giá trị là idUser (string)
        chapter: idChapter // API yêu cầu trường 'chapter' với giá trị là idChapter (number)
      };

      // Nếu idParent được cung cấp (nghĩa là đây là một reply), thêm nó vào payload
      if (idParent !== null && idParent !== undefined) {
        payload.idParent = idParent; // Backend của bạn sử dụng trường 'idParent'
      }
      console.log("Payload gửi đi cho /comment/create:", JSON.stringify(payload, null, 2));

      const response = await apiClient.post(`/comment/create`, payload);

      if (response.data && (response.data.code === 200 || response.data.code === 1000) && response.data.result) {
        // Trả về comment mới (bao gồm cả idParent nếu là reply và backend trả về)
        return response.data.result;
      }
      console.error("Create comment API response không như mong đợi:", response.data);
      return rejectWithValue(response.data?.message || 'Không thể tạo bình luận do phản hồi không hợp lệ từ server.');
    } catch (error) {
      console.error("Lỗi khi tạo bình luận:", error.response?.data || error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Chưa được xác thực. Vui lòng đăng nhập để bình luận.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tạo bình luận.');
    }
  }
);
const findAndUpdateComment = (comments, updatedComment) => {
  return comments.map(comment => {
    if (comment.idComment === updatedComment.idComment) {
      return { ...comment, ...updatedComment }; // Ghi đè comment cũ bằng comment mới từ API
    }
    if (comment.replyComments && comment.replyComments.length > 0) {
      return {
        ...comment,
        replyComments: findAndUpdateComment(comment.replyComments, updatedComment),
      };
    }
    return comment;
  });
};

// Hàm đệ quy để tìm và xóa một comment
const findAndDeleteComment = (comments, commentIdToDelete) => {
  return comments.filter(comment => {
    if (comment.idComment === commentIdToDelete) {
      return false; // Loại bỏ comment này
    }
    if (comment.replyComments && comment.replyComments.length > 0) {
      comment.replyComments = findAndDeleteComment(comment.replyComments, commentIdToDelete);
    }
    return true;
  });
};

// Hàm đệ quy để thêm một reply vào đúng comment cha
const findAndAddReply = (comments, parentId, newReply) => {
    return comments.map(comment => {
        if (String(comment.idComment) === String(parentId)) {
            const newReplyComments = [newReply, ...(comment.replyComments || [])];
            return { ...comment, replyComments: newReplyComments };
        }
        if (comment.replyComments) {
            return { ...comment, replyComments: findAndAddReply(comment.replyComments, parentId, newReply) };
        }
        return comment;
    });
};
// PUT /comment/update
export const updateCommentContent = createAsyncThunk(
  'comments/updateContent',
  async ({ existingComment, newContent, idUserPerformingUpdate, idChapterOfComment }, { rejectWithValue }) => {
    // existingComment là object comment hiện tại từ state
    // newContent là nội dung mới người dùng nhập
    // idUserPerformingUpdate là ID của người dùng đang thực hiện hành động sửa
    // idChapterOfComment là ID của chapter mà comment này thuộc về (cần cho payload API)
    try {
      if (!existingComment || !existingComment.idComment) {
        return rejectWithValue('Invalid existing comment data for update.');
      }
      if (!idChapterOfComment) {
        // Nếu idChapter không có trong existingComment, nó phải được truyền vào
        // Hoặc bạn có thể cố gắng lấy từ existingComment.chapter.idChapter nếu cấu trúc là vậy
        const chapterId = existingComment.chapter?.idChapter || idChapterOfComment;
        if (!chapterId) {
            return rejectWithValue('Chapter ID is missing for comment update.');
        }
      }


      const payload = {
        idComment: existingComment.idComment,
        contentComment: newContent,
        // Lấy giá trị like/dislike hiện tại từ existingComment, nếu không có thì mặc định là 0
        // likeComment: existingComment.likeComment || 0,
        // dislikeComment: existingComment.dislikeComment || 0,
        chapter: existingComment.chapter?.idChapter || idChapterOfComment, // API yêu cầu 'chapter' là idChapter (kiểu số)
        user: idUserPerformingUpdate // API yêu cầu 'user' là idUser (kiểu string) của người thực hiện
      };

      const response = await apiClient.put(`/comment/update`, payload);
      if (response.data && (response.data.code === 200 || response.data.code === 1000) && response.data.result) {
        return response.data.result; // API trả về comment đã được cập nhật
      }
      return rejectWithValue(response.data.message || 'Failed to update comment');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Unauthorized. Please login to update comment.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Error updating comment');
    }
  }
);

// PUT /comment/updatelike
export const likeComment = createAsyncThunk(
  'comments/like',
  async ({ idComment, idUser }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/comment/updatelike`, { idComment, idUser });
      if (response.data && (response.data.code === 200 || response.data.code === 1000) && response.data.result) {
        return response.data.result; // API trả về comment đã được cập nhật
      }
      return rejectWithValue(response.data.message || 'Failed to like comment');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Unauthorized. Please login to react.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Error liking comment');
    }
  }
);

// PUT /comment/updatedislike
export const dislikeComment = createAsyncThunk(
  'comments/dislike',
  async ({ idComment, idUser }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/comment/updatedislike`, { idComment, idUser });
      if (response.data && (response.data.code === 200 || response.data.code === 1000) && response.data.result) {
        return response.data.result; // API trả về comment đã được cập nhật
      }
      return rejectWithValue(response.data.message || 'Failed to dislike comment');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Unauthorized. Please login to react.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Error disliking comment');
    }
  }
);

// DELETE /comment/{idComment}
export const deleteComment = createAsyncThunk(
  'comments/delete',
  async (idComment, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/comment/${idComment}`);
      if (response.data && (response.data.code === 200 || response.data.code === 1000)) {
        return idComment;
      }
      return rejectWithValue(response.data.message || 'Failed to delete comment');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return rejectWithValue('Unauthorized. Please login to delete comment.');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Error deleting comment');
    }
  }
);

// POST /comment/search
export const searchComments = createAsyncThunk(
  'comments/search',
  async ({ searchCriteria, pageable }, { rejectWithValue }) => {
    // searchCriteria: { idChapter, parentOnly, ... }
    // pageable: { page, size, sort: ['...'] }
    try {
      // Xây dựng query string từ object pageable
      const params = new URLSearchParams();
      if (pageable) {
        params.append('page', pageable.page || 0);
        params.append('size', pageable.size || 10);
        if (pageable.sort && Array.isArray(pageable.sort)) {
            pageable.sort.forEach(sortRule => params.append('sort', sortRule));
        }
      }

      const queryString = `?${params.toString()}`;
      
      // apiClient sẽ tự động thêm baseURL
      const response = await apiClient.post(`/comment/search${queryString}`, searchCriteria);

      if (response.data) { // API search của bạn không có cấu trúc {code, message, result}
        return response.data; // Trả về toàn bộ object phân trang
      }
      return rejectWithValue('Dữ liệu tìm kiếm bình luận không hợp lệ.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tìm kiếm bình luận.');
    }
  }
);

const initialState = {
  commentsByChapter: [],
  loading: false,
  actionLoading: { // Loading riêng cho các action CUD và like/dislike
    create: false,
    update: false,
    delete: false,
    like: {}, // { [commentId]: boolean }
    dislike: {}, // { [commentId]: boolean }
  },
  error: null,
  comments: [], // Danh sách comment của trang hiện tại

 pagination: {
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    size: 10,
  },
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = [];
      state.pagination = initialState.pagination;
      state.error = null;
    },
    clearCommentError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true; // Dùng cho get operations
      state.error = null;
    };
    const handleRejected = (state, action) => {
      state.loading = false; // Dùng cho get operations
      state.error = action.payload || 'An error occurred';
    };

    // Helper function để cập nhật một comment trong mảng
    const updateCommentInList = (state, updatedComment) => {
      if (updatedComment && updatedComment.idComment) {
        const index = state.commentsByChapter.findIndex(comment => comment.idComment === updatedComment.idComment);
        if (index !== -1) {
          state.commentsByChapter[index] = updatedComment;
        }
      }
    };

    builder
      // Get Comments By Chapter
      .addCase(getCommentsByChapter.pending, handlePending)
      .addCase(getCommentsByChapter.fulfilled, (state, action) => {
        state.loading = false;
        state.commentsByChapter = action.payload;
      })
      .addCase(getCommentsByChapter.rejected, handleRejected)

      // Create Comment
      .addCase(createComment.pending, (state) => {
        state.actionLoading.create = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const newComment = action.payload; // Dữ liệu comment mới từ API
        const originalPayload = action.meta.arg; // Payload gốc đã gửi đi

        if (originalPayload.idParent) {
          // Đây là một REPLY.
          // Dùng hàm helper để tìm comment cha và chèn reply mới vào.
          state.comments = findAndAddReply(state.comments, originalPayload.idParent, newComment);
        } else {
          // Đây là một COMMENT GỐC.
          // Chỉ thêm vào đầu nếu đang ở trang 1.
          if (state.pagination.currentPage === 0) {
            state.comments.unshift(newComment);
            // Giữ số lượng comment trên trang không vượt quá page size
            if (state.comments.length > state.pagination.size) {
              state.comments.pop();
            }
          }
          // Luôn tăng tổng số lượng để pagination tính toán lại.
          state.pagination.totalElements += 1;
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.actionLoading.create = false;
        state.error = action.payload || 'Không thể tạo bình luận';
      })

      // Update Comment Content
      .addCase(updateCommentContent.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        state.comments = findAndUpdateComment(state.comments, updatedComment);
      })
      
      .addCase(updateCommentContent.rejected, (state, action) => {
        state.actionLoading.update = false;
        state.error = action.payload || 'Failed to update comment';
      })

      // Like Comment
      .addCase(likeComment.pending, (state, action) => {
        state.actionLoading.like[action.meta.arg.idComment] = true;
        state.error = null;
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        state.comments = findAndUpdateComment(state.comments, updatedComment);
      })
      .addCase(likeComment.rejected, (state, action) => {
        state.actionLoading.like[action.meta.arg.idComment] = false;
        state.error = action.payload || 'Failed to like comment';
      })

      // Dislike Comment
      .addCase(dislikeComment.pending, (state, action) => {
        state.actionLoading.dislike[action.meta.arg.idComment] = true;
        state.error = null;
      })
      .addCase(dislikeComment.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        state.comments = findAndUpdateComment(state.comments, updatedComment);
      })
      .addCase(dislikeComment.rejected, (state, action) => {
        state.actionLoading.dislike[action.meta.arg.idComment] = false;
        state.error = action.payload || 'Failed to dislike comment';
      })

      // Delete Comment
      .addCase(deleteComment.pending, (state, action) => {
        state.actionLoading.delete = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const deletedCommentId = action.payload;
        state.comments = findAndDeleteComment(state.comments, deletedCommentId);
        state.pagination.totalElements -= 1; // Giảm tổng số lượng
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.actionLoading.delete = false;
        state.error = action.payload || 'Failed to delete comment';
      })
        .addCase(searchComments.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload.content; // Lưu danh sách comment
        // Lưu thông tin phân trang
        state.pagination = {
            totalPages: action.payload.totalPages,
            totalElements: action.payload.totalElements,
            currentPage: action.payload.number, // API trả về 'number' cho trang hiện tại
            size: action.payload.size,
        };
      })
      .addCase(searchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.comments = [];
      });

      // Loại bỏ các addMatcher nếu đã xử lý riêng lẻ từng action
      // Nếu bạn vẫn muốn dùng addMatcher, đảm bảo nó không xung đột với các .addCase ở trên.
      // Hiện tại, tôi đã chuyển logic cập nhật vào từng .fulfilled của like, dislike, updateContent.
  },
});

export const { clearComments, clearCommentError } = commentSlice.actions;
export default commentSlice.reducer;