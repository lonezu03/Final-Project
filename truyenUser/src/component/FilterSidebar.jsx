// src/components/FilterSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Filter as FilterIcon, Star as StarIcon } from 'lucide-react'; // Icon cho nút đóng và filter
import { getAllAuthors } from '../redux/authorSlice'; // Điều chỉnh đường dẫn nếu cần
import { getAllCategories } from '../redux/categorySlice'; // Điều chỉnh đường dẫn nếu cần
// Import action searchNovels từ novelSlice
import { searchNovels, clearSearchedNovels } from '../redux/novelSlice';
import { useNavigate } from 'react-router-dom';

const FilterSidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy danh sách tác giả và thể loại từ store
  const { authors, loading: authorsLoading, error: authorsError } = useSelector((state) => state.authors);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);

  // State cho các giá trị filter được chọn
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0); // 0 nghĩa là không lọc theo rating

  // Fetch authors và categories khi component mount (nếu chưa có)
  useEffect(() => {
    if (!authors || authors.length === 0) {
      dispatch(getAllAuthors());
    }
    if (!categories || categories.length === 0) {
      dispatch(getAllCategories());
    }
  }, [dispatch, authors, categories]);

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
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out">
        <div className="absolute top-0 right-0 pt-2 pr-2">
          <button
            type="button"
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="px-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bộ lọc truyện</h2>

            {/* Lọc theo Tác giả */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tác giả</h3>
              {authorsLoading && <p className="text-xs text-gray-500">Đang tải tác giả...</p>}
              {authorsError && <p className="text-xs text-red-500">Lỗi tải tác giả.</p>}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {authors && authors.map(author => (
                  <label key={author.idAuthor} className="flex items-center text-sm text-gray-600 dark:text-gray-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      value={author.nameAuthor}
                      checked={selectedAuthors.includes(author.nameAuthor)}
                      onChange={() => handleAuthorChange(author.nameAuthor)}
                    />
                    <span className="ml-2 truncate">{author.nameAuthor}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lọc theo Thể loại */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thể loại</h3>
              {categoriesLoading && <p className="text-xs text-gray-500">Đang tải thể loại...</p>}
              {categoriesError && <p className="text-xs text-red-500">Lỗi tải thể loại.</p>}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {categories && categories.map(category => (
                  <label key={category.idCategory} className="flex items-center text-sm text-gray-600 dark:text-gray-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      value={category.nameCategory}
                      checked={selectedCategories.includes(category.nameCategory)}
                      onChange={() => handleCategoryChange(category.nameCategory)}
                    />
                    <span className="ml-2 truncate">{category.nameCategory}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lọc theo Rating */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Đánh giá (từ)</h3>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className={`p-1 rounded-full ${selectedRating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'} hover:text-yellow-500`}
                    title={`${star} sao`}
                  >
                    <StarIcon fill={selectedRating >= star ? "currentColor" : "none"} size={20} />
                  </button>
                ))}
              </div>
              {selectedRating > 0 && (
                <button
                  onClick={() => handleRatingChange(0)}
                  className="mt-1 text-xs text-blue-500 hover:underline"
                >
                  Bỏ chọn rating
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nút Áp dụng và Reset */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Áp dụng bộ lọc
            </button>
            <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Đặt lại bộ lọc
            </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;