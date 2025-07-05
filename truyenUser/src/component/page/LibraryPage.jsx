import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, Trash2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux'; // Import useSelector và useDispatch
import { LyberiNovels } from '../../redux/novelSlice'; // Import action LyberiNovels
import NovelCard from '../NovelCard';

// Component Bỏ theo dõi
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
  const currentUser = useSelector((state) => state.user.currentUser);

  // Lấy dữ liệu truyện yêu thích từ Redux
  const { followedNovels, loading, error } = useSelector((state) => state.novels);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Lấy danh sách truyện yêu thích khi người dùng đã đăng nhập
    if (currentUser && followedNovels.length === 0 && !loading) {
      dispatch(LyberiNovels({ idUser: currentUser.idUser }));
    }
  }, [dispatch, currentUser, navigate]);

  const handleUnfollow = (idNovel) => {
    if (window.confirm('Bạn có chắc muốn bỏ theo dõi truyện này không?')) {
      // Gọi action từ Redux để bỏ theo dõi
      dispatch({ type: 'novels/unfollow', payload: idNovel });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin mr-3" size={32} />
        Đang tải tủ truyện...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-gray-800 rounded-lg">
        <p className="text-red-500">{error}</p>
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