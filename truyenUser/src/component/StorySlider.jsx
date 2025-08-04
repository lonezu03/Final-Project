// src/components/StorySlider.jsx (Giả sử vị trí file)
import React, { useMemo,useState } from "react"; // Bỏ useEffect, useDispatch
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext"; // Import useTheme
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";

const StorySlider = () => {
  // Chỉ lấy novels từ store, không dispatch lại
  const { novels, loading, error } = useSelector((state) => state.novels);
  const { isDarkMode } = useTheme(); // Sử dụng theme context

  // Không còn:
  // const dispatch = useDispatch();
  // useEffect(() => {
  //   dispatch(getAllNovels());
  // }, [dispatch]);

  const renderError = (err) => (typeof err === 'string' ? err : err?.message || 'Đã có lỗi xảy ra.');

  // Tối ưu: Memoize với dependency chính xác và cache thông minh
  const sliderStories = useMemo(() => {
    if (!novels || novels.length === 0) return [];
    
    // Cache key dựa trên novel count và timestamp
    const cacheKey = `slider_stories_${novels.length}_${novels[0]?.updatedAtNovel || novels[0]?.createdAtNovel}`;
    
    // Kiểm tra cache trong sessionStorage (cache trong session)
    const cachedSlider = sessionStorage.getItem(cacheKey);
    if (cachedSlider) {
      try {
        const parsed = JSON.parse(cachedSlider);
        // console.log('✅ [StorySlider] Using cached slider data');
        return parsed;
      } catch (e) {
        // console.warn('⚠️ [StorySlider] Invalid cache, rebuilding');
      }
    }
    
    // Xây dựng lại nếu cache miss
    console.log('🔄 [StorySlider] Building slider data');
    const sortedNovels = [...novels]
      .filter(novel => novel && (novel.nameNovel || novel.title) && novel.imageNovel) // Lọc data hợp lệ
      .sort((a, b) => {
        const dateA = new Date(a.updatedAtNovel || a.createdAtNovel || 0);
        const dateB = new Date(b.updatedAtNovel || b.createdAtNovel || 0);
        return dateA - dateB; // Đảo ngược: truyện cũ nhất lên đầu, mới nhất xuống cuối
      })
      .reverse() // Đảo ngược toàn bộ danh sách để mới nhất lên đầu
      .slice(0, 10);
    
    // Lưu vào cache với expiry
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(sortedNovels));
      // Cleanup old cache keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('slider_stories_') && key !== cacheKey) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('⚠️ [StorySlider] Cannot cache slider data');
    }
    
    return sortedNovels;
  }, [novels]);

  // Hiển thị loading/error chỉ khi novels thực sự chưa có và đang fetch từ Home
  if (loading && novels.length === 0) return (
      <div className={`rounded-lg shadow-lg p-6 ${
        isDarkMode 
          ? 'bg-slate-800 text-white border border-gray-700' 
          : 'bg-white text-gray-800 border border-gray-200'
      }`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
              <Megaphone size={24} className={`mr-2 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              Truyện Mới Cập Nhật
          </h2>
          <p className={`text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Đang tải...</p>
      </div>
  );

  if (error && novels.length === 0) {
      console.error("Lỗi tải truyện cho slider:", error);
      return (
          <div className={`rounded-lg shadow-lg p-6 ${
            isDarkMode 
              ? 'bg-slate-800 text-white border border-gray-700' 
              : 'bg-white text-gray-800 border border-gray-200'
          }`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                  <Megaphone size={24} className={`mr-2 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  Truyện Mới Cập Nhật
              </h2>
              <p className="text-center text-sm text-red-500">Không thể tải dữ liệu. Lỗi: {renderError(error)}</p>
          </div>
      );
  }

  if (!sliderStories || sliderStories.length === 0) return (
    <div className={`rounded-lg shadow-lg p-6 ${
      isDarkMode 
        ? 'bg-slate-800 text-white border border-gray-700' 
        : 'bg-white text-gray-800 border border-gray-200'
    }`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
            <Megaphone size={24} className={`mr-2 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            Truyện Mới Cập Nhật
        </h2>
        <p className={`text-sm text-center ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>Không có truyện mới nào để hiển thị.</p>
    </div>
  );


  return (
    <div className={`rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'
    }`}>
      <h2 className={`text-xl font-bold mb-6 flex items-center ${
        isDarkMode 
          ? 'text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text' 
          : 'text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text'
      }`}>
        <Megaphone size={28} className={`mr-3 animate-pulse ${
          isDarkMode ? 'text-blue-400' : 'text-blue-600'
        }`} />
        Truyện Mới Cập Nhật
      </h2>
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={5}
        breakpoints={{
          320: { slidesPerView: 2, spaceBetween: 12 },
          640: { slidesPerView: 3, spaceBetween: 14 },
          768: { slidesPerView: 4, spaceBetween: 16 },
          1024: { slidesPerView: 5, spaceBetween: 16 },
          1280: { slidesPerView: 6, spaceBetween: 18 }
        }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        autoplay={{ 
          delay: 4000, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true 
        }}
        grabCursor={true}
        loop={sliderStories.length > 5}
        speed={800}
        className="relative story-slider"
      >
        {sliderStories.map((story) => (
          <SwiperSlide key={story.idNovel}>
            <Link to={`/novel/${story.idNovel}`} className="relative group block transform transition-all duration-300 hover:scale-105">
              <div className="relative overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300">
                <img
                  src={story.imageNovel || "https://via.placeholder.com/150x200.png?text=N"}
                  alt={story.nameNovel}
                  className="w-full h-56 sm:h-64 md:h-72 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-white p-3">
                  <h3 className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors duration-200">
                    {story.nameNovel}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Nhấn để đọc
                  </p>
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Mới
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
        
        {/* Custom Navigation Buttons */}
        <div className={`swiper-button-prev !w-10 !h-10 !shadow-lg !rounded-full !transition-all !duration-300 after:!text-sm after:!font-bold ${
          isDarkMode 
            ? '!bg-slate-700 !text-blue-400 hover:!bg-slate-600' 
            : '!bg-white !text-blue-600 hover:!bg-blue-50'
        }`}></div>
        <div className={`swiper-button-next !w-10 !h-10 !shadow-lg !rounded-full !transition-all !duration-300 after:!text-sm after:!font-bold ${
          isDarkMode 
            ? '!bg-slate-700 !text-blue-400 hover:!bg-slate-600' 
            : '!bg-white !text-blue-600 hover:!bg-blue-50'
        }`}></div>
      </Swiper>
      
      <style>{`
        .story-slider .swiper-button-prev,
        .story-slider .swiper-button-next {
          margin-top: -20px;
        }
        .story-slider .swiper-button-prev:hover,
        .story-slider .swiper-button-next:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default StorySlider;