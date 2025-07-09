import React, { useEffect,useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, Trash2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Footer from "../Footer"
// SỬA: Import actions từ đúng slice
import { LyberiNovels } from '../../redux/novelSlice';
import { followNovel } from '../../redux/userSlice'; // Import unfollow từ userSlice

import NovelCard from '../NovelCard'; // Giả sử đường dẫn này đúng

// Component Bỏ theo dõi (Không cần thay đổi)
const LibraryCardWrapper = ({ novel, onUnfollow }) => (
  <div className="relative group">
    <NovelCard novel={novel} />
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <button 
        onClick={() => onUnfollow(novel.idNovel)}
        className="p-2 bg-red-600/80 backdrop-blur-sm text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
        aria-label="Bỏ theo dõi"
        title="Bỏ theo dõi"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);
 

const LibraryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
const [currentPage, setCurrentPage] = useState(1); // <<--- THÊM: State cho trang hiện tại
  const itemsPerPage = 12; // Số truyện trên mỗi trang
  // SỬA: Lấy state từ đúng slice
  const { currentUser } = useSelector((state) => state.user);
  // Dữ liệu truyện theo dõi được lấy từ novelSlice, nơi LyberiNovels lưu trữ
  const { followedNovels, loading, error } = useSelector((state) => state.novels);

  useEffect(() => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để xem tủ truyện.");
      navigate('/');
      return;
    }

    // Luôn tải lại danh sách khi vào trang để đảm bảo dữ liệu mới nhất
    dispatch(LyberiNovels({ idUser: currentUser.idUser }));
    
  }, [dispatch, currentUser, navigate]);

  const handleUnfollow = (idNovel) => {
    if (window.confirm('Bạn có chắc muốn bỏ theo dõi truyện này không?')) {
      if (!currentUser) return; // Kiểm tra lại cho chắc
      
      // SỬA: Dispatch đúng asyncThunk
      dispatch(followNovel({ idUser: currentUser.idUser, idNovel }))
        .unwrap()
        .then(() => {
          toast.success("Đã bỏ theo dõi thành công.");
          // Sau khi bỏ theo dõi, tải lại danh sách để cập nhật UI
          dispatch(LyberiNovels({ idUser: currentUser.idUser }));
        })
        .catch((err) => {
          toast.error(`Lỗi: ${err.message || err}`);
        });
    }
  };
  const totalPages = Math.ceil(followedNovels.length / itemsPerPage);
  const currentNovels = followedNovels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển trang
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin mr-3" size={32} />
        Đang tải tủ truyện...
      </div>
    );
  }

  // Chú ý: `LyberiNovels` trả về lỗi qua rejectWithValue, nên nó nằm trong `error`
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 dark text-white p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-sky-400 mb-2 border-b-2 border-sky-500/30 pb-3">Tủ truyện của tôi</h1>
            <div className="text-center py-20 bg-gray-800 rounded-lg mt-8">
              <BookX size={64} className="mx-auto text-gray-600" />
              <h2 className="mt-4 text-xl font-semibold text-gray-300">Tủ truyện trống hoặc có lỗi</h2>
              <p className="mt-2 text-red-500">{error}</p>
              <Link to="/" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors">
                Khám phá truyện mới
              </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-gray-900 dark text-white p-4 sm:p-8 flex flex-col">
    <div className="max-w-7xl mx-auto flex-grow w-full">
      <h1 className="text-3xl font-bold text-sky-400 mb-2 border-b-2 border-sky-500/30 pb-3">Tủ truyện của tôi</h1>
      <p className="text-gray-400 mb-8">
       {followedNovels.length} truyện đang được theo dõi.
      </p>

      {followedNovels.length > 0 ? (
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {followedNovels.map((novel) => (
          <LibraryCardWrapper key={novel.idNovel} novel={novel} onUnfollow={handleUnfollow} />
        ))}
       </div>
      ) : (
       !loading && (
        <div className="text-center py-20 bg-gray-800 rounded-lg">
           <BookX size={64} className="mx-auto text-gray-600" />
           <h2 className="mt-4 text-xl font-semibold text-gray-300">Tủ truyện trống</h2>
           <p className="mt-2 text-gray-500">Bạn chưa theo dõi truyện nào cả.</p>
           <Link to="/" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors">
            Khám phá truyện mới
           </Link>
        </div>
       )
      )}
    </div>
    <Footer />
   </div>
  );
};
export default LibraryPage;