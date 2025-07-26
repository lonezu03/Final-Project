import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Flame } from 'lucide-react';
import { fetchHotNovels } from '../redux/novelSlice'; // Import thunk mới

import NovelCard from './NovelCard';
import Pagination from './Pagination'; // Import component phân trang

const Stories = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme(); // Sử dụng theme context
  
  // Lấy dữ liệu từ state hotNovels mới
  const { list: hotNovelsData, totalPages, currentPage, loading, error } = useSelector((state) => state.novels.hotNovels);

  const PAGE_SIZE = 6; // Kích thước trang

  // Gọi API khi component mount lần đầu
  useEffect(() => {
    // Chỉ gọi khi chưa có dữ liệu để tránh gọi lại không cần thiết
    if (hotNovelsData.length === 0) {
      dispatch(fetchHotNovels({ page: 0, size: PAGE_SIZE }));
    }
  }, [dispatch, hotNovelsData.length]);

  // Hàm xử lý khi người dùng chuyển trang
  const handlePageChange = (page) => {
    if (page !== currentPage && !loading) {
      dispatch(fetchHotNovels({ page, size: PAGE_SIZE }));
    }
    // Cuộn lên đầu section khi chuyển trang
    window.scrollTo({ top: document.getElementById('hot-stories-section')?.offsetTop || 0, behavior: 'smooth' });
  };
  
  const renderError = (err) => (typeof err === 'string' ? err : err?.message || 'Đã có lỗi xảy ra.');

  // Giao diện loading
  if (loading && hotNovelsData.length === 0) {
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