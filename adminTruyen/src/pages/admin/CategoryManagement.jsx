import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createCategory, updateCategory, deleteCategory } from '../../redux/categorySlice';
import { Star, PencilLine, Trash, Plus, BookOpen, Tag, Users } from 'lucide-react';
import Select from 'react-select';
import { useTheme } from '../../context/ThemeContext';

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { categories, loading, error } = useSelector((state) => state.categories);
  const { novels } = useSelector((state) => state.novels);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [newCategory, setNewCategory] = useState({
    nameCategory: '',
    novels: [], // Sẽ lưu một mảng các ID của novel
  });

  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 5;

  // Tạo options cho react-select
  const novelOptions = novels?.map((novel) => ({
    value: novel.idNovel,
    label: novel.nameNovel,
  }));

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentCategoryId(null);
    setNewCategory({ nameCategory: '', novels: [] });
  };

  const handleAddNewClick = () => {
    resetForm(); // Đảm bảo form sạch sẽ
    setShowForm(true);
  };

  const handleEditClick = (category) => {
    setIsEditing(true);
    setCurrentCategoryId(category.idCategory);
    setNewCategory({
      nameCategory: category.nameCategory || '',
      // Đảm bảo novels là một mảng ID, kể cả khi category.novels là null/undefined
      novels: Array.isArray(category.novels) ? category.novels.map(n => n.idNovel) : [],
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thể loại này?')) {
      dispatch(deleteCategory(id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Payload cần được định dạng theo yêu cầu của backend
    // Giả sử backend cần key là `idNovels` cho mảng ID
    const payload = {
      nameCategory: newCategory.nameCategory,
      // novels: newCategory.novels,
    };

    if (isEditing) {
      // Khi update, ta cần gửi cả id của category
      const updatePayload = { ...payload, idCategory: currentCategoryId };
      dispatch(updateCategory(updatePayload));
    } else {
      dispatch(createCategory(payload));
    }
    
    resetForm();
  };

  // Pagination logic
  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);
  const totalPages = Math.ceil(categories.length / categoriesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-red-900 flex items-center justify-center">
      <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl rounded-2xl p-8 border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">Lỗi: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 transition-all duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 bg-clip-text text-transparent mb-3">
              Quản Lý Thể Loại
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Quản lý các thể loại truyện một cách dễ dàng
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Thể Loại</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{categories.length}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <Tag className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Truyện</p>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{novels.length}</p>
              </div>
              <div className="p-3 bg-teal-100 dark:bg-teal-900/50 rounded-xl">
                <BookOpen className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Trung Bình</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {categories.length > 0 ? Math.round(novels.length / categories.length) : 0}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Truyện/Thể loại</p>
              </div>
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl">
                <Users className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Category Button */}
        <div className="mb-8">
          <button
            onClick={handleAddNewClick}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Thêm Thể Loại
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={resetForm}></div>
            <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {isEditing ? 'Chỉnh Sửa Thể Loại' : 'Tạo Thể Loại Mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="nameCategory" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tên Thể Loại
                    </label>
                    <input
                      id="nameCategory"
                      type="text"
                      value={newCategory.nameCategory}
                      onChange={(e) => setNewCategory({ ...newCategory, nameCategory: e.target.value })}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-emerald-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      required
                      placeholder="Nhập tên thể loại..."
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? (isEditing ? "Đang cập nhật..." : "Đang tạo...") : (isEditing ? "Lưu Thay Đổi" : "Tạo Thể Loại")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Categories Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Danh Sách Thể Loại
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-200/50 dark:border-slate-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tên Thể Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="3" className="text-center p-8">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        <span className="text-slate-600 dark:text-slate-300">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && currentCategories.length > 0 ? (
                  currentCategories.map((category, index) => (
                    <tr key={category.idCategory} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-emerald-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {indexOfFirstCategory + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{category.nameCategory}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(category)} 
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                            title="Chỉnh sửa"
                          >
                            <PencilLine size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(category.idCategory)} 
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                            title="Xóa"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  !loading && (
                    <tr>
                      <td colSpan="3" className="text-center p-8">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                            <Tag className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">Không có thể loại nào.</p>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center p-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-2 flex items-center gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Trước
                </button>
                <span className="px-6 py-2 text-slate-700 dark:text-slate-300 font-medium">
                  Trang {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;