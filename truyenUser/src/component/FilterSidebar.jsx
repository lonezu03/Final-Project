// src/components/FilterSidebar.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Filter as FilterIcon, Star as StarIcon } from 'lucide-react'; // Icon cho nút đóng và filter
// Import action searchNovels từ novelSlice
import { searchNovels, clearSearchedNovels } from '../redux/novelSlice';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const FilterSidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Lấy danh sách tác giả và thể loại từ store (đã được load trong App.jsx)
  const { authors, loading: authorsLoading, error: authorsError } = useSelector((state) => state.authors);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);

  // State cho các giá trị filter được chọn
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0); // 0 nghĩa là không lọc theo rating

  // Không cần useEffect để fetch dữ liệu nữa vì đã load trong App.jsx

  const handleAuthorChange = (authorName) => {
    setSelectedAuthors(prev =>
      prev.includes(authorName)
        ? prev.filter(name => name !== authorName)
        : [...prev, authorName]
    );
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleRatingChange = (rating) => {
    setSelectedRating(rating === selectedRating ? 0 : rating); // Click lại để bỏ chọn
  };

  const handleApplyFilters = () => {
    const searchCriteria = {};
    if (selectedAuthors.length > 0) {
      searchCriteria.authorNames = selectedAuthors;
    }
    if (selectedCategories.length > 0) {
      searchCriteria.categoryNames = selectedCategories;
    }
    if (selectedRating > 0) {
      searchCriteria.ratingGreaterThanOrEqual = selectedRating;
    }
    // Bạn có thể thêm các tiêu chí khác như nameNovel, statuses, etc. nếu có input cho chúng

    const paginationAndSortParams = {
      page: 0, // Luôn bắt đầu từ trang 0 khi áp dụng filter mới
      size: 20, // Hoặc một giá trị mặc định/lấy từ state khác
      // sort: 'rating,desc' // Ví dụ sắp xếp mặc định khi filter
    };

    console.log("Applying filters:", { searchCriteria, paginationAndSortParams });
    dispatch(clearSearchedNovels()); // Xóa kết quả cũ
    dispatch(searchNovels({ searchCriteria, paginationAndSortParams }));
    onClose(); // Đóng sidebar sau khi áp dụng
    // Điều hướng đến trang kết quả tìm kiếm nếu bạn muốn
    // Tạo query string từ các filter đã chọn
    const queryParts = [];
    if (searchCriteria.authorNames) queryParts.push(`authors=${searchCriteria.authorNames.map(encodeURIComponent).join(',')}`);
    if (searchCriteria.categoryNames) queryParts.push(`categories=${searchCriteria.categoryNames.map(encodeURIComponent).join(',')}`);
    if (searchCriteria.ratingGreaterThanOrEqual) queryParts.push(`rating=${searchCriteria.ratingGreaterThanOrEqual}`);

    navigate(`/search-results${queryParts.length > 0 ? '?' + queryParts.join('&') : ''}`);
  };

  const handleResetFilters = () => {
    setSelectedAuthors([]);
    setSelectedCategories([]);
    setSelectedRating(0);
    // Có thể dispatch searchNovels với criteria rỗng để hiển thị tất cả (hoặc một hành động khác)
    // dispatch(clearSearchedNovels());
    // dispatch(searchNovels({ searchCriteria: {}, paginationAndSortParams: { page: 0, size: 20 } }));
    // onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      {/* Sidebar */}
      <div className={`relative flex-1 flex flex-col max-w-xs w-full shadow-xl transform transition-all duration-300 ease-in-out ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-gray-600' 
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
      }`}>
        <div className="absolute top-0 right-0 pt-2 pr-2">
          <button
            type="button"
            className={`p-1 rounded-md focus:outline-none focus:ring-2 transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 focus:ring-blue-400' 
                : 'text-gray-500 hover:text-gray-700 focus:ring-blue-500'
            }`}
            onClick={onClose}
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="px-4">
            <h2 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Bộ lọc truyện</h2>

            {/* Lọc theo Tác giả */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Tác giả</h3>
              {authorsLoading && <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Đang tải tác giả...</p>}
              {authorsError && <p className="text-xs text-red-500">Lỗi tải tác giả.</p>}
              <div className={`max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar ${
                isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
              }`}>
                {authors && authors.map(author => (
                  <label key={author.idAuthor} className={`flex items-center text-sm cursor-pointer p-2 rounded-md transition-colors hover:bg-opacity-50 ${
                    isDarkMode 
                      ? 'text-gray-200 hover:bg-slate-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded focus:ring-2 transition-colors ${
                        isDarkMode 
                          ? 'text-blue-500 bg-slate-700 border-gray-600 focus:ring-blue-400' 
                          : 'text-blue-600 bg-white border-gray-300 focus:ring-blue-500'
                      }`}
                      value={author.nameAuthor}
                      checked={selectedAuthors.includes(author.nameAuthor)}
                      onChange={() => handleAuthorChange(author.nameAuthor)}
                    />
                    <span className="ml-3 truncate">{author.nameAuthor}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lọc theo Thể loại */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Thể loại</h3>
              {categoriesLoading && <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Đang tải thể loại...</p>}
              {categoriesError && <p className="text-xs text-red-500">Lỗi tải thể loại.</p>}
              <div className={`max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar ${
                isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
              }`}>
                {categories && categories.map(category => (
                  <label key={category.idCategory} className={`flex items-center text-sm cursor-pointer p-2 rounded-md transition-colors hover:bg-opacity-50 ${
                    isDarkMode 
                      ? 'text-gray-200 hover:bg-slate-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded focus:ring-2 transition-colors ${
                        isDarkMode 
                          ? 'text-blue-500 bg-slate-700 border-gray-600 focus:ring-blue-400' 
                          : 'text-blue-600 bg-white border-gray-300 focus:ring-blue-500'
                      }`}
                      value={category.nameCategory}
                      checked={selectedCategories.includes(category.nameCategory)}
                      onChange={() => handleCategoryChange(category.nameCategory)}
                    />
                    <span className="ml-3 truncate">{category.nameCategory}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lọc theo Rating */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Đánh giá (từ)</h3>
              <div className="flex space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      selectedRating >= star 
                        ? 'text-yellow-400 hover:text-yellow-300' 
                        : (isDarkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500')
                    }`}
                    title={`${star} sao`}
                  >
                    <StarIcon fill={selectedRating >= star ? "currentColor" : "none"} size={20} />
                  </button>
                ))}
              </div>
              {selectedRating > 0 && (
                <button
                  onClick={() => handleRatingChange(0)}
                  className={`text-xs hover:underline transition-colors ${
                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
                  }`}
                >
                  Bỏ chọn rating
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nút Áp dụng và Reset */}
        <div className={`flex-shrink-0 px-4 py-4 border-t space-y-3 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
            <button
                onClick={handleApplyFilters}
                className={`w-full px-4 py-3 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400' 
                    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                }`}
            >
                Áp dụng bộ lọc
            </button>
            <button
                onClick={handleResetFilters}
                className={`w-full px-4 py-3 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 border ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-200 hover:bg-slate-700 focus:ring-gray-500' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400'
                }`}
            >
                Đặt lại bộ lọc
            </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;