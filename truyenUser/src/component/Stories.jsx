import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Flame } from 'lucide-react';
import { fetchHotNovels } from '../redux/novelSlice'; // Import thunk mới

import NovelCard from './NovelCard';
import Pagination from './Pagination'; // Import component phân trang

const Stories = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  
  // Lấy dữ liệu từ state hotNovels mới
  const { list: hotNovelsData, totalPages, currentPage, loading, error } = useSelector((state) => state.novels.hotNovels);

  const PAGE_SIZE = 6; // Kích thước trang
  
  // Tối ưu: Debounce để tránh spam API khi user click nhanh
  const [pendingPage, setPendingPage] = useState(null);
  const debounceTimeoutRef = useRef(null);

  // Tối ưu: Cache pages đã load để tránh re-fetch
  const loadedPagesRef = useRef(new Set([0])); // Page 0 đã load lần đầu

  // Gọi API khi component mount với cache check
  useEffect(() => {
    const cacheKey = `hot_novels_page_0_${PAGE_SIZE}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
    const CACHE_DURATION = 10 * 60 * 1000; // 10 phút
    
    const isCacheValid = cachedData && cacheTimestamp && 
                        (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION;
    
    if (hotNovelsData.length === 0) {
      if (isCacheValid) {
        console.log('✅ [Stories] Using cached hot novels data');
        // Load từ cache nếu cần thiết (Redux store sẽ handle)
      } else {
        console.log('🔄 [Stories] Fetching hot novels (cache miss)');
        dispatch(fetchHotNovels({ page: 0, size: PAGE_SIZE }))
          .unwrap()
          .then(() => {
            sessionStorage.setItem(cacheKey, 'loaded');
            sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
            loadedPagesRef.current.add(0);
          })
          .catch((error) => {
            console.error('❌ [Stories] Failed to load hot novels:', error);
          });
      }
    }
  }, [dispatch, hotNovelsData.length]);

  // Tối ưu: Debounced page change với intelligent preloading
  const handlePageChange = (page) => {
    if (page === currentPage || loading) return;
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    setPendingPage(page);
    
    // Debounce API call
    debounceTimeoutRef.current = setTimeout(() => {
      const cacheKey = `hot_novels_page_${page}_${PAGE_SIZE}`;
      const hasCache = loadedPagesRef.current.has(page);
      
      if (!hasCache) {
        console.log(`🔄 [Stories] Loading page ${page}`);
        dispatch(fetchHotNovels({ page, size: PAGE_SIZE }))
          .unwrap()
          .then(() => {
            loadedPagesRef.current.add(page);
            // Preload adjacent pages intelligently
            const preloadPages = [page - 1, page + 1].filter(p => 
              p >= 0 && p < totalPages && !loadedPagesRef.current.has(p)
            );
            
            preloadPages.forEach(preloadPage => {
              setTimeout(() => {
                if (!loadedPagesRef.current.has(preloadPage)) {
                  console.log(`🔄 [Stories] Preloading page ${preloadPage}`);
                  dispatch(fetchHotNovels({ page: preloadPage, size: PAGE_SIZE }))
                    .unwrap()
                    .then(() => loadedPagesRef.current.add(preloadPage))
                    .catch(() => {}); // Silent fail for preload
                }
              }, 1000); // Delay preload
            });
          })
          .catch((error) => {
            console.error(`❌ [Stories] Failed to load page ${page}:`, error);
          });
      } else {
        console.log(`✅ [Stories] Using cached page ${page}`);
      }
      
      setPendingPage(null);
      
      // Smooth scroll với throttling
      const targetElement = document.getElementById('hot-stories-section');
      if (targetElement) {
        const offset = targetElement.offsetTop - 80; // Account for header
        window.scrollTo({ 
          top: offset, 
          behavior: 'smooth' 
        });
      }
    }, 300); // 300ms debounce
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  const renderError = (err) => (typeof err === 'string' ? err : err?.message || 'Đã có lỗi xảy ra.');

  // Tối ưu: Show pending state during debounce
  const isActuallyLoading = loading || pendingPage !== null;

  // Giao diện loading với improved UX
  if (isActuallyLoading && hotNovelsData.length === 0) {
    return (
      <div id="hot-stories-section" className="container mx-auto p-4 sm:p-6">
        <h2 className={`text-2xl font-semibold mb-6 flex items-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          Danh sách truyện <Flame size={28} className="ml-2 text-red-500" />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {/* Skeleton loader */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={`rounded-lg h-80 animate-pulse ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}></div>
          ))}
        </div>
      </div>
    );
  }

  // Giao diện lỗi
  if (error) {
     return (
      <div id="hot-stories-section" className="container mx-auto p-4 sm:p-6">
        <h2 className={`text-2xl font-semibold mb-6 flex items-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>DANH SÁCH TRUYỆN <Flame/></h2>
        <p className="text-center text-red-500">Không thể tải truyện. Lỗi: {renderError(error)}</p>
      </div>
    );
  }
  
  // Không hiển thị gì nếu không có truyện và không loading
  if (hotNovelsData.length === 0 && !loading) {
     return null;
  }

  return (
    <div id="hot-stories-section" className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-semibold flex items-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          DANH SÁCH TRUYỆN
          <Flame size={28} className="ml-2 text-red-500" />
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {hotNovelsData.map((novel) => (
          <NovelCard key={novel.idNovel} novel={novel} />
        ))}
      </div>

      {/* Render component phân trang */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Stories;