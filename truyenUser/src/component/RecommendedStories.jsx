// src/component/RecommendedStories.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { searchNovels, getAllNovels, getNovelById } from '../redux/novelSlice';
import { getAllHistoryByUser } from '../redux/userSlice';
import { 
  BookOpen as BookOpenIcon, 
  TrendingUp as TrendingUpIcon,
  Sparkles as SparklesIcon,
  ChevronRight as ChevronRightIcon,
  Loader2 as LoaderIcon,
  RefreshCw as RefreshIcon
} from 'lucide-react';

const RecommendedStories = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  
  const { currentUser, userHistory, isUserHistoryLoading } = useSelector((state) => state.user);
  const { searchResults, searchLoading, searchPagination } = useSelector((state) => state.novels);
  
  const [recommendedNovels, setRecommendedNovels] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  // Lấy lịch sử đọc của người dùng khi component mount
  useEffect(() => {
    if (currentUser?.idUser && userHistory.length === 0) {
      dispatch(getAllHistoryByUser(currentUser.idUser));
    }
  }, [dispatch, currentUser?.idUser, userHistory.length]);

  // Trích xuất categories từ lịch sử đọc bằng cách lấy thông tin novel
  useEffect(() => {
    const fetchCategoriesFromHistory = async () => {
      if (userHistory && userHistory.length > 0 && userCategories.length === 0) {
        setFetchingCategories(true);
        console.log('Fetching categories from history...');
        
        try {
          const allCategories = [];
          
          // Lấy thông tin chi tiết từng truyện để có categories
          for (const novelGroup of userHistory) {
            for (const history of novelGroup.historyReadRespones) {
              if (history.idNovel) {
                try {
                  console.log('Fetching novel details for:', history.idNovel);
                  const novelDetails = await dispatch(getNovelById(history.idNovel)).unwrap();
                  
                  if (novelDetails && novelDetails.categories && Array.isArray(novelDetails.categories)) {
                    const categories = novelDetails.categories.map(cat => cat.nameCategory);
                    allCategories.push(...categories);
                    console.log('Categories found for', novelDetails.nameNovel, ':', categories);
                  }
                } catch (err) {
                  console.error('Error fetching novel details:', err);
                  // Nếu không lấy được details, thử fallback bằng getAllNovels
                }
              }
            }
          }

          // Nếu không lấy được categories từ getNovelById, thử fallback
          if (allCategories.length === 0) {
            console.log('Fallback: Using getAllNovels to get categories...');
            try {
              const allNovels = await dispatch(getAllNovels()).unwrap();
              if (allNovels && Array.isArray(allNovels)) {
                // Map novel IDs từ history
                const readNovelIds = new Set();
                userHistory.forEach(novelGroup => {
                  novelGroup.historyReadRespones.forEach(history => {
                    if (history.idNovel) readNovelIds.add(history.idNovel);
                  });
                });

                // Tìm categories của các truyện đã đọc
                allNovels.forEach(novel => {
                  if (readNovelIds.has(novel.idNovel) && novel.categories && Array.isArray(novel.categories)) {
                    const categories = novel.categories.map(cat => cat.nameCategory);
                    allCategories.push(...categories);
                  }
                });
              }
            } catch (fallbackErr) {
              console.error('Fallback getAllNovels also failed:', fallbackErr);
            }
          }

          if (allCategories.length > 0) {
            // Loại bỏ duplicate và đếm tần suất
            const categoryCount = {};
            allCategories.forEach(category => {
              if (category) {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
              }
            });

            // Sắp xếp theo tần suất đọc (ưu tiên thể loại được đọc nhiều nhất)
            const sortedCategories = Object.entries(categoryCount)
              .sort(([,a], [,b]) => b - a)
              .map(([category]) => category);

            setUserCategories(sortedCategories);
            console.log('User reading categories:', sortedCategories);
          } else {
            console.log('No categories found in user history');
          }
        } catch (err) {
          console.error('Error fetching categories from history:', err);
        } finally {
          setFetchingCategories(false);
        }
      }
    };

    fetchCategoriesFromHistory();
  }, [dispatch, userHistory, userCategories.length]);

  // Tìm kiếm truyện gợi ý dựa trên categories
  const fetchRecommendedNovels = async (categories) => {
    if (!categories || categories.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Tạo search criteria theo đúng format API backend
      const searchCriteria = {
        categoryNames: categories.slice(0, 5), // Danh sách tên thể loại
        statuses: ["COMPLETED"], // Sử dụng statuses thay vì statusNovel
        ratingGreaterThanOrEqual: 0, // Giảm xuống 0 để có nhiều kết quả hơn vì rating trong response là string "0"
        isDelete: false, // Chỉ lấy truyện chưa bị xóa
      };

      const paginationParams = {
        page: 0,
        size: 12 // Không truyền sort vì backend không hỗ trợ
      };

      console.log('Searching with criteria:', searchCriteria);

      const response = await dispatch(searchNovels({
        searchCriteria,
        paginationAndSortParams: paginationParams
      })).unwrap();

      if (response && response.content) {
        // Lọc bỏ các truyện mà user đã đọc
        const readNovelIds = new Set();
        userHistory.forEach(novelGroup => {
          novelGroup.historyReadRespones.forEach(history => {
            if (history.idNovel) {
              readNovelIds.add(history.idNovel);
            }
            // Nếu không có idNovel, có thể dùng nameNovel để so sánh
            if (!history.idNovel && history.nameNovel) {
              readNovelIds.add(history.nameNovel);
            }
          });
        });

        const filteredNovels = response.content.filter(novel => 
          !readNovelIds.has(novel.idNovel) && !readNovelIds.has(novel.nameNovel)
        );

        setRecommendedNovels(filteredNovels);
        console.log('Recommended novels found:', filteredNovels.length);
        
        // Nếu không có kết quả, thử với criteria ít khắt khe hơn
        if (filteredNovels.length === 0) {
          console.log('No results with strict criteria, trying with relaxed criteria...');
          const relaxedCriteria = {
            categoryNames: categories.slice(0, 3), // Chỉ lấy 3 thể loại phổ biến nhất
            isDelete: false,
            // Bỏ điều kiện rating và status
          };

          const relaxedResponse = await dispatch(searchNovels({
            searchCriteria: relaxedCriteria,
            paginationAndSortParams: paginationParams
          })).unwrap();

          if (relaxedResponse && relaxedResponse.content) {
            const relaxedFiltered = relaxedResponse.content.filter(novel => 
              !readNovelIds.has(novel.idNovel) && !readNovelIds.has(novel.nameNovel)
            );
            setRecommendedNovels(relaxedFiltered);
            console.log('Relaxed search found:', relaxedFiltered.length);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching recommended novels:', err);
      // Nếu tìm kiếm theo categories thất bại, thử lấy tất cả truyện và lọc client-side
      try {
        console.log('Falling back to getAllNovels...');
        const allNovelsResponse = await dispatch(getAllNovels()).unwrap();
        
        if (allNovelsResponse && Array.isArray(allNovelsResponse)) {
          // Lọc truyện theo categories ở client-side
          const categorySet = new Set(categories.map(cat => cat.toLowerCase()));
          const matchingNovels = allNovelsResponse.filter(novel => {
            if (!novel.categories || !Array.isArray(novel.categories)) return false;
            
            return novel.categories.some(category => 
              categorySet.has(category.nameCategory?.toLowerCase())
            );
          });

          // Lọc bỏ truyện đã đọc
          const readNovelIds = new Set();
          userHistory.forEach(novelGroup => {
            novelGroup.historyReadRespones.forEach(history => {
              if (history.idNovel) readNovelIds.add(history.idNovel);
              if (!history.idNovel && history.nameNovel) readNovelIds.add(history.nameNovel);
            });
          });

          const filteredNovels = matchingNovels
            .filter(novel => !readNovelIds.has(novel.idNovel) && !readNovelIds.has(novel.nameNovel))
            .filter(novel => (Number(novel.rating) || 0) >= 3.0) // Lọc rating >= 3.0, convert string to number
            .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)) // Sắp xếp theo rating
            .slice(0, 12); // Lấy 12 truyện đầu

          setRecommendedNovels(filteredNovels);
          console.log('Fallback novels found:', filteredNovels.length);
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Không thể tải truyện gợi ý. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi có categories hoặc fallback khi không có lịch sử đọc
  useEffect(() => {
    if (userCategories.length > 0 && !fetchingCategories) {
      fetchRecommendedNovels(userCategories);
    } else if (currentUser && userHistory.length === 0 && !isUserHistoryLoading && !fetchingCategories) {
      // Nếu user đã đăng nhập nhưng chưa có lịch sử đọc, lấy truyện phổ biến
      fetchPopularNovels();
    }
  }, [userCategories, currentUser, userHistory.length, isUserHistoryLoading, fetchingCategories]);

  // Lấy truyện phổ biến khi chưa có lịch sử đọc
  const fetchPopularNovels = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchCriteria = {
        statuses: ["COMPLETED"], // Sử dụng statuses thay vì statusNovel
        ratingGreaterThanOrEqual: 0, // Giảm xuống 0 vì rating trong response là string "0"
        isDelete: false, // Chỉ lấy truyện chưa bị xóa
      };

      const paginationParams = {
        page: 0,
        size: 12 // Không truyền sort vì backend không hỗ trợ
      };

      const response = await dispatch(searchNovels({
        searchCriteria,
        paginationAndSortParams: paginationParams
      })).unwrap();

      if (response && response.content) {
        setRecommendedNovels(response.content);
      } else {
        // Nếu không có kết quả, thử với criteria ít khắt khe hơn
        const relaxedCriteria = {
          isDelete: false,
          // Bỏ điều kiện rating và status
        };

        const relaxedResponse = await dispatch(searchNovels({
          searchCriteria: relaxedCriteria,
          paginationAndSortParams: paginationParams
        })).unwrap();

        if (relaxedResponse && relaxedResponse.content) {
          setRecommendedNovels(relaxedResponse.content);
        }
      }
    } catch (err) {
      console.error('Error fetching popular novels:', err);
      // Fallback to getAllNovels
      try {
        const allNovelsResponse = await dispatch(getAllNovels()).unwrap();
        if (allNovelsResponse && Array.isArray(allNovelsResponse)) {
          const popularNovels = allNovelsResponse
            .filter(novel => novel.statusNovel === 'COMPLETED')
            .filter(novel => (Number(novel.rating) || 0) >= 3.0)
            .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
            .slice(0, 12);
          setRecommendedNovels(popularNovels);
        }
      } catch (fallbackErr) {
        setError('Không thể tải truyện gợi ý. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm refresh recommendations
  const handleRefresh = () => {
    if (userCategories.length > 0) {
      fetchRecommendedNovels(userCategories);
    } else {
      fetchPopularNovels();
    }
  };

  // Không hiển thị nếu user chưa đăng nhập
  if (!currentUser) {
    return null;
  }

  // Hiển thị loading nếu đang tải lịch sử hoặc đang fetch categories
  if (isUserHistoryLoading || fetchingCategories) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex items-center justify-center py-8">
          <LoaderIcon className="w-6 h-6 animate-spin mr-2" />
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            {isUserHistoryLoading ? 'Đang tải lịch sử đọc...' : 'Đang phân tích sở thích...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SparklesIcon className="w-6 h-6 text-yellow-500 mr-2" />
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {userCategories.length > 0 ? 'Gợi ý cho bạn' : 'Truyện phổ biến'}
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          } disabled:opacity-50`}
          title="Làm mới gợi ý"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Categories Preview - chỉ hiển thị khi có lịch sử đọc */}
      {userCategories.length > 0 && (
        <div className="mb-4">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Dựa trên thể loại bạn đã đọc:
          </p>
          <div className="flex flex-wrap gap-2">
            {userCategories.slice(0, 3).map((category, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs rounded-full ${
                  isDarkMode 
                    ? 'bg-sky-900/30 text-sky-300' 
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {category}
              </span>
            ))}
            {userCategories.length > 3 && (
              <span className={`px-2 py-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                +{userCategories.length - 3} thể loại khác
              </span>
            )}
          </div>
        </div>
      )}

      {/* Message for new users */}
      {userCategories.length === 0 && userHistory.length === 0 && (
        <div className="mb-4">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Bắt đầu đọc một vài truyện để chúng tôi có thể gợi ý những tác phẩm phù hợp với sở thích của bạn!
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sky-500 hover:text-sky-600 text-sm underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon className="w-5 h-5 animate-spin mr-2" />
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Đang tìm truyện phù hợp...
          </span>
        </div>
      )}

      {/* Recommended Novels Grid */}
      {!loading && !error && recommendedNovels.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendedNovels.map((novel) => (
            <Link
              key={novel.idNovel}
              to={`/novel/${novel.idNovel}`}
              className="group block"
            >
              <div className={`rounded-lg overflow-hidden transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
              } group-hover:scale-105 group-hover:shadow-lg`}>
                {/* Novel Cover */}
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={novel.imageNovel || ''}
                    alt={novel.nameNovel}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = '';
                    }}
                  />
                  {/* Rating Badge */}
                  {novel.rating && Number(novel.rating) > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded">
                      ★ {Number(novel.rating).toFixed(1)}
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 text-xs px-1 py-0.5 rounded ${
                    novel.statusNovel === 'COMPLETED' 
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {novel.statusNovel === 'COMPLETED' ? 'Hoàn' : 'Đang ra'}
                  </div>
                </div>

                {/* Novel Info */}
                <div className="p-3">
                  <h3 className={`font-medium text-sm line-clamp-2 mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {novel.nameNovel}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    {novel.authors && novel.authors.length > 0 ? novel.authors[0].nameAuthor : 'Tác giả không rõ'}
                  </p>
                  {novel.totalView && (
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpenIcon className="w-3 h-3 mr-1" />
                      {novel.totalView.toLocaleString()} lượt đọc
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendedNovels.length === 0 && userCategories.length > 0 && (
        <div className="text-center py-8">
          <BookOpenIcon className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Không tìm thấy truyện phù hợp
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Hãy đọc thêm một số truyện để chúng tôi hiểu sở thích của bạn
          </p>
        </div>
      )}

      {/* View More Link */}
      {!loading && recommendedNovels.length > 0 && (
        <div className="mt-6 text-center">
          <Link
            to="/discover"
            className={`inline-flex items-center text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'text-sky-400 hover:text-sky-300' 
                : 'text-sky-600 hover:text-sky-700'
            }`}
          >
            Khám phá thêm truyện
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecommendedStories;
