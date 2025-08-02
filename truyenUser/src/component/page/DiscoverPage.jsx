import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { searchNovels, getAllNovels } from '../../redux/novelSlice';
import NovelCard from '../NovelCard';
import Footer from '../Footer';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Loader2,
  BookOpen,
  TrendingUp,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const DiscoverPage = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const { novels, searchResults, searchLoading, searchPagination } = useSelector((state) => state.novels);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { authors, loading: authorsLoading } = useSelector((state) => state.authors);

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pageSize] = useState(24); // Số truyện mỗi trang
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [minRating, setMinRating] = useState(parseFloat(searchParams.get('minRating')) || 0);

  // Fetch initial data - Không cần fetch nữa vì đã load trong App.jsx
  // useEffect(() => {
  //   if (categories.length === 0) dispatch(getAllCategories());
  //   if (authors.length === 0) dispatch(getAllAuthors());
  // }, [dispatch, categories.length, authors.length]);

  // Search novels when filters change
  useEffect(() => {
    handleSearch();
  }, [currentPage, sortBy, selectedCategories, selectedStatus, minRating, searchTerm]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== 'rating') params.set('sort', sortBy);
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (selectedStatus) params.set('status', selectedStatus);
    if (minRating > 0) params.set('minRating', minRating.toString());
    
    setSearchParams(params);
  }, [searchTerm, currentPage, sortBy, selectedCategories, selectedStatus, minRating, setSearchParams]);

  const handleSearch = async () => {
    try {
      const searchCriteria = {
        ...(searchTerm && { nameNovel: searchTerm }),
        ...(selectedCategories.length > 0 && { categoryNames: selectedCategories }),
        ...(selectedStatus && { statuses: [selectedStatus] }),
        ...(minRating > 0 && { ratingGreaterThanOrEqual: minRating }),
        isDelete: false
      };

      const paginationParams = {
        page: currentPage - 1, // API sử dụng 0-based index
        size: pageSize,
        ...(sortBy && { sort: getSortParam(sortBy) })
      };

      await dispatch(searchNovels({
        searchCriteria,
        paginationAndSortParams: paginationParams
      })).unwrap();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const getSortParam = (sortType) => {
    switch (sortType) {
      case 'rating': return ['rating,desc'];
      case 'views': return ['totalView,desc'];
      case 'newest': return ['createDate,desc'];
      case 'oldest': return ['createDate,asc'];
      case 'name': return ['nameNovel,asc'];
      default: return ['rating,desc'];
    }
  };

  const handleCategoryToggle = (categoryName) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryName);
      const newCategories = isSelected 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName];
      setCurrentPage(1); // Reset to first page when filters change
      return newCategories;
    });
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleRatingChange = (rating) => {
    setMinRating(rating);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatus('');
    setMinRating(0);
    setSortBy('rating');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-sky-500 text-white'
                : page === '...'
                ? 'cursor-default'
                : isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const displayedNovels = searchResults?.content || novels || [];
  const totalPages = searchResults?.totalPages || Math.ceil((novels?.length || 0) / pageSize);
  const totalElements = searchResults?.totalElements || novels?.length || 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Khám phá truyện
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Tìm kiếm và khám phá những tác phẩm tuyệt vời
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          {/* Search Input */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm truyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-sky-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-sky-500'
                } focus:outline-none focus:ring-2 focus:ring-sky-500/20`}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Filter size={20} />
              Bộ lọc
              <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sort */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Sắp xếp theo
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="rating">Đánh giá cao nhất</option>
                    <option value="views">Lượt xem nhiều nhất</option>
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="name">Tên A-Z</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Trạng thái
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Tất cả</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CONTINUE">Đang cập nhật</option>
                    <option value="STOP">Tạm ngưng</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Đánh giá tối thiểu
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value={0}>Tất cả</option>
                    <option value={1}>1+ sao</option>
                    <option value={2}>2+ sao</option>
                    <option value={3}>3+ sao</option>
                    <option value={4}>4+ sao</option>
                    <option value={4.5}>4.5+ sao</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <X size={16} />
                    Xóa bộ lọc
                  </button>
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Thể loại
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.idCategory}
                        onClick={() => handleCategoryToggle(category.nameCategory)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategories.includes(category.nameCategory)
                            ? 'bg-sky-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {category.nameCategory}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {searchLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Đang tìm kiếm...
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span>
                Tìm thấy {totalElements.toLocaleString()} truyện
                {searchTerm && ` cho "${searchTerm}"`}
              </span>
              <span>Trang {currentPage} / {totalPages}</span>
            </div>
          )}
        </div>

        {/* Novels Grid */}
        {searchLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Đang tìm kiếm truyện...
              </p>
            </div>
          </div>
        ) : displayedNovels.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {displayedNovels.map((novel) => (
                <div key={novel.idNovel} className="transform transition-all duration-200 hover:scale-105">
                  <NovelCard novel={novel} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <BookOpen className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Không tìm thấy truyện nào
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm truyện khác
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DiscoverPage;
