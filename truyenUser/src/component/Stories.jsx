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

  // Gọi API khi component mount - KHÔNG dùng cache
  useEffect(() => {
    if (hotNovelsData.length === 0) {
      console.log('🔄 [Stories] Fetching hot novels (initial load)');
      dispatch(fetchHotNovels({ page: 0, size: PAGE_SIZE }))
        .unwrap()
        .then(() => {
          console.log('✅ [Stories] Initial load completed');
        })
        .catch((error) => {
          console.error('❌ [Stories] Failed to load hot novels:', error);
        });
    }
  }, [dispatch, hotNovelsData.length]);

  // Tối ưu: Debounced page change - KHÔNG dùng cache
  const handlePageChange = (page) => {
    if (page === currentPage || loading) return;
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    setPendingPage(page);
    
    // Debounce API call - LUÔN gọi API mới
    debounceTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 [Stories] Loading page ${page}`);
      dispatch(fetchHotNovels({ page, size: PAGE_SIZE }))
        .unwrap()
        .then(() => {
          console.log(`✅ [Stories] Page ${page} loaded successfully`);
        })
        .catch((error) => {
          console.error(`❌ [Stories] Failed to load page ${page}:`, error);
        });
      
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

  // Component Skeleton Loading
  const SkeletonCard = () => (
    <div className={`rounded-lg overflow-hidden shadow-md animate-pulse ${
      isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
    }`}>
      <div className={`h-64 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
      <div className="p-3 space-y-2">
        <div className={`h-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        <div className={`h-3 rounded w-3/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        <div className="flex justify-between items-center pt-2">
          <div className={`h-3 rounded w-1/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className={`h-3 rounded w-1/3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        </div>
      </div>
    </div>
  );

  // Giao diện loading với improved UX - chỉ cho lần đầu load
  if (isActuallyLoading && hotNovelsData.length === 0) {
    return (
      <div id="hot-stories-section" className="container mx-auto p-4 sm:p-6">
        <h2 className={`text-2xl font-semibold mb-6 flex items-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          DANH SÁCH TRUYỆN <Flame size={28} className="ml-2 text-red-500" />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        {/* Fake pagination để giữ layout */}
        <div className="flex justify-center items-center mt-8 space-x-2">
          <div className={`w-8 h-8 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
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
        {/* Loading indicator khi đang load page mới */}
        {isActuallyLoading && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-sky-400' : 'bg-sky-500'}`} style={{animationDelay: '0ms'}}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-sky-400' : 'bg-sky-500'}`} style={{animationDelay: '150ms'}}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-sky-400' : 'bg-sky-500'}`} style={{animationDelay: '300ms'}}></div>
            <span className={`text-sm ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Đang tải...
            </span>
          </div>
        )}
      </div>

      {/* Overlay skeleton khi đang load để "đánh lừa" user */}
      <div className="relative">
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 transition-opacity duration-300 ${
          isActuallyLoading ? 'opacity-50' : 'opacity-100'
        }`}>
          {hotNovelsData.map((novel) => (
            <NovelCard key={novel.idNovel} novel={novel} />
          ))}
        </div>
        
        {/* Skeleton overlay khi đang load page mới */}
        {isActuallyLoading && hotNovelsData.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        )}
      </div>

      {/* Render component phân trang */}
      <div className={`transition-opacity duration-300 ${isActuallyLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Stories;