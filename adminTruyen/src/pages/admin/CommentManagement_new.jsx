import React, { useEffect, useState } from 'react';
import defaultAvatar from '../../assets/profile-image.jpg';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getAllCommentsByUser, 
  searchCommentsByNovel, 
  getAllCommentsByChapter, 
  deleteComment,
  setSearchQuery,
  setFilterType,
  setCurrentPage,
  clearComments,
  clearErrors,
  selectPaginatedComments
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
    deletingComment,
    errorByUser,
    errorByNovel,
    errorByChapter,
    deleteError,
    searchQuery,
    filterType
  } = useSelector((state) => state.comments);
  
  const { comments, totalItems, totalPages, currentPage } = useSelector(selectPaginatedComments);
  const { novels } = useSelector((state) => state.novels);
  const { users } = useSelector((state) => state.user);
  
  // Local state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedNovelId, setSelectedNovelId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Load initial data
  useEffect(() => {
    dispatch(getAllNovels());
    dispatch(getalluser());
  }, [dispatch]);

  // Handlers
  const handleFilterChange = (newFilterType) => {
    dispatch(setFilterType(newFilterType));
    dispatch(clearComments());
    setSelectedUserId('');
    setSelectedNovelId('');
    setSelectedChapterId('');
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
      dispatch(searchCommentsByNovel(selectedNovelId));
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
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return 'Không rõ';
    }
  };

  // Check if any loading
  const isLoading = loadingByUser || loadingByNovel || loadingByChapter;
  
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
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm theo nội dung, tên người dùng, tên chương..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500"
              />
              <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
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
        </div>

        {/* Comments Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-700/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Nội dung</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày tạo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="animate-spin text-blue-500" size={20} />
                        <span className="text-slate-600 dark:text-slate-400">Đang tải bình luận...</span>
                      </div>
                    </td>
                  </tr>
                ) : comments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      Không có bình luận nào
                    </td>
                  </tr>
                ) : (
                  comments.map((comment) => (
                    <tr key={comment.idComment} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={comment.user?.avatar || defaultAvatar}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-600"
                          />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {comment.user?.userNameUser || 'N/A'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {comment.user?.emailUser || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="truncate text-slate-700 dark:text-slate-300" title={comment.content}>
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {formatDate(comment.createdAt)}
                      </td>
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
