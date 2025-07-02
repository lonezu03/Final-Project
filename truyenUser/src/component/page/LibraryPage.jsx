import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, Trash2 } from 'lucide-react';

// Bước 1: Import NovelCard
import NovelCard from '../NovelCard'; // <<<< ĐIỀU CHỈNH ĐƯỜNG DẪN NẾU CẦN

// --- DỮ LIỆU GIẢ (MOCK DATA) ---
// Thêm một vài trường dữ liệu để khớp với những gì NovelCard mong đợi
const mockFollowedNovels = [
  {
    idNovel: '1',
    nameNovel: 'Linh Vũ Thiên Hạ',
    imageNovel: 'https://img.dtruyen.com/public/images/large/linhvuthienha1PWuOKu.jpg',
    authors: [{ nameAuthor: 'Vũ Phong' }],
    categories: [{ nameCategory: 'Tiên Hiệp' }, { nameCategory: 'Huyền Huyễn' }],
    rating: 4.8,
    totalChapter: 5210,
  },
  {
    idNovel: '2',
    nameNovel: 'Đấu Phá Thương Khung',
    imageNovel: 'https://img.dtruyen.com/public/images/large/dauphathuongkhung2aDlrGn.jpg',
    authors: [{ nameAuthor: 'Thiên Tằm Thổ Đậu' }],
    categories: [{ nameCategory: 'Dị Giới' }],
    rating: 4.9,
    totalChapter: 1663,
  },
  {
    idNovel: '5',
    nameNovel: 'Võ Luyện Đỉnh Phong',
    imageNovel: 'https://img.dtruyen.com/public/images/large/voluyendinhphong1eYjA8v.jpg',
    authors: [{ nameAuthor: 'Mạc Mặc' }],
    categories: [{ nameCategory: 'Huyền Huyễn' }],
    rating: 4.7,
    totalChapter: 6009,
  },
  {
    idNovel: '4',
    nameNovel: 'Phàm Nhân Tu Tiên',
    imageNovel: 'https://img.dtruyen.com/public/images/large/phamnhantutien1VpD8ee.jpg',
    authors: [{ nameAuthor: 'Vong Ngữ' }],
    categories: [{ nameCategory: 'Tiên Hiệp' }],
    rating: 4.8,
    totalChapter: 2446,
  },
  // Thêm một vài truyện nữa nếu muốn
];


// Bước 2: Tạo một Wrapper Component để thêm nút "Bỏ theo dõi"
const LibraryCardWrapper = ({ novel, onUnfollow }) => (
  <div className="relative group">
    {/* Component NovelCard gốc */}
    <NovelCard novel={novel} />
    
    {/* Nút Bỏ theo dõi được đặt chồng lên trên */}
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
  const navigate = useNavigate();

  // Giả lập trạng thái người dùng đã đăng nhập
  const currentUser = { id: 'mock-user-id' }; 

  const [followedNovels, setFollowedNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const timer = setTimeout(() => {
      setFollowedNovels(mockFollowedNovels);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentUser, navigate]);

  const handleUnfollow = (idNovel) => {
    if(window.confirm('Bạn có chắc muốn bỏ theo dõi truyện này không?')) {
        setFollowedNovels(currentNovels => currentNovels.filter(novel => novel.idNovel !== idNovel));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin mr-3" size={32} />
        Đang tải tủ truyện...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 dark text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-sky-400 mb-2 border-b-2 border-sky-500/30 pb-3">Tủ truyện của tôi</h1>
        <p className="text-gray-400 mb-8">
            {followedNovels.length} truyện đang được theo dõi.
        </p>

        {followedNovels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {followedNovels.map((novel) => (
              // Bước 3: Sử dụng Wrapper Component
              <LibraryCardWrapper key={novel.idNovel} novel={novel} onUnfollow={handleUnfollow} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-800 rounded-lg">
            <BookX size={64} className="mx-auto text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-300">Tủ truyện trống</h2>
            <p className="mt-2 text-gray-500">Bạn chưa theo dõi truyện nào cả. Hãy tìm và theo dõi những truyện bạn yêu thích nhé!</p>
            <Link to="/" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors">
              Khám phá truyện mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;