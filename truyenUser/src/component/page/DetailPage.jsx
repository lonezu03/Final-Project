// src/pages/DetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import { useParams, Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { getNovelById,LyberiNovels,getAllReviews  } from '../../redux/novelSlice';
import {followNovel} from '../../redux/userSlice'
import { getAllChapters } from '../../redux/chapterSlice'; // Action này lấy danh sách chương cho tab
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaStar, FaBookOpen, FaListUl, FaPlusSquare, FaRegHeart, FaHeart, FaInfoCircle, FaThList, FaAngleRight, FaPenSquare } from 'react-icons/fa';
import GoToChapterInput from '../GoToChapterInput'; // Đường dẫn component
import PaginationControls from '../PaginationChapter'; // Đường dẫn component
import ChapterListDisplay from '../ChapterListDisplay'; // Đường dẫn component
import ReviewDialog from '../ReviewDialog'; // Import component dialog
import NovelReviews from '../NovelReviews'; 
  import CartWidget from '../CartWidget'; // Import CartWidget 

const DetailPage = () => {
  const { novelId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Sử dụng theme context
  const { currentNovel: novelDetailData, loading: novelLoading, error: novelError } = useSelector((state) => state.novels);
  const { chapters: chaptersFromApiForDetailPage, loading: chaptersLoading, error: chaptersError } = useSelector((state) => state.chapters);
  // chaptersFromApiForDetailPage là danh sách chương cho tab "Danh Sách"
  const [showReviewDialog, setShowReviewDialog] = useState(false); // THÊM: State để quản lý dialog
  const [activeTab, setActiveTab] = useState('summary');
  const [currentChapterListPage, setCurrentChapterListPage] = useState(1); // Đổi tên để rõ ràng
  const chaptersPerPageInList = 50;
  const { currentUser, followedNovels, userHistory } = useSelector((state) => state.user);

  // Chỉ fetch dữ liệu khi novelId đổi, tránh spam API
  const fetchedNovel = React.useRef({});
  const lastFetchedNovelId = React.useRef(null);
  
  useEffect(() => {
    if (novelId && String(novelId) !== String(lastFetchedNovelId.current)) {
      console.log('🔍 [DetailPage] novelId from URL:', novelId, 'type:', typeof novelId);
      setActiveTab('summary');
      setCurrentChapterListPage(1);
      
      // Kiểm tra xem đã có novel data trong store chưa
      const shouldFetchNovel = !novelDetailData || String(novelDetailData.idNovel) !== String(novelId);
      // Kiểm tra xem đã có chapters data trong store chưa
      const shouldFetchChapters = !chaptersFromApiForDetailPage || chaptersFromApiForDetailPage.length === 0;
      
      const promises = [];
      
      if (shouldFetchNovel) {
        console.log('🔄 [DetailPage] Fetching novel data for:', novelId);
        promises.push(dispatch(getNovelById(novelId)));
      } else {
        console.log('✅ [DetailPage] Novel data already available in store');
      }
      
      if (shouldFetchChapters) {
        console.log('🔄 [DetailPage] Fetching chapters data for:', novelId);
        promises.push(dispatch(getAllChapters(novelId)));
      } else {
        console.log('✅ [DetailPage] Chapters data already available in store');
      }
      
      // Luôn fetch reviews vì có thể có review mới
      promises.push(dispatch(getAllReviews(novelId)));
      
      Promise.all(promises);
      lastFetchedNovelId.current = novelId;
    } else {
      console.log('✅ [DetailPage] Data already available for novelId:', novelId);
    }
  }, [dispatch, novelId, novelDetailData, chaptersFromApiForDetailPage]);
 // Tối ưu việc fetch danh sách theo dõi
 const fetchedLibrary = React.useRef(null);
 
 useEffect(() => {
    // Chỉ tải danh sách theo dõi khi user thay đổi và chưa tải cho user này
    if (currentUser?.idUser && fetchedLibrary.current !== currentUser.idUser) {
        console.log('🔄 [DetailPage] Fetching library for user:', currentUser.idUser);
        dispatch(LyberiNovels({ idUser: currentUser.idUser }));
        fetchedLibrary.current = currentUser.idUser;
    }
    
    // Reset khi user logout
    if (!currentUser?.idUser && fetchedLibrary.current !== null) {
        fetchedLibrary.current = null;
    }
  }, [currentUser?.idUser, dispatch]); // Chỉ theo dõi idUser

 const isFollowing = useMemo(() => {
  return Array.isArray(followedNovels) && followedNovels.includes(novelId);
}, [followedNovels, novelId]);
  const handleFollowToggle = () => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để theo dõi truyện!");
      navigate('/');
      return;
    }

    const actionPayload = { idUser: currentUser.idUser, idNovel: novelId };

    // Kiểm tra nếu người dùng đã theo dõi truyện
    if (isFollowing) {
      // Gọi action để bỏ theo dõi truyện
      dispatch(followNovel(actionPayload))
        .unwrap()
        .then(() => {
          toast.success("Đã bỏ theo dõi truyện.");
          // Chỉ tải lại danh sách theo dõi, không cần tải lại toàn bộ
          dispatch(LyberiNovels({ idUser: currentUser.idUser }));
        })
        .catch((err) => {
          console.error('Error unfollowing novel:', err);
          toast.error(`Lỗi: ${err.message || err}`);
        });
    } else {
      // Gọi action để theo dõi truyện
      dispatch(followNovel(actionPayload))
        .unwrap()
        .then(() => {
          toast.success("Đã theo dõi truyện thành công!");
          // Chỉ tải lại danh sách theo dõi, không cần tải lại toàn bộ
          dispatch(LyberiNovels({ idUser: currentUser.idUser }));
        })
        .catch((err) => {
          console.error('Error following novel:', err);
          toast.error(`Lỗi: ${err.message || err}`);
        });
    }
  };

 const handleNavigateToChapter = (targetChapterId) => {
    if (!currentUser) {
        toast.info("Vui lòng đăng nhập để đọc chương này.");
        navigate('/login');
        return;
    } 
    
    if (!targetChapterId) {
        toast.warn("Không thể xác định chương cần đọc.");
        return;
    }

    // Logic kiểm tra chương đã mua
    const isPurchased = currentUser.chapterBought?.includes(targetChapterId);

    if (isPurchased) {
      // Nếu đã mua, cho phép điều hướng
      console.log('🔄 [DetailPage] Navigating to chapter:', targetChapterId);
      navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
    } else {
      // Nếu chưa mua, thông báo lỗi và chuyển tab
      toast.error("Bạn cần mua chương này để có thể đọc. Vui lòng tìm chương trong danh sách bên dưới.");
      setActiveTab('chapters');
    }
  };


  const handleOpenReviewDialog = () => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để đánh giá!");
      navigate('/login');
      return;
    }
    console.log('📝 [DetailPage] Opening review dialog for novel:', novelId);
    setShowReviewDialog(true);
  };

  const renderErrorText = (err) => {
    const errorMessage = typeof err === 'string' ? err : err?.message || 'Đã có lỗi xảy ra.';
    console.error('❌ [DetailPage] Error occurred:', errorMessage);
    return errorMessage;
  };

  const sortedChaptersForDetailPage = useMemo(() => {
    if (chaptersFromApiForDetailPage && Array.isArray(chaptersFromApiForDetailPage)) {
      return [...chaptersFromApiForDetailPage].sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
    }
    return [];
  }, [chaptersFromApiForDetailPage]);

  const handleReadFirstChapter = () => {
    if (sortedChaptersForDetailPage.length > 0) {
      const firstChapter = sortedChaptersForDetailPage[0];
      console.log('📖 [DetailPage] Reading first chapter:', firstChapter?.idChapter);
      handleNavigateToChapter(firstChapter?.idChapter);
    } else if (!chaptersLoading) {
      console.warn('⚠️ [DetailPage] No chapters available');
      toast.info("Truyện này chưa có chương nào.");
    }
  };

  const handleReadLatestChapter = () => {
    if (sortedChaptersForDetailPage.length > 0) {
      const latestChapter = sortedChaptersForDetailPage[sortedChaptersForDetailPage.length - 1];
      console.log('🔥 [DetailPage] Reading latest chapter:', latestChapter?.idChapter);
      handleNavigateToChapter(latestChapter?.idChapter);
    } else if (!chaptersLoading) {
      console.warn('⚠️ [DetailPage] No chapters available for latest');
      toast.info("Truyện này chưa có chương nào.");
    }
  };

  const handleReadContinue = () => {
    // Tìm chương cuối cùng đã đọc từ userHistory trong Redux store
    let lastReadChapterId = null;
    
    console.log('🔍 [DetailPage] Looking for continue reading position...');
    
    if (userHistory && Array.isArray(userHistory)) {
      // Tìm novel hiện tại trong lịch sử
      const currentNovelHistory = userHistory.find(novelGroup => 
        novelGroup.idNovel === novelId || novelGroup.idNovel === parseInt(novelId)
      );
      
      if (currentNovelHistory && Array.isArray(currentNovelHistory.historyReadRespones)) {
        // Sắp xếp các chương theo thời gian đọc gần nhất
        const sortedChapters = [...currentNovelHistory.historyReadRespones].sort((a, b) => {
          const timeA = Array.isArray(a.readingTime) ? new Date(...a.readingTime.slice(0, 3), ...a.readingTime.slice(3)).getTime() : 0;
          const timeB = Array.isArray(b.readingTime) ? new Date(...b.readingTime.slice(0, 3), ...b.readingTime.slice(3)).getTime() : 0;
          return timeB - timeA; // Sắp xếp từ mới nhất đến cũ nhất
        });
        
        if (sortedChapters.length > 0) {
          lastReadChapterId = sortedChapters[0].id?.idChapter;
          console.log('✅ [DetailPage] Found last read chapter from server:', lastReadChapterId);
        }
      }
    }
    
    // Fallback về localStorage nếu không tìm thấy trong userHistory
    if (!lastReadChapterId) {
      lastReadChapterId = localStorage.getItem(`lastRead_${novelId}`);
      if (lastReadChapterId) {
        console.log('📱 [DetailPage] Found last read chapter from localStorage:', lastReadChapterId);
      }
    }
    
    if (lastReadChapterId) {
      const chapterExists = sortedChaptersForDetailPage.some(ch => ch.idChapter.toString() === lastReadChapterId.toString());
      if (chapterExists) {
        console.log('🔄 [DetailPage] Continuing from chapter:', lastReadChapterId);
        handleNavigateToChapter(lastReadChapterId);
      } else {
        console.warn(`Chapter ID ${lastReadChapterId} đã lưu không hợp lệ. Đọc từ đầu.`);
        handleReadFirstChapter();
      }
    } else {
      console.log('📖 [DetailPage] No reading history found, starting from first chapter');
      handleReadFirstChapter();
    }
  };

  // Early returns với improved loading states
  if (novelLoading && !novelDetailData) {
    console.log('⏳ [DetailPage] Loading novel data...');
    return <div className={`flex justify-center items-center min-h-screen text-xl p-10 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Đang tải thông tin truyện...</div>;
  }
  
  if (novelError && !novelDetailData) {
    console.error('❌ [DetailPage] Novel loading error:', novelError);
    return <div className={`flex justify-center items-center min-h-screen text-red-500 text-xl p-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>Lỗi tải thông tin truyện: {renderErrorText(novelError)}</div>;
  }
  
  if (!novelDetailData && !novelLoading) {
    console.warn('⚠️ [DetailPage] No novel data found');
    return <div className={`flex justify-center items-center min-h-screen text-xl p-10 ${isDarkMode ? 'text-white bg-gray-900' : 'text-gray-800 bg-gray-50'}`}>Không tìm thấy truyện.</div>;
  }
  
  if (!novelDetailData) return null;
  let authorDisplay = novelDetailData.authors?.map(auth => auth.nameAuthor || "N/A").join(', ') || "Chưa rõ tác giả";
  let categoriesDisplay = novelDetailData.categories?.map(cat => cat.nameCategory || "N/A") || ["Chưa phân loại"];
  if (categoriesDisplay.length === 0) categoriesDisplay = ["Chưa phân loại"];


  const storyDetails = {
    title: novelDetailData.nameNovel || "N/A",
    shortDescription: novelDetailData.descriptionNovel ? `${novelDetailData.descriptionNovel.substring(0, 150)}...` : "Đọc truyện chữ...",
    author: authorDisplay,
    ratingValue: parseFloat(novelDetailData.rating) || 0,
    ratingCount: novelDetailData.ratingCount || 0,
    chapters: novelDetailData.totalChapter || sortedChaptersForDetailPage.length || 0,
    views: novelDetailData.totalView || "0",
    bookmarks: novelDetailData.totalFollower || "0",
    status: novelDetailData.statusNovel || "Đang cập nhật",
    categories: categoriesDisplay,
    coverImage: novelDetailData.imageNovel || "https://via.placeholder.com/200x300.png?text=No+Image",
    heroBackground: novelDetailData.imageNovel || "https://truyenchu.com.vn/theme/images/bg_detail.png",
    fullDescription: novelDetailData.descriptionNovel || "Chưa có mô tả chi tiết.",
    ads: novelDetailData.ads || [{ id: 1, image: "https://tpc.googlesyndication.com/simgad/12350005988817403671" }],
  };

  const totalChapterListPages = Math.ceil((storyDetails.chapters || 0) / chaptersPerPageInList) || 1;
  const currentChaptersForTabDisplay = sortedChaptersForDetailPage.slice(
    (currentChapterListPage - 1) * chaptersPerPageInList,
    currentChapterListPage * chaptersPerPageInList
  );

  const handleGoToChapterInTab = (chapterNum) => {
    console.log('🔍 [DetailPage] Going to chapter number:', chapterNum);
    const targetChapter = sortedChaptersForDetailPage.find(chap => chap.chapterNumber === chapterNum);
    if (targetChapter?.idChapter) {
      console.log('✅ [DetailPage] Found chapter, navigating to:', targetChapter.idChapter);
      navigate(`/novel/${novelId}/chapter/${targetChapter.idChapter}`);
    } else {
      const targetPage = Math.ceil(chapterNum / chaptersPerPageInList);
      if (targetPage >= 1 && targetPage <= totalChapterListPages) {
        console.log('📄 [DetailPage] Chapter not in current page, switching to page:', targetPage);
        setCurrentChapterListPage(targetPage);
      } else {
        console.warn('⚠️ [DetailPage] Invalid chapter number:', chapterNum);
        alert("Số chương không hợp lệ.");
      }
    }
  };

  const handlePageChangeInTab = (page) => {
    console.log('📄 [DetailPage] Changing to page:', page);
    if (page >= 1 && page <= totalChapterListPages) {
      setCurrentChapterListPage(page);
    }
  };

  const handleSortChaptersInTab = () => {
    console.log('🔄 [DetailPage] Sorting chapters in tab');
    // Implement sorting logic if needed
  };


  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
      {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} className="text-yellow-400" />)}
      {halfStar && <FaStar key="half" className="text-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className="text-gray-300" />)}
      </>
    );
  };

  const getStatusTextAndColor = (status) => {
    switch (status) {
      case 'COMPLETED': return { text: 'Hoàn thành', color: 'text-green-400' };
      case 'CONTINUE': return { text: 'Đang ra', color: 'text-yellow-400' };
      case 'DROP': return { text: 'Tạm ngưng', color: 'text-red-400' };
      default: return { text: 'Đang cập nhật', color: 'text-gray-400' };
    }
  };
  const novelStatus = getStatusTextAndColor(storyDetails.status);


  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-gray-300' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white text-gray-800'
    }`}>
      <div className={`container mx-auto px-4 py-2 text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <Link to="/" className={`${
          isDarkMode ? 'hover:text-sky-400' : 'hover:text-sky-600'
        }`}>Trang Chủ</Link> / <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{storyDetails.title.replace(" - Truyện Chữ", "")}</span>
      </div>

      <div className="py-8 md:py-12 bg-no-repeat bg-cover bg-center relative" style={{ backgroundImage: `url('${storyDetails.heroBackground}')` }}>
        <div className={`absolute inset-0 ${
          isDarkMode ? 'bg-black opacity-80' : 'bg-black opacity-60'
        }`}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0 mx-auto md:mx-0">
              <img src={storyDetails.coverImage} alt={`Bìa truyện ${storyDetails.title}`} className="w-full max-w-[180px] md:max-w-full h-auto rounded-md shadow-lg mx-auto aspect-[2/3] object-cover"/>
            </div>
            <div className="md:w-3/4 lg:w-4/5 text-white text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold">{storyDetails.title}</h1>
              <p className="text-xs md:text-sm text-gray-300 mt-1">{storyDetails.shortDescription}</p>
              <p className="text-sm text-gray-400 mt-2">Tác giả: <a href="#" className={`${
                isDarkMode ? 'hover:text-sky-400' : 'hover:text-sky-300'
              }`}>{storyDetails.author}</a></p>
              <div className="flex items-center justify-center md:justify-start space-x-1 mt-2">
                {renderStars(storyDetails.ratingValue)}
                <span className="text-sm ml-2">({storyDetails.ratingValue.toFixed(1)}/5 {storyDetails.ratingCount > 0 ? ` từ ${storyDetails.ratingCount} lượt` : ''})</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3 mt-3 text-sm">
                <div><span className="block text-gray-400">Chương</span><span className="font-semibold text-lg">{storyDetails.chapters}</span></div>
                <div><span className="block text-gray-400">Lượt Xem</span><span className="font-semibold text-lg">{storyDetails.views}</span></div>
                <div><span className="block text-gray-400">Theo dõi</span><span className="font-semibold text-lg">{storyDetails.bookmarks}</span></div>
                {/* <div><span className="block text-gray-400">Trạng thái</span><span className={`font-semibold text-lg ${novelStatus.color}`}>{novelStatus.text}</span></div> */}
              </div>
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Thể Loại: </span>
                {storyDetails.categories.map((cat, idx) => <a key={idx} href="#" className={`inline-block text-xs px-2 py-1 rounded mr-1 mb-1 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
                }`}>{cat}</a>)}
              </div>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                <button onClick={handleReadFirstChapter} className={`flex items-center font-semibold py-2 px-4 rounded text-sm transition-colors ${
                  isDarkMode 
                    ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}><FaBookOpen className="mr-2" /> Đọc từ đầu</button>
                <button onClick={handleReadContinue} className={`flex items-center font-semibold py-2 px-4 rounded text-sm transition-colors ${
                  isDarkMode 
                    ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}><FaListUl className="mr-2" /> Đọc tiếp</button>
                <button onClick={handleReadLatestChapter} className={`flex items-center font-semibold py-2 px-4 rounded text-sm transition-colors ${
                  isDarkMode 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}><FaPlusSquare className="mr-2" /> Chương mới nhất</button>
              </div>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                <button onClick={() => setActiveTab('summary')} className={`flex items-center py-2 px-3 rounded text-xs transition-colors ${
                  activeTab === 'summary' 
                    ? (isDarkMode ? 'bg-slate-600 text-white' : 'bg-gray-600 text-white')
                    : (isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                }`}><FaInfoCircle className="mr-1 md:mr-2" /> Giới thiệu</button>
                <button onClick={() => setActiveTab('chapters')} className={`flex items-center py-2 px-3 rounded text-xs transition-colors ${
                  activeTab === 'chapters' 
                    ? (isDarkMode ? 'bg-slate-600 text-white' : 'bg-gray-600 text-white')
                    : (isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                }`}><FaThList className="mr-1 md:mr-2" /> Danh Sách</button>
                <button 
                            onClick={handleFollowToggle}
                            className={`flex items-center py-2 px-3 rounded text-xs transition-colors ${
                              isFollowing 
                                ? (isDarkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white')
                                : (isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                            }`}
                          >
                            {isFollowing ? <FaHeart className="mr-1 md:mr-2" /> : <FaRegHeart className="mr-1 md:mr-2" />}
                            {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                          </button>
                          
                          {/* NÚT ĐÁNH GIÁ MỚI */}
                          <button 
                            onClick={() => setShowReviewDialog(true)}
                            className={`flex items-center py-2 px-3 rounded text-xs transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            <FaPenSquare className="mr-1 md:mr-2" /> Đánh giá
                          </button>              
          </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className={`w-full md:flex-grow p-6 rounded-lg shadow-lg transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200 border border-gray-600' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 border border-gray-200'
          }`}>
            {activeTab === 'summary' && (
              <div>
                <h2 className={`text-xl font-semibold mb-4 border-l-4 pl-3 ${
                  isDarkMode ? 'border-sky-400 text-white' : 'border-sky-500 text-gray-800'
                }`}>Tóm Tắt Nội Dung Truyện {storyDetails.title.replace(" - Truyện Chữ", "")}</h2>
                <div className={`prose prose-sm md:prose-base max-w-none ${
                  isDarkMode 
                    ? 'prose-invert text-gray-300' 
                    : 'prose-gray text-gray-700'
                }`} dangerouslySetInnerHTML={{ __html: storyDetails.fullDescription.replace(/\n\n/g, '<p><br/></p>').replace(/\n/g, '<br/>') }} />
                <div className={`mt-6 pt-4 border-t ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <button onClick={handleReadLatestChapter} className={`font-semibold flex items-center text-sm transition-colors ${
                    isDarkMode 
                      ? 'text-sky-400 hover:text-sky-300' 
                      : 'text-sky-500 hover:text-sky-600'
                  }`}>
                    Xem Thêm Chương Mới Nhất <FaAngleRight className="ml-1" />
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'chapters' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-y-3">
                  <h2 className={`text-xl font-semibold border-l-4 pl-3 ${
                    isDarkMode ? 'border-sky-400 text-white' : 'border-sky-500 text-gray-800'
                  }`}>Danh Sách Chương ({storyDetails.chapters})</h2>
                  <div className="flex items-center space-x-3">
                    <GoToChapterInput onGoToChapter={handleGoToChapterInTab} />
                    <PaginationControls
                        currentPage={currentChapterListPage}
                        totalPages={totalChapterListPages}
                        onPageChange={handlePageChangeInTab}
                        onSort={handleSortChaptersInTab}
                        showSortButton={true}
                    />
                  </div>
                </div>
                {chaptersLoading && !currentChaptersForTabDisplay.length && <p className={`text-center py-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Đang tải danh sách chương...</p>}
                {chaptersError && !currentChaptersForTabDisplay.length && <p className="text-red-500 text-center py-4">Lỗi tải chương. Phiên đăng nhập của bạn có thể đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.</p>}
                {!chaptersLoading && !chaptersError && currentChaptersForTabDisplay.length > 0 && (
                  <ChapterListDisplay
                    chapters={currentChaptersForTabDisplay}
                    novelId={novelId} // Truyền novelId xuống
                  />
                )}
                {!chaptersLoading && !chaptersError && sortedChaptersForDetailPage.length === 0 && (
                  <p className={`text-center py-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Truyện này chưa có chương nào.</p>
                )}
                {/* Pagination dưới danh sách chương nếu cần */}
                {totalChapterListPages > 1 && currentChaptersForTabDisplay.length > 0 && (
                     <div className={`flex flex-col sm:flex-row justify-center sm:items-center mt-6 pt-4 border-t gap-y-3 ${
                       isDarkMode ? 'border-gray-600' : 'border-gray-200'
                     }`}>
                        <PaginationControls
                            currentPage={currentChapterListPage}
                            totalPages={totalChapterListPages}
                            onPageChange={handlePageChangeInTab}
                            showSortButton={false}
                        />
                    </div>
                )}
              </div>
            )}
                                        <NovelReviews />

          </div>

          <div className="w-full md:w-64 lg:w-80 md:flex-shrink-0">
            {/* CartWidget - Hiển thị giỏ hàng truyện */}
            <CartWidget novelTitle={storyDetails.title} />
            
            {storyDetails.ads.map(ad => (
              <div key={ad.id} className={`p-1 rounded-lg shadow-lg mb-6 ${
                isDarkMode ? 'bg-slate-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <a href="#" aria-label={`Quảng cáo ${ad.id}`}><img src={ad.image} alt={`Quảng cáo ${ad.id}`} className="w-full h-auto rounded-md object-contain"/></a>
              </div>
            ))}
            
            {showReviewDialog && (
              <ReviewDialog 
                novelId={novelId} 
                novelTitle={novelDetailData.nameNovel} 
                onClose={() => setShowReviewDialog(false)} 
              />
            )}
          </div>
          
        </div>
      </div>

    </div>
  );
};
// Các hàm renderStars và getStatusTextAndColor bạn giữ nguyên
const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
        {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} className="text-yellow-400" />)}
        {halfStar && <FaStar key="half" className="text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className="text-gray-300" />)}
      </>
    );
};

const getStatusTextAndColor = (status) => {
    switch (status) {
      case 'COMPLETED': return { text: 'Hoàn thành', color: 'text-green-400' };
      case 'CONTINUE': return { text: 'Đang ra', color: 'text-yellow-400' };
      case 'DROP': return { text: 'Tạm ngưng', color: 'text-red-400' };
      default: return { text: 'Đang cập nhật', color: 'text-gray-400' };
    }
};
export default DetailPage;