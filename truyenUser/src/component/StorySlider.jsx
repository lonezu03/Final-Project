// src/components/StorySlider.jsx (Giả sử vị trí file)
import React, { useMemo } from "react"; // Bỏ useEffect, useDispatch
import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";

const StorySlider = () => {
  // Chỉ lấy novels từ store, không dispatch lại
  const { novels, loading, error } = useSelector((state) => state.novels);

  // Không còn:
  // const dispatch = useDispatch();
  // useEffect(() => {
  //   dispatch(getAllNovels());
  // }, [dispatch]);

  const renderError = (err) => (typeof err === 'string' ? err : err?.message || 'Đã có lỗi xảy ra.');

  const sliderStories = useMemo(() => {
    if (!novels || novels.length === 0) return [];
    // Giả sử có trường createdAtNovel hoặc updatedAtNovel để sắp xếp cho "Truyện Mới Cập Nhật"
    const sortedNovels = [...novels].sort((a, b) => {
        const dateA = new Date(a.updatedAtNovel || a.createdAtNovel || 0); // Lấy ngày update hoặc ngày tạo
        const dateB = new Date(b.updatedAtNovel || b.createdAtNovel || 0);
        return dateB - dateA; // Sắp xếp mới nhất lên đầu
    });
    return sortedNovels.slice(0, 10); // Lấy 10 truyện
  }, [novels]);

  // Hiển thị loading/error chỉ khi novels thực sự chưa có và đang fetch từ Home
  if (loading && novels.length === 0) return (
      <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
              <Megaphone size={24} className="mr-2 text-blue-600" />
              Truyện Mới Cập Nhật
          </h2>
          <p className="text-center text-gray-500">Đang tải...</p>
      </div>
  );

  if (error && novels.length === 0) {
      console.error("Lỗi tải truyện cho slider:", error);
      return (
          <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                  <Megaphone size={24} className="mr-2 text-blue-600" />
                  Truyện Mới Cập Nhật
              </h2>
              <p className="text-center text-sm text-red-500">Không thể tải dữ liệu. Lỗi: {renderError(error)}</p>
          </div>
      );
  }

  if (!sliderStories || sliderStories.length === 0) return (
    <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
            <Megaphone size={24} className="mr-2 text-blue-600" />
            Truyện Mới Cập Nhật
        </h2>
        <p className="text-sm text-gray-500 text-center">Không có truyện mới nào để hiển thị.</p>
    </div>
  );


  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        <Megaphone size={28} className="mr-3 text-blue-600 animate-pulse" />
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
        <div className="swiper-button-prev !w-10 !h-10 !bg-white !shadow-lg !rounded-full !text-blue-600 hover:!bg-blue-50 !transition-all !duration-300 after:!text-sm after:!font-bold"></div>
        <div className="swiper-button-next !w-10 !h-10 !bg-white !shadow-lg !rounded-full !text-blue-600 hover:!bg-blue-50 !transition-all !duration-300 after:!text-sm after:!font-bold"></div>
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