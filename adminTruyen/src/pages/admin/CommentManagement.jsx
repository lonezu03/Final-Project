import React, { useEffect, useState, useMemo } from 'react';
import defaultAvatar from '../../assets/profile-image.jpg';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getAllCommentsByUser, 
  searchCommentsByNovel, 
  searchCommentsByChapter,
  getAllCommentsByChapter, 
  deleteComment,
  setSearchQuery,
  setFilterType,
  setCurrentPage,
  clearComments,
  clearErrors
} from '../../redux/commentSlice';
import { getAllNovels } from '../../redux/novelSlice';
import { getalluser } from '../../redux/userSlice';
import { Search, Trash2, Eye, Filter, RefreshCw, MessageCircle, User, Book, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CommentManagement = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
  // Redux state
  const {
    loadingByUser,
    loadingByNovel, 
    loadingByChapter,
    loadingSearchByChapter,
    deletingComment,
    errorByUser,
    errorByNovel,
    errorByChapter,
    errorSearchByChapter,
    deleteError,
    searchQuery,
    filterType
  } = useSelector((state) => state.comments);
  
  const { comments, totalItems, totalPages, currentPage } = useSelector((state) => {
    // Chỉ lấy comments dựa trên filterType hiện tại
    switch (state.comments.filterType) {
      case 'novel':
        return {
          comments: state.comments.commentsByNovel || [],
          totalItems: state.comments.novelCommentsPaging.totalItems,
          totalPages: state.comments.novelCommentsPaging.totalPages,
          currentPage: state.comments.novelCommentsPaging.currentPage
        };
      case 'chapter':
        return {
          comments: state.comments.commentsByChapter || [],
          totalItems: state.comments.chapterCommentsPaging?.totalItems || 0,
          totalPages: state.comments.chapterCommentsPaging?.totalPages || 1,
          currentPage: state.comments.chapterCommentsPaging?.currentPage || 1
        };
      case 'user':
        return {
          comments: state.comments.commentsByUser || [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1
        };
      default:
        return {
          comments: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1
        };
    }
  });
  const { novels } = useSelector((state) => state.novels);
  const { users } = useSelector((state) => state.user);
  
  // Local state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedNovelId, setSelectedNovelId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [availableChapters, setAvailableChapters] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [currentPageLocal, setCurrentPageLocal] = useState(1);
  const [commentsPerPage, setCommentsPerPage] = useState(10);

  // Load initial data
  useEffect(() => {
    dispatch(getAllNovels());
    dispatch(getalluser());
  }, [dispatch]);

  // Update available chapters when novel is selected
  useEffect(() => {
    if (selectedNovelId && novels) {
      const selectedNovel = novels.find(novel => novel.idNovel === selectedNovelId);
      if (selectedNovel && selectedNovel.chapters) {
        setAvailableChapters(selectedNovel.chapters);
      } else {
        setAvailableChapters([]);
      }
      setSelectedChapterId(''); // Reset chapter selection
    }
  }, [selectedNovelId, novels]);

  // Handlers
  const handleFilterChange = (newFilterType) => {
    dispatch(setFilterType(newFilterType));
    dispatch(clearComments());
    setSelectedUserId('');
    setSelectedNovelId('');
    setSelectedChapterId('');
    setCurrentPageLocal(1); // Reset trang về 1
  };

  const handleSearch = (query) => {
    dispatch(setSearchQuery(query));
  };

  const handleLoadByUser = () => {
    if (selectedUserId) {
      dispatch(getAllCommentsByUser(selectedUserId));
    }
  };

  const handleLoadByNovel = () => {
    if (selectedNovelId) {
      // Clear comments trước khi load mới
      dispatch(clearComments());
      dispatch(searchCommentsByNovel({ idNovel: selectedNovelId, page: 0, size: 20 }));
    }
  };

  const handleLoadByChapter = () => {
    if (selectedChapterId) {
      // Clear comments trước khi load mới
      dispatch(clearComments());
      dispatch(searchCommentsByChapter({ idChapter: selectedChapterId, page: 0, size: 20 }));
    }
  };

  const handleDeleteComment = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (commentToDelete) {
      dispatch(deleteComment(commentToDelete.idComment));
      setShowDeleteDialog(false);
      setCommentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setCommentToDelete(null);
  };

  const formatDate = (dateString) => {
    try {
      // Nếu dateString là array (từ API response), chuyển đổi thành Date
      if (Array.isArray(dateString) && dateString.length >= 6) {
        // Format: [year, month, day, hour, minute, second, nanosecond]
        const [year, month, day, hour, minute, second] = dateString;
        const date = new Date(year, month - 1, day, hour, minute, second);
        // Cộng thêm 7 giờ cho timezone Việt Nam (UTC+7)
        date.setHours(date.getHours() + 7);
        return date.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      // Nếu là string thông thường
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Không rõ';
      }
      // Cộng thêm 7 giờ cho timezone Việt Nam (UTC+7)
      date.setHours(date.getHours() + 7);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Không rõ';
    }
  };

  // Helper function to flatten comments (including replies) - xử lý với recursive để hỗ trợ nested replies
  const flattenComments = (commentsData) => {
    // Kiểm tra nếu không có dữ liệu hoặc là array rỗng
    if (!commentsData || !Array.isArray(commentsData) || commentsData.length === 0) {
      return [];
    }
    
    let allComments = [];
    
    const processComment = (comment, parentId = null, level = 0) => {
      // Add main comment
      allComments.push({
        ...comment,
        isReply: level > 0,
        parentId: parentId,
        level: level
      });
      
      // Recursively process reply comments
      if (comment.replyComments && Array.isArray(comment.replyComments) && comment.replyComments.length > 0) {
        comment.replyComments.forEach(reply => {
          processComment(reply, comment.idComment, level + 1);
        });
      }
    };
    
    commentsData.forEach(comment => {
      processComment(comment);
    });
    
    return allComments;
  };

  // Filter comments based on search query
  const filteredComments = useMemo(() => {
    const flattened = flattenComments(comments);
    
    if (!searchQuery) return flattened;
    
    return flattened.filter(comment => 
      comment.contentComment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.idUser?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [comments, searchQuery]);

  // Phân trang
  const totalPagesLocal = Math.ceil(filteredComments.length / commentsPerPage);
  const startIndex = (currentPageLocal - 1) * commentsPerPage;
  const endIndex = startIndex + commentsPerPage;
  const paginatedComments = filteredComments.slice(startIndex, endIndex);

  // Reset page khi search
  useEffect(() => {
    setCurrentPageLocal(1);
  }, [searchQuery]);

  // Reset page khi comments thay đổi
  useEffect(() => {
    setCurrentPageLocal(1);
  }, [comments]);

  // Clear search khi đổi filter type
  useEffect(() => {
    dispatch(setSearchQuery(''));
  }, [filterType, dispatch]);

  // Hàm chuyển trang
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPagesLocal) {
      setCurrentPageLocal(page);
    }
  };

  // Hàm tạo số trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPagesLocal <= maxPagesToShow) {
      for (let i = 1; i <= totalPagesLocal; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPageLocal - 2);
      const end = Math.min(totalPagesLocal, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };
  // Check if any loading
  const isLoading = loadingByUser || loadingByNovel || loadingByChapter || loadingSearchByChapter;
  
  // Check if any error
  const hasError = errorByUser || errorByNovel || errorByChapter || deleteError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Quản Lý Bình Luận
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Quản lý và kiểm duyệt bình luận người dùng</p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
          {/* Filter Type Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Filter size={16} />
              Loại tìm kiếm
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'novel', label: 'Theo truyện', icon: Book },
                { value: 'chapter', label: 'Theo chương', icon: FileText }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    filterType === value 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Search size={16} />
              Tìm kiếm
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm theo nội dung, tên người dùng, tên chương..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500"
                />
                <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Hiển thị:
                </label>
                <select
                  value={commentsPerPage}
                  onChange={(e) => {
                    setCommentsPerPage(Number(e.target.value));
                    setCurrentPageLocal(1);
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-slate-600 dark:text-slate-400">/ trang</span>
              </div>
            </div>
          </div>

          {/* Novel Selection */}
          {filterType === 'novel' && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chọn truyện</label>
              <div className="flex gap-3">
                <select
                  value={selectedNovelId}
                  onChange={(e) => setSelectedNovelId(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Chọn truyện --</option>
                  {novels?.map(novel => (
                    <option key={novel.idNovel} value={novel.idNovel}>
                      {novel.nameNovel}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLoadByNovel}
                  disabled={!selectedNovelId || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:shadow-none flex items-center gap-2"
                >
                  {loadingByNovel ? <RefreshCw className="animate-spin" size={16} /> : 'Tải'}
                </button>
              </div>
            </div>
          )}

          {/* Chapter Selection */}
          {filterType === 'chapter' && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chọn truyện và chương</label>
              <div className="space-y-3">
                {/* Novel selection for chapter */}
                <select
                  value={selectedNovelId}
                  onChange={(e) => setSelectedNovelId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Chọn truyện trước --</option>
                  {novels?.map(novel => (
                    <option key={novel.idNovel} value={novel.idNovel}>
                      {novel.nameNovel}
                    </option>
                  ))}
                </select>
                
                {/* Chapter selection */}
                {selectedNovelId && (
                  <div className="flex gap-3">
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Chọn chương --</option>
                      {availableChapters?.map(chapter => (
                        <option key={chapter.idChapter} value={chapter.idChapter}>
                          {chapter.titleChapter}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleLoadByChapter}
                      disabled={!selectedChapterId || isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-green-500/25 disabled:shadow-none flex items-center gap-2"
                    >
                      {loadingByChapter ? <RefreshCw className="animate-spin" size={16} /> : 'Tải'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comments Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-700/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Nội dung</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Loại</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thời gian</th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="animate-spin text-blue-500" size={20} />
                        <span className="text-slate-600 dark:text-slate-400">Đang tải bình luận...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {searchQuery ? 'Không tìm thấy bình luận nào khớp với tìm kiếm' : 'Không có bình luận nào'}
                    </td>
                  </tr>
                ) : (
                  paginatedComments.map((comment) => (
                    <tr key={comment.idComment} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-150 ${comment.isReply ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={comment.urlImage || defaultAvatar}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-600"
                          />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {comment.userName || 'N/A'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              ID: {comment.idUser || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="space-y-2">
                          <div className="truncate text-slate-700 dark:text-slate-300" title={comment.contentComment}>
                            {comment.contentComment}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              👍 {comment.likeComment || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              👎 {comment.dislikeComment || 0}
                            </span>
                            {comment.replyComments && comment.replyComments.length > 0 && (
                              <span className="flex items-center gap-1">
                                💬 {comment.replyComments.length} replies
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          {comment.isReply && (
                            <>
                              <span className="text-blue-500">↳</span>
                              <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                Reply
                              </span>
                            </>
                          )}
                          {!comment.isReply && (
                            <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                              Comment
                            </span>
                          )}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="text-sm">
                          {comment.dateCreate ? formatDate(comment.dateCreate) : 'Không rõ'}
                        </div>
                      </td> */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteComment(comment)}
                          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors duration-200"
                          title="Xóa bình luận"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {paginatedComments.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Không tìm thấy bình luận nào phù hợp.' : 'Chưa có bình luận nào.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPagesLocal > 1 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredComments.length)} của {filteredComments.length} kết quả
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPageLocal - 1)}
                  disabled={currentPageLocal === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPageLocal === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                  }`}
                >
                  Trước
                </button>

                {/* Page Numbers */}
                {getPageNumbers()[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300 transition-all duration-200"
                    >
                      1
                    </button>
                    {getPageNumbers()[0] > 2 && (
                      <span className="px-2 py-2 text-slate-500 dark:text-slate-400">...</span>
                    )}
                  </>
                )}

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPageLocal === page
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {getPageNumbers()[getPageNumbers().length - 1] < totalPagesLocal && (
                  <>
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPagesLocal - 1 && (
                      <span className="px-2 py-2 text-slate-500 dark:text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPagesLocal)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300 transition-all duration-200"
                    >
                      {totalPagesLocal}
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPageLocal + 1)}
                  disabled={currentPageLocal === totalPagesLocal}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPageLocal === totalPagesLocal
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                  }`}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng số bình luận</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{filteredComments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Comments chính</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredComments.filter(comment => !comment.isReply).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Replies</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredComments.filter(comment => comment.isReply).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Hiển thị trang</h3>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {currentPageLocal} / {totalPagesLocal || 1}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteDialog && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-md p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Xác nhận xóa
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Bạn có chắc chắn muốn xóa bình luận này?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingComment}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                >
                  {deletingComment ? <RefreshCw className="animate-spin" size={16} /> : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentManagement;
