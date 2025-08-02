// src/component/RecommendedStories.jsx
//
// TỐI ƯU HÓA API: 
// - KHÔNG GỌI getNovelById() cho từng truyện trong lịch sử
// - Sử dụng dữ liệu novels đã có từ Home.jsx
// - Tiết kiệm hàng chục API calls không cần thiết
//
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { searchNovels, getAllNovels } from '../redux/novelSlice';
import { getAllHistoryByUser } from '../redux/userSlice';
import NovelCard from './NovelCard'; // Import NovelCard component
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
  const { searchResults, searchLoading, searchPagination, novels } = useSelector((state) => state.novels);
  
  const [recommendedNovels, setRecommendedNovels] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  
  // Ref để tránh fetch getAllNovels nhiều lần
  const hasLoadedAllNovels = useRef(false);

  // Lấy lịch sử đọc của người dùng khi component mount
  useEffect(() => {
    if (currentUser?.idUser && userHistory.length === 0) {
      dispatch(getAllHistoryByUser(currentUser.idUser));
    }
  }, [dispatch, currentUser?.idUser, userHistory.length]);

  // Trích xuất categories từ lịch sử đọc KHÔNG GỌI API CHO TỪNG TRUYỆN
  useEffect(() => {
    const extractCategoriesFromHistory = async () => {
      if (userHistory && userHistory.length > 0 && userCategories.length === 0) {
        setFetchingCategories(true);
        console.log('🔍 [RecommendedStories] Extracting categories from history...');
        
        try {
          const allCategories = [];
          
          // Đảm bảo có dữ liệu novels từ Home.jsx
          let availableNovels = novels;
          
          // Nếu chưa có novels, chờ Home.jsx load xong
          if (!availableNovels || availableNovels.length === 0) {
            console.log('⏳ [RecommendedStories] Waiting for novels data from Home...');
            // Đợi một chút để Home.jsx load novels
            await new Promise(resolve => setTimeout(resolve, 1000));
            availableNovels = novels; // Lấy lại sau khi đợi
          }
          
          // Nếu vẫn chưa có, gọi getAllNovels (chỉ 1 lần) - sử dụng Redux loading state
          if (!availableNovels || availableNovels.length === 0) {
            if (!hasLoadedAllNovels.current && !loading) {
              console.log('🔄 [RecommendedStories] Loading novels as fallback...');
              try {
                await dispatch(getAllNovels()).unwrap();
                hasLoadedAllNovels.current = true;
                availableNovels = novels;
              } catch (err) {
                console.error('❌ [RecommendedStories] Error loading novels:', err);
              }
            }
          }
          
          // Sử dụng dữ liệu novels có sẵn thay vì gọi getNovelById
          if (availableNovels && Array.isArray(availableNovels)) {
            // Map novel IDs từ history
            const readNovelIds = new Set();
            userHistory.forEach(novelGroup => {
              novelGroup.historyReadRespones.forEach(history => {
                if (history.idNovel) readNovelIds.add(history.idNovel);
              });
            });

            console.log('📚 [RecommendedStories] Found novels in history:', readNovelIds.size);
            
            // Tìm categories của các truyện đã đọc từ dữ liệu có sẵn
            availableNovels.forEach(novel => {
              if (readNovelIds.has(novel.idNovel) && novel.categories && Array.isArray(novel.categories)) {
                const categories = novel.categories.map(cat => cat.nameCategory);
                allCategories.push(...categories);
                console.log('✅ [RecommendedStories] Categories from', novel.nameNovel, ':', categories);
              }
            });
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
            console.log('🎯 [RecommendedStories] User reading categories:', sortedCategories);
          } else {
            console.log('⚠️ [RecommendedStories] No categories found in user history');
          }
        } catch (err) {
          console.error('❌ [RecommendedStories] Error extracting categories from history:', err);
        } finally {
          setFetchingCategories(false);
        }
      }
    };

    extractCategoriesFromHistory();
  }, [dispatch, userHistory, userCategories.length, novels]);

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
      // Nếu tìm kiếm theo categories thất bại, sử dụng data có sẵn
      try {
        console.log('Falling back to using existing novels data...');
        
        // Sử dụng data có sẵn thay vì gọi API mới
        let allNovelsResponse = novels;
        if (!allNovelsResponse || allNovelsResponse.length === 0) {
          if (!hasLoadedAllNovels.current && !loading) {
            console.log('🔄 Loading novels for fallback from RecommendedStories...');
            try {
              allNovelsResponse = await dispatch(getAllNovels()).unwrap();
              hasLoadedAllNovels.current = true;
            } catch (error) {
              console.error('❌ Error loading novels:', error);
            }
          }
        }
        
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
      // Sử dụng data có sẵn thay vì gọi API mới
      try {
        let allNovelsResponse = novels;
        if (!allNovelsResponse || allNovelsResponse.length === 0) {
          if (!hasLoadedAllNovels.current && !loading) {
            console.log('🔄 Loading novels for popular fallback from RecommendedStories...');
            try {
              allNovelsResponse = await dispatch(getAllNovels()).unwrap();
              hasLoadedAllNovels.current = true;
            } catch (error) {
              console.error('❌ Error loading novels:', error);
            }
          }
        }
        
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-xl shadow-lg overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <LoaderIcon className="w-8 h-8 animate-spin text-sky-500 mb-3" />
              <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isUserHistoryLoading ? 'Đang tải lịch sử đọc...' : 'Đang phân tích sở thích...'}
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Vui lòng đợi trong giây lát
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8`}>
      <div className={`rounded-xl shadow-lg overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${
                isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
              }`}>
                <SparklesIcon className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {userCategories.length > 0 ? 'Gợi ý cho bạn' : 'Truyện phổ biến'}
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {userCategories.length > 0 
                    ? 'Dựa trên sở thích đọc của bạn' 
                    : 'Những tác phẩm được yêu thích nhất'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700'
              } disabled:opacity-50 hover:scale-105 active:scale-95`}
              title="Làm mới gợi ý"
            >
              <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Categories Preview - chỉ hiển thị khi có lịch sử đọc */}
          {userCategories.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {userCategories.slice(0, 5).map((category, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-sky-900/30 text-sky-300 border border-sky-700/50' 
                        : 'bg-sky-100 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {category}
                  </span>
                ))}
                {userCategories.length > 5 && (
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    isDarkMode 
                      ? 'text-gray-400 bg-gray-700/50' 
                      : 'text-gray-500 bg-gray-100'
                  }`}>
                    +{userCategories.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Message for new users */}
          {userCategories.length === 0 && userHistory.length === 0 && (
            <div className={`mt-4 p-4 rounded-lg ${
              isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                💡 Bắt đầu đọc một vài truyện để chúng tôi có thể gợi ý những tác phẩm phù hợp với sở thích của bạn!
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error State */}
          {error && (
            <div className={`text-center py-8 rounded-lg ${
              isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <p className="text-red-500 font-medium mb-2">{error}</p>
              <button
                onClick={handleRefresh}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoaderIcon className="w-8 h-8 animate-spin text-sky-500 mb-3" />
              <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Đang tìm truyện phù hợp...
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Vui lòng đợi trong giây lát
              </span>
            </div>
          )}

          {/* Recommended Novels Grid */}
          {!loading && !error && recommendedNovels.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {recommendedNovels.slice(0, 12).map((novel) => (
                  <div key={novel.idNovel} className="transform transition-all duration-200 hover:scale-105">
                    <NovelCard novel={novel} />
                  </div>
                ))}
              </div>
              
              {/* View More Link */}
              <div className="mt-8 text-center">
                <Link
                  to="/discover"
                  className={`inline-flex items-center px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg hover:shadow-sky-500/25' 
                      : 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-500/25'
                  } hover:scale-105 active:scale-95`}
                >
                  <TrendingUpIcon className="w-5 h-5 mr-2" />
                  Khám phá thêm truyện
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </>
          )}

          {/* Empty State */}
          {!loading && !error && recommendedNovels.length === 0 && userCategories.length > 0 && (
            <div className="text-center py-12">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <BookOpenIcon className={`w-10 h-10 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Không tìm thấy truyện phù hợp
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-md mx-auto`}>
                Hãy đọc thêm một số truyện khác để chúng tôi hiểu rõ hơn về sở thích của bạn
              </p>
              <Link
                to="/discover"
                className={`inline-flex items-center text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-sky-400 hover:text-sky-300' 
                    : 'text-sky-600 hover:text-sky-700'
                }`}
              >
                Khám phá truyện mới
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecommendedStories;
