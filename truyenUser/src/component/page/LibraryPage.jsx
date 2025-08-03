import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, BookHeart, ShoppingCart, Calendar, Coins, Trash2, ChevronDown, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import Footer from '../Footer';
import { LyberiNovels } from '../../redux/novelSlice';
import { getTransactions, getAllTransactions } from '../../redux/transactionSlice';
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('followed');
  const [followedPage, setFollowedPage] = useState(1);
  const [purchasedPage, setPurchasedPage] = useState(1);
  const [rentedPage, setRentedPage] = useState(1);
  const [expandedNovels, setExpandedNovels] = useState({});

  const ITEMS_PER_PAGE_FOLLOWED = 12;
  const ITEMS_PER_PAGE_PURCHASED = 5;
  const ITEMS_PER_PAGE_RENTED = 5;

  const { currentUser } = useSelector((state) => state.user);
  const { followedNovels, loading: novelsLoading, error: novelsError } = useSelector((state) => state.novels);
  const { 
    transactions, 
    transactionLoading, 
    transactionError,
    allTransactions,
    allTransactionLoading,
    allTransactionError
  } = useSelector((state) => state.transaction);

  // Chỉ fetch khi user đổi hoặc khi chuyển tab, tránh spam API
  const fetchedFollowed = React.useRef(false);
  const fetchedPurchased = React.useRef(false);
  const fetchedRented = React.useRef(false);

  useEffect(() => {
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để xem thư viện.');
      navigate('/');
      return;
    }
    
    // Chỉ fetch truyện theo dõi nếu chưa có data và chưa fetch cho user hiện tại
    if (!fetchedFollowed.current && !followedNovels.length) {
      console.log('🔄 [LibraryPage] Fetching followed novels...');
      dispatch(LyberiNovels({ idUser: currentUser.idUser }));
      fetchedFollowed.current = true;
    } else if (followedNovels.length > 0) {
      console.log('✅ [LibraryPage] Followed novels already loaded:', followedNovels.length);
      fetchedFollowed.current = true;
    }
    
    // Chỉ fetch truyện đã mua nếu chưa có data và chưa fetch cho user hiện tại
    if (!fetchedPurchased.current && (!transactions?.purchasedChapters?.length)) {
      console.log('🔄 [LibraryPage] Fetching purchased chapters...');
      dispatch(getTransactions({ idUser: currentUser.idUser }));
      fetchedPurchased.current = true;
    } else if (transactions?.purchasedChapters?.length > 0) {
      console.log('✅ [LibraryPage] Purchased chapters already loaded:', transactions.purchasedChapters.length);
      fetchedPurchased.current = true;
    }
    
    // Chỉ fetch truyện đã thuê nếu chưa có data và chưa fetch cho user hiện tại
    if (!fetchedRented.current && (!allTransactions?.rentedChapters?.length)) {
      console.log('🔄 [LibraryPage] Fetching rented chapters...');
      dispatch(getAllTransactions({ statusDeposit: 'SUCCESS', idUser: currentUser.idUser }));
      fetchedRented.current = true;
    } else if (allTransactions?.rentedChapters?.length > 0) {
      console.log('✅ [LibraryPage] Rented chapters already loaded:', allTransactions.rentedChapters.length);
      fetchedRented.current = true;
    }
    
    // Reset flag nếu user logout
    return () => {
      if (!currentUser?.idUser) {
        fetchedFollowed.current = false;
        fetchedPurchased.current = false;
        fetchedRented.current = false;
      }
    };
  }, [dispatch, currentUser, navigate, followedNovels.length, transactions?.purchasedChapters?.length, allTransactions?.rentedChapters?.length]);

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

  // Logic cho tab "Truyện đã thuê"
  const rentedItems = useMemo(() => {
    if (activeTab !== 'rented' || !allTransactions || !allTransactions.rentedNovels) {
      return [];
    }

    const groups = Object.values(allTransactions.rentedNovels).map((novel) => ({
      novelId: novel.idNovel,
      novelTitle: novel.nameNovel || 'Truyện không tên',
      coverImage: novel.imageNovel,
      statusNovel: novel.statusNovel,
      chapters: novel.chapterBoughtRespone
        ? novel.chapterBoughtRespone
            .map((chapter) => {
              const expirationDate = new Date(chapter.rentExpiration);
              const now = new Date();
              const isExpired = now > expirationDate;
              const daysLeft = isExpired ? 0 : Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
              
              return {
                ...chapter,
                dateBuy: chapter.dateBuy,
                rentExpiration: chapter.rentExpiration,
                expirationDate,
                isExpired,
                daysLeft
              };
            })
            .sort((a, b) => (a.indexChapter || 0) - (b.indexChapter || 0))
        : [],
    }));

    return groups;
  }, [allTransactions, activeTab]);

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

  // Phân trang cho tab "Truyện đã thuê"
  const paginatedRentedItems = useMemo(() => {
    const start = (rentedPage - 1) * ITEMS_PER_PAGE_RENTED;
    const end = start + ITEMS_PER_PAGE_RENTED;
    return rentedItems.slice(start, end);
  }, [rentedItems, rentedPage]);

  const totalRentedPages = Math.ceil(rentedItems.length / ITEMS_PER_PAGE_RENTED);

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
      // Tạo date với UTC và cộng 7 giờ để chuyển sang timezone Việt Nam
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
      const vietnamDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // +7 giờ
      
      return vietnamDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' // Hiển thị theo UTC vì đã adjust rồi
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
              ? isDarkMode 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
              currentPage === page 
                ? 'bg-sky-400 text-white' 
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              ? isDarkMode 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          Sau
        </button>
      </div>
    );
  };

  if (novelsLoading || (activeTab === 'purchased' && transactionLoading) || (activeTab === 'rented' && allTransactionLoading)) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <Loader2 className="animate-spin mr-3" size={32} />
        {activeTab === 'purchased' ? 'Đang tải giao dịch...' : activeTab === 'rented' ? 'Đang tải danh sách thuê...' : 'Đang tải thư viện...'}
      </div>
    );
  }

  const isEmptyFollowListError = novelsError === 'Bạn chưa theo dõi truyện nào.';

  const renderFollowedTab = () => {
    if (novelsError && !isEmptyFollowListError) {
      return (
        <div className={`text-center py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
          <BookX size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Có lỗi xảy ra</h2>
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
      <div className={`text-center py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
        <BookX size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tủ truyện trống</h2>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Bạn chưa theo dõi truyện nào cả.</p>
        <Link
          to="/"
          className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors"
        >
          Khám phá truyện mới
        </Link>
      </div>
    );
  };

  const renderPurchasedTab = () => {
    if (transactionError) {
      return (
        <div className={`text-center py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
          <BookX size={64} className="mx-auto text-red-600" />
          <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Có lỗi xảy ra</h2>
          <p className="mt-2 text-red-500">{transactionError}</p>
          <button
            onClick={() => dispatch(getTransactions({ idUser: currentUser.idUser }))}
            className="mt-4 bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors"
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
              <div key={novelGroup.novelId} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="flex items-center mb-6">
                  <img
                    src={novelGroup.coverImage || 'https://via.placeholder.com/48x64.png?text=N'}
                    alt={novelGroup.novelTitle}
                    className="w-12 h-16 object-cover rounded mr-4 shadow-md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className={`text-2xl font-semibold ${
                        isDarkMode ? 'text-gray-200 hover:text-sky-400' : 'text-gray-800 hover:text-sky-600'
                      } transition-colors mb-1`}>
                        <Link to={`/novel/${novelGroup.novelId}`}>{novelGroup.novelTitle}</Link>
                      </h2>
                      <button
                        onClick={() => toggleNovelChapters(novelGroup.novelId)}
                        className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
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
                            ? 'bg-green-100 text-green-800'
                            : novelGroup.statusNovel === 'CONTINUE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
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
                        className={`${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        } rounded-lg p-4 transition-colors group shadow-sm`}
                      >
                        <Link to={`/novel/${novelGroup.novelId}/chapter/${chapter.idChapter}`} className="block">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`${
                              isDarkMode 
                                ? 'text-gray-300 group-hover:text-white' 
                                : 'text-gray-700 group-hover:text-gray-900'
                            } font-medium truncate mr-2`}>
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
      <div className={`text-center py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
        <ShoppingCart size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chưa mua chương nào</h2>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Các chương bạn mua sẽ xuất hiện ở đây.</p>
        <Link
          to="/"
          className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors"
        >
          Khám phá truyện mới
        </Link>
      </div>
    );
  };

  const renderRentedTab = () => {
    if (allTransactionError) {
      return (
        <div className={`text-center py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
          <BookX size={64} className="mx-auto text-red-600" />
          <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Có lỗi xảy ra</h2>
          <p className="mt-2 text-red-500">{allTransactionError}</p>
          <button
            onClick={() => dispatch(getAllTransactions({ statusDeposit: 'SUCCESS', idUser: currentUser?.idUser }))}
            className="mt-4 bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (paginatedRentedItems.length > 0) {
      return (
        <>
          <div className="space-y-8">
            {paginatedRentedItems.map((novelGroup) => (
              <div key={novelGroup.novelId} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                <div className="flex items-center mb-6">
                  <img
                    src={novelGroup.coverImage || 'https://via.placeholder.com/48x64.png?text=N'}
                    alt={novelGroup.novelTitle}
                    className="w-12 h-16 object-cover rounded mr-4 shadow-md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className={`text-2xl font-semibold ${
                        isDarkMode ? 'text-gray-200 hover:text-sky-400' : 'text-gray-800 hover:text-sky-600'
                      } transition-colors mb-1`}>
                        <Link to={`/novel/${novelGroup.novelId}`}>{novelGroup.novelTitle}</Link>
                      </h2>
                      <button
                        onClick={() => toggleNovelChapters(novelGroup.novelId)}
                        className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
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
                            ? 'bg-green-100 text-green-800'
                            : novelGroup.statusNovel === 'CONTINUE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {novelGroup.statusNovel === 'COMPLETED'
                          ? 'Hoàn thành'
                          : novelGroup.statusNovel === 'CONTINUE'
                          ? 'Đang cập nhật'
                          : 'Tạm ngưng'}
                      </span>
                      <span className="ml-4 flex items-center">
                        <Clock size={14} className="mr-1" />
                        {novelGroup.chapters.length} chương đã thuê
                      </span>
                    </div>
                  </div>
                </div>

                {expandedNovels[novelGroup.novelId] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {novelGroup.chapters.map((chapter) => (
                      <div
                        key={chapter.idChapter}
                        className={`${
                          chapter.isExpired 
                            ? isDarkMode
                              ? 'bg-red-900/30 hover:bg-red-900/40' 
                              : 'bg-red-50 hover:bg-red-100 border-red-200'
                            : isDarkMode
                            ? 'bg-purple-900/30 hover:bg-purple-900/40'
                            : 'bg-purple-50 hover:bg-purple-100 border-purple-200'
                        } rounded-lg p-4 transition-colors group shadow-sm ${!isDarkMode ? 'border' : ''}`}
                      >
                        <Link to={`/novel/${novelGroup.novelId}/chapter/${chapter.idChapter}`} className="block">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-medium truncate mr-2 transition-colors ${
                              chapter.isExpired
                                ? isDarkMode
                                  ? 'text-red-300 group-hover:text-red-200'
                                  : 'text-red-700 group-hover:text-red-800'
                                : isDarkMode
                                ? 'text-purple-300 group-hover:text-purple-200'
                                : 'text-purple-700 group-hover:text-purple-800'
                            }`}>
                              Chương {chapter.indexChapter}: {chapter.titleChapter || 'Chưa có tiêu đề'}
                            </h3>
                            {chapter.isExpired && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                isDarkMode ? 'bg-red-700 text-red-200' : 'bg-red-600 text-white'
                              }`}>
                                Hết hạn
                              </span>
                            )}
                          </div>
                          <div className={`flex flex-col text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} space-y-1`}>
                            <div className="flex items-center">
                              <Calendar size={12} className="mr-1" />
                              <span>Thuê: {formatDate(chapter.dateBuy)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {chapter.isExpired ? (
                                <span className="text-red-500">Đã hết hạn</span>
                              ) : (
                                <span className={isDarkMode ? 'text-purple-500' : 'text-purple-600'}>
                                  Còn {chapter.daysLeft} ngày
                                </span>
                              )}
                            </div>
                            <div>
                              Hết hạn: {chapter.expirationDate.toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {renderPagination(rentedPage, totalRentedPages, setRentedPage)}
        </>
      );
    }

    return (
      <div className={`text-center py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
        <Clock size={64} className={`mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h2 className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chưa thuê chương nào</h2>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Các chương bạn thuê sẽ xuất hiện ở đây.</p>
        <Link
          to="/"
          className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors"
        >
          Khám phá truyện mới
        </Link>
      </div>
    );
  };

  const purchasedChapterCount = transactions?.purchasedChapters?.length || 0;
  const rentedChapterCount = allTransactions?.rentedChapters?.length || 0;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-4 sm:p-8 flex flex-col`}>
      <div className="max-w-7xl mx-auto flex-grow w-full">
        <h1 className="text-3xl font-bold text-sky-400 mb-6">Thư viện của tôi</h1>

        <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} mb-8`}>
          <button
            onClick={() => {
              setActiveTab('followed');
              setFollowedPage(1);
            }}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'followed' 
                ? 'border-b-2 border-sky-400 text-sky-400' 
                : isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
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
                ? 'border-b-2 border-sky-400 text-sky-400' 
                : isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingCart size={16} className="mr-2" />
            Đã mua ({purchasedChapterCount})
            {transactionLoading && <Loader2 size={14} className="ml-2 animate-spin" />}
          </button>
          <button
            onClick={() => {
              setActiveTab('rented');
              setRentedPage(1);
            }}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'rented' 
                ? 'border-b-2 border-sky-400 text-sky-400' 
                : isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock size={16} className="mr-2" />
            Đã thuê ({rentedChapterCount})
            {allTransactionLoading && <Loader2 size={14} className="ml-2 animate-spin" />}
          </button>
        </div>

        <div>
          {activeTab === 'followed' 
            ? renderFollowedTab() 
            : activeTab === 'purchased' 
            ? renderPurchasedTab() 
            : renderRentedTab()
          }
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LibraryPage;