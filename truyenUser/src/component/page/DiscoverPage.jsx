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
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [minRating, setMinRating] = useState(parseFloat(searchParams.get('minRating')) || 0);
  const [selectedAuthors, setSelectedAuthors] = useState(
    searchParams.get('authors')?.split(',').filter(Boolean) || []
  );
  const [minChapters, setMinChapters] = useState(parseInt(searchParams.get('minChapters')) || 0);
  const [maxChapters, setMaxChapters] = useState(parseInt(searchParams.get('maxChapters')) || 0);
  
  // State để lưu tất cả novels từ API
  const [allNovels, setAllNovels] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch all novels only once on component mount
  useEffect(() => {
    const fetchAllNovels = async () => {
      try {
        setIsInitialLoading(true);
        // Gọi API search với criteria rỗng để lấy tất cả novels
        const result = await dispatch(searchNovels({
          searchCriteria: { },
          pageable: { page: 0, size: 1000 } // Lấy số lượng lớn để có tất cả data
        })).unwrap();
        
        if (result && result.content) {
          setAllNovels(result.content);
        }
      } catch (error) {
        console.error('Failed to fetch all novels:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchAllNovels();
  }, [dispatch]);

  // Client-side filtering và phân trang
  const filteredNovels = useMemo(() => {
    let filtered = [...allNovels];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(novel => 
        novel.nameNovel?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(novel =>
        novel.categories?.some(cat => selectedCategories.includes(cat.nameCategory))
      );
    }

    // Filter by authors
    if (selectedAuthors.length > 0) {
      filtered = filtered.filter(novel =>
        novel.authors?.some(author => selectedAuthors.includes(author.nameAuthor))
      );
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(novel => novel.statusNovel === selectedStatus);
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(novel => {
        const rating = parseFloat(novel.rating) || 0;
        return rating >= minRating;
      });
    }

    // Filter by chapters
    if (minChapters > 0) {
      filtered = filtered.filter(novel => (novel.totalChapter || 0) > minChapters);
    }
    if (maxChapters > 0) {
      filtered = filtered.filter(novel => (novel.totalChapter || 0) < maxChapters);
    }

    return filtered;
  }, [allNovels, searchTerm, selectedCategories, selectedAuthors, selectedStatus, minRating, minChapters, maxChapters]);

  // Client-side pagination
  const paginatedNovels = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNovels.slice(startIndex, endIndex);
  }, [filteredNovels, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredNovels.length / pageSize);
  const totalElements = filteredNovels.length;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedAuthors, selectedStatus, minRating, minChapters, maxChapters]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (selectedStatus) params.set('status', selectedStatus);
    if (minRating > 0) params.set('minRating', minRating.toString());
    if (selectedAuthors.length > 0) params.set('authors', selectedAuthors.join(','));
    if (minChapters > 0) params.set('minChapters', minChapters.toString());
    if (maxChapters > 0) params.set('maxChapters', maxChapters.toString());
    
    setSearchParams(params);
  }, [searchTerm, currentPage, selectedCategories, selectedStatus, minRating, selectedAuthors, minChapters, maxChapters, setSearchParams]);

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

  const handleAuthorToggle = (authorName) => {
    setSelectedAuthors(prev => {
      const isSelected = prev.includes(authorName);
      const newAuthors = isSelected 
        ? prev.filter(a => a !== authorName)
        : [...prev, authorName];
      setCurrentPage(1); // Reset to first page when filters change
      return newAuthors;
    });
  };

  const handleChaptersChange = (type, value) => {
    if (type === 'min') {
      setMinChapters(value);
    } else if (type === 'max') {
      setMaxChapters(value);
    }
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // handleSortChange removed since API doesn't support sort parameter

  const handleRatingChange = (rating) => {
    setMinRating(rating);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setSelectedStatus('');
    setMinRating(0);
    setMinChapters(0);
    setMaxChapters(0);
    setCurrentPage(1); // Reset về trang 1
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

  // Use client-side filtered and paginated data
  const displayedNovels = paginatedNovels;

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Sort - Disabled because API doesn't support it */}
                {/* <div>
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
                    <option value="newest">Mới nhất</option>
                    <option value="views">Lượt xem nhiều nhất</option>
                    <option value="rating">Đánh giá cao nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="name">Tên A-Z</option>
                  </select>
                </div> */}

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

                {/* Đánh giá tối thiểu */}
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

                {/* Số chương tối thiểu */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Số chương tối thiểu
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minChapters || ''}
                    onChange={(e) => handleChaptersChange('min', parseInt(e.target.value) || 0)}
                    placeholder="Ví dụ: 10"
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
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

              {/* Số chương tối đa - Row riêng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Số chương tối đa
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxChapters || ''}
                    onChange={(e) => handleChaptersChange('max', parseInt(e.target.value) || 0)}
                    placeholder="Ví dụ: 100"
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
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

              {/* Authors */}
              {authors.length > 0 && (
                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Tác giả
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {authors.map((author) => (
                      <button
                        key={author.idAuthor}
                        onClick={() => handleAuthorToggle(author.nameAuthor)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedAuthors.includes(author.nameAuthor)
                            ? 'bg-green-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {author.nameAuthor}
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
          {isInitialLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Đang tải dữ liệu...
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
        {isInitialLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Đang tải dữ liệu truyện...
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

            {/* Pagination với Previous/Next buttons */}
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
              
              {/* Previous/Next Navigation */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <ChevronLeft size={16} />
                  Trang trước
                </button>
                
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {displayedNovels.length > 0 && (
                    <>
                      Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalElements)} 
                      trong tổng số {totalElements} truyện
                    </>
                  )}
                </span>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Trang sau
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
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
