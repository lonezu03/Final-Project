import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, BookHeart, ShoppingCart, Calendar, Coins, Trash2, ChevronDown } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Footer from '../Footer';
import { LyberiNovels } from '../../redux/novelSlice';
import { getTransactions } from '../../redux/transactionSlice';
import { followNovel } from '../../redux/userSlice';
import NovelCard from '../NovelCard';

const LibraryCardWrapper = ({ novel, onUnfollow }) => (
  <div className="relative group">
    <NovelCard novel={novel} />
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <button
        onClick={() => onUnfollow(novel.idNovel)}
        className="p-2 bg-red-600/80 backdrop-blur-sm text-white rounded-full hover:bg-red-700"
        title="Bỏ theo dõi"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

const LibraryPage = () => {
  const { isDarkMode } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('followed');
  const [followedPage, setFollowedPage] = useState(1);
  const [purchasedPage, setPurchasedPage] = useState(1);
  const [expandedNovels, setExpandedNovels] = useState({});

  const ITEMS_PER_PAGE_FOLLOWED = 12;
  const ITEMS_PER_PAGE_PURCHASED = 5;

  const { currentUser } = useSelector((state) => state.user);
  const { followedNovels, loading: novelsLoading, error: novelsError } = useSelector((state) => state.novels);
  const { transactions, transactionLoading, transactionError } = useSelector((state) => state.transaction);

  // Chỉ fetch khi user đổi hoặc khi chuyển tab, tránh spam API
  const fetchedFollowed = React.useRef(false);
  const fetchedPurchased = React.useRef(false);

  useEffect(() => {
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để xem thư viện.');
      navigate('/');
      return;
    }
    // Chỉ fetch truyện theo dõi 1 lần cho user hiện tại
    if (!fetchedFollowed.current) {
      dispatch(LyberiNovels({ idUser: currentUser.idUser }));
      fetchedFollowed.current = true;
    }
    // Chỉ fetch truyện đã mua 1 lần cho user hiện tại
    if (!fetchedPurchased.current) {
      dispatch(getTransactions({ idUser: currentUser.idUser }));
      fetchedPurchased.current = true;
    }
    // Reset flag nếu user logout
    return () => {
      if (!currentUser?.idUser) {
        fetchedFollowed.current = false;
        fetchedPurchased.current = false;
      }
    };
  }, [dispatch, currentUser, navigate]);

  // Logic cho tab "Truyện đã mua"
  const purchasedItems = useMemo(() => {
    if (activeTab !== 'purchased' || !transactions || !transactions.novelBought) {
      return [];
    }

    const groups = Object.values(transactions.novelBought).map((novel) => ({
      novelId: novel.idNovel,
      novelTitle: novel.nameNovel || 'Truyện không tên',
      coverImage: novel.imageNovel,
      statusNovel: novel.statusNovel,
      chapters: novel.chapterBoughtRespone
        ? novel.chapterBoughtRespone
            .map((chapter) => ({
              ...chapter,
              dateBuy: chapter.dateBuy,
            }))
            .sort((a, b) => (a.indexChapter || 0) - (b.indexChapter || 0))
        : [],
    }));

    return groups;
  }, [transactions, activeTab]);

  // Phân trang cho tab "Truyện theo dõi"
  const paginatedFollowedNovels = useMemo(() => {
    const start = (followedPage - 1) * ITEMS_PER_PAGE_FOLLOWED;
    const end = start + ITEMS_PER_PAGE_FOLLOWED;
    return followedNovels.slice(start, end);
  }, [followedNovels, followedPage]);

  const totalFollowedPages = Math.ceil(followedNovels.length / ITEMS_PER_PAGE_FOLLOWED);

  // Phân trang cho tab "Truyện đã mua"
  const paginatedPurchasedItems = useMemo(() => {
    const start = (purchasedPage - 1) * ITEMS_PER_PAGE_PURCHASED;
    const end = start + ITEMS_PER_PAGE_PURCHASED;
    return purchasedItems.slice(start, end);
  }, [purchasedItems, purchasedPage]);

  const totalPurchasedPages = Math.ceil(purchasedItems.length / ITEMS_PER_PAGE_PURCHASED);

  const handleUnfollow = (idNovel) => {
    if (window.confirm('Bạn có chắc muốn bỏ theo dõi truyện này không?')) {
      if (!currentUser) return;
      dispatch(followNovel({ idUser: currentUser.idUser, idNovel }))
        .unwrap()
        .then(() => {
          toast.success('Đã bỏ theo dõi thành công.');
          dispatch(LyberiNovels({ idUser: currentUser.idUser }));
          // Reset trang về 1 nếu danh sách truyện bị ngắn lại
          if (followedPage > Math.ceil((followedNovels.length - 1) / ITEMS_PER_PAGE_FOLLOWED)) {
            setFollowedPage(1);
          }
        })
        .catch((err) => {
          toast.error(`Lỗi: ${err.message || err}`);
        });
    }
  };

  const toggleNovelChapters = (novelId) => {
    setExpandedNovels((prev) => ({
      ...prev,
      [novelId]: !prev[novelId],
    }));
  };

  const formatDate = (dateArray) => {
    if (!dateArray || !Array.isArray(dateArray)) return 'N/A';
    try {
      const [year, month, day, hour, minute] = dateArray;
      return new Date(year, month - 1, day, hour, minute).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const renderPagination = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === 1
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          Trước
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`px-3 py-1 rounded-md text-sm ${
              currentPage === page ? 'bg-sky-400 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === totalPages
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          Sau
        </button>
      </div>
    );
  };

  if (novelsLoading || (activeTab === 'purchased' && transactionLoading)) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <Loader2 className="animate-spin mr-3" size={32} />
        {activeTab === 'purchased' ? 'Đang tải giao dịch...' : 'Đang tải thư viện...'}
      </div>
    );
  }

  const isEmptyFollowListError = novelsError === 'Bạn chưa theo dõi truyện nào.';

  const renderFollowedTab = () => {
    if (novelsError && !isEmptyFollowListError) {
      return (
        <div className={`text-center py-20 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <BookX size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Có lỗi xảy ra</h2>
          <p className="mt-2 text-red-500">{novelsError}</p>
        </div>
      );
    }

    if (paginatedFollowedNovels.length > 0 && !isEmptyFollowListError) {
      return (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {paginatedFollowedNovels.map((novel) => (
              <LibraryCardWrapper key={novel.idNovel} novel={novel} onUnfollow={handleUnfollow} />
            ))}
          </div>
          {renderPagination(followedPage, totalFollowedPages, setFollowedPage)}
        </>
      );
    }

    return (
      <div className={`text-center py-20 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}> 
        <BookX size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Tủ truyện trống</h2>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Bạn chưa theo dõi truyện nào cả.</p>
        <Link
          to="/"
          className={`mt-6 inline-block font-bold py-2 px-5 rounded-md transition-colors ${isDarkMode ? 'bg-sky-700 text-white hover:bg-sky-600' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
        >
          Khám phá truyện mới
        </Link>
      </div>
    );
  };

  const renderPurchasedTab = () => {
    if (transactionError) {
      return (
        <div className={`text-center py-20 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <BookX size={64} className={`mx-auto text-red-600`} />
          <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Có lỗi xảy ra</h2>
          <p className="mt-2 text-red-500">{transactionError}</p>
          <button
            onClick={() => dispatch(getTransactions({ idUser: currentUser.idUser }))}
            className={`mt-4 font-bold py-2 px-5 rounded-md transition-colors ${isDarkMode ? 'bg-sky-700 text-white hover:bg-sky-600' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (paginatedPurchasedItems.length > 0) {
      return (
        <>
          <div className="space-y-8">
            {paginatedPurchasedItems.map((novelGroup) => (
              <div key={novelGroup.novelId} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-6`}>
                <div className="flex items-center mb-6">
                  <img
                    src={novelGroup.coverImage || 'https://via.placeholder.com/48x64.png?text=N'}
                    alt={novelGroup.novelTitle}
                    className="w-12 h-16 object-cover rounded mr-4 shadow-md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className={`text-2xl font-semibold mb-1 transition-colors ${isDarkMode ? 'text-gray-200 hover:text-sky-400' : 'text-gray-800 hover:text-sky-600'}`}>
                        <Link to={`/novel/${novelGroup.novelId}`}>{novelGroup.novelTitle}</Link>
                      </h2>
                      <button
                        onClick={() => toggleNovelChapters(novelGroup.novelId)}
                        className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-300 ${expandedNovels[novelGroup.novelId] ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                    <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          novelGroup.statusNovel === 'COMPLETED'
                            ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800')
                            : novelGroup.statusNovel === 'CONTINUE'
                            ? (isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                            : (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800')
                        }`}
                      >
                        {novelGroup.statusNovel === 'COMPLETED'
                          ? 'Hoàn thành'
                          : novelGroup.statusNovel === 'CONTINUE'
                          ? 'Đang cập nhật'
                          : 'Tạm ngưng'}
                      </span>
                      <span className="ml-4 flex items-center">
                        <Coins size={14} className="mr-1" />
                        {novelGroup.chapters.length} chương đã mua
                      </span>
                    </div>
                  </div>
                </div>

                {expandedNovels[novelGroup.novelId] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {novelGroup.chapters.map((chapter) => (
                      <div
                        key={chapter.idChapter}
                        className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg p-4 transition-colors group`}
                      >
                        <Link to={`/novel/${novelGroup.novelId}/chapter/${chapter.idChapter}`} className="block">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-medium truncate mr-2 transition-colors ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-800 group-hover:text-gray-900'}`}>
                              Chương {chapter.indexChapter}: {chapter.titleChapter || 'Chưa có tiêu đề'}
                            </h3>
                          </div>
                          <div className={`flex items-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}> 
                            <Calendar size={12} className="mr-1" />
                            <span>Mua: {formatDate(chapter.dateBuy)}</span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {renderPagination(purchasedPage, totalPurchasedPages, setPurchasedPage)}
        </>
      );
    }

    return (
      <div className={`text-center py-20 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}> 
        <ShoppingCart size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Chưa mua chương nào</h2>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Các chương bạn mua sẽ xuất hiện ở đây.</p>
        <Link
          to="/"
          className={`mt-6 inline-block font-bold py-2 px-5 rounded-md transition-colors ${isDarkMode ? 'bg-sky-700 text-white hover:bg-sky-600' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
        >
          Khám phá truyện mới
        </Link>
      </div>
    );
  };

  const purchasedChapterCount = transactions?.purchasedChapters?.length || 0;

  return (
    <div className={`min-h-screen flex flex-col p-4 sm:p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto flex-grow w-full">
        <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>Thư viện của tôi</h1>

        <div className={`flex border-b mb-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}> 
          <button
            onClick={() => {
              setActiveTab('followed');
              setFollowedPage(1);
            }}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'followed'
                ? isDarkMode
                  ? 'border-b-2 border-sky-400 text-white'
                  : 'border-b-2 border-sky-600 text-sky-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-400 hover:text-sky-600'
            }`}
          >
            <BookHeart size={16} className="mr-2" />
            Đang theo dõi ({isEmptyFollowListError ? 0 : followedNovels.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('purchased');
              setPurchasedPage(1);
            }}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'purchased'
                ? isDarkMode
                  ? 'border-b-2 border-sky-400 text-white'
                  : 'border-b-2 border-sky-600 text-sky-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-400 hover:text-sky-600'
            }`}
          >
            <ShoppingCart size={16} className="mr-2" />
            Đã mua ({purchasedChapterCount})
            {transactionLoading && <Loader2 size={14} className="ml-2 animate-spin" />}
          </button>
        </div>

        <div>{activeTab === 'followed' ? renderFollowedTab() : renderPurchasedTab()}</div>
      </div>
      <Footer />
    </div>
  );
};

export default LibraryPage;