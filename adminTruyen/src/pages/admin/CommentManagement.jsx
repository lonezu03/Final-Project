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

const CommentManagement = () => {
  const dispatch = useDispatch();
  
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

  // Handle search
  const handleSearch = (value) => {
    dispatch(setSearchQuery(value));
  };

  // Handle filter change
  const handleFilterChange = (type) => {
    dispatch(setFilterType(type));
    dispatch(clearComments());
    setSelectedUserId('');
    setSelectedNovelId('');
    setSelectedChapterId('');
  };

  // Load comments by user
  const handleLoadByUser = () => {
    if (selectedUserId) {
      dispatch(getAllCommentsByUser(selectedUserId));
    }
  };

  // Load comments by novel
  const handleLoadByNovel = () => {
    if (selectedNovelId) {
      dispatch(searchCommentsByNovel({ idNovel: selectedNovelId }));
    }
  };

  // Load comments by chapter
  const handleLoadByChapter = () => {
    if (selectedChapterId) {
      dispatch(getAllCommentsByChapter(selectedChapterId));
    }
  };

  // Handle delete comment
  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (commentToDelete) {
      try {
        await dispatch(deleteComment(commentToDelete.idComment)).unwrap();
        setShowDeleteDialog(false);
        setCommentToDelete(null);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  // Clear all data
  const handleClearAll = () => {
    dispatch(clearComments());
    dispatch(clearErrors());
    setSelectedUserId('');
    setSelectedNovelId('');
    setSelectedChapterId('');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Check if any loading
  const isLoading = loadingByUser || loadingByNovel || loadingByChapter;
  
  // Check if any error
  const hasError = errorByUser || errorByNovel || errorByChapter || deleteError;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <MessageCircle className="mr-3" size={28} />
        Quản Lý Bình Luận
      </h1>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filter Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline mr-2" size={16} />
              Loại tìm kiếm
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'novel', label: 'Theo truyện', icon: Book },
                { value: 'chapter', label: 'Theo chương', icon: FileText }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange(value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                    filterType === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Icon className="mr-2" size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline mr-2" size={16} />
              Tìm kiếm
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm theo nội dung, tên người dùng, tên chương..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>

        {/* Specific Filter Controls */}
        {filterType !== 'all' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User Selection */}
              {filterType === 'user' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn người dùng
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn người dùng --</option>
                      {users?.map(user => (
                        <option key={user.idUser} value={user.idUser}>
                          {user.userNameUser} ({user.emailUser})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleLoadByUser}
                      disabled={!selectedUserId || isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                      {loadingByUser ? <RefreshCw className="animate-spin" size={16} /> : 'Tải'}
                    </button>
                  </div>
                </div>
              )}

              {/* Novel Selection */}
              {filterType === 'novel' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn truyện
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedNovelId}
                      onChange={(e) => setSelectedNovelId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                      {loadingByNovel ? <RefreshCw className="animate-spin" size={16} /> : 'Tải'}
                    </button>
                  </div>
                </div>
              )}

              {/* Chapter Selection */}
              {filterType === 'chapter' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID chương
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      placeholder="Nhập ID chương..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleLoadByChapter}
                      disabled={!selectedChapterId || isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                      {loadingByChapter ? <RefreshCw className="animate-spin" size={16} /> : 'Tải'}
                    </button>
                  </div>
                </div>
              )}

              {/* Clear All Button */}
              <div className="flex items-end">
                <button
                  onClick={handleClearAll}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center"
                >
                  <RefreshCw className="mr-2" size={16} />
                  Xóa tất cả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-red-800 font-medium mb-2">Có lỗi xảy ra:</h3>
          <ul className="text-red-600 text-sm space-y-1">
            {errorByUser && <li>• Lỗi tải bình luận người dùng: {errorByUser}</li>}
            {errorByNovel && <li>• Lỗi tải bình luận truyện: {errorByNovel}</li>}
            {errorByChapter && <li>• Lỗi tải bình luận chương: {errorByChapter}</li>}
            {deleteError && <li>• Lỗi xóa bình luận: {deleteError}</li>}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            Hiển thị {comments.length} trên {totalItems} bình luận
            {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
          </span>
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <RefreshCw className="animate-spin mr-2" size={16} />
              Đang tải...
            </div>
          )}
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chương
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tương tác
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.map((comment) => (
                <tr key={comment.idComment} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={comment.urlImage || defaultAvatar}
                          alt={comment.userName}
                          onError={(e) => {
                            e.target.src = defaultAvatar;
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {comment.userName || 'Ẩn danh'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {comment.idUser}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-3">
                        {comment.contentComment}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comment.titleChapter || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="text-green-600">👍 {comment.likeComment || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-red-600">👎 {comment.dislikeComment || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteClick(comment)}
                        disabled={deletingComment}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Xóa bình luận"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {comments.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có bình luận</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Không tìm thấy bình luận phù hợp.' : 'Chưa có bình luận nào để hiển thị.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-md">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, totalItems)}
                </span>
                {' '}trong{' '}
                <span className="font-medium">{totalItems}</span>
                {' '}kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Xác nhận xóa bình luận
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
                </p>
                {commentToDelete && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-left">
                    <p className="text-xs text-gray-600">Nội dung:</p>
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {commentToDelete.contentComment}
                    </p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setCommentToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deletingComment}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 flex items-center justify-center"
                  >
                    {deletingComment ? (
                      <RefreshCw className="animate-spin h-4 w-4" />
                    ) : (
                      'Xóa'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentManagement;