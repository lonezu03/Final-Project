// src/pages/DetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import { useParams, Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { getNovelById,LyberiNovels,getAllReviews  } from '../../redux/novelSlice';
import {followNovel} from '../../redux/userSlice'
import { getAllChapters, clearChapterState } from '../../redux/chapterSlice'; // Action này lấy danh sách chương cho tab
import { getAllTransactions } from '../../redux/transactionSlice'; // Import action để lấy transactions
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
  const { chapters: chaptersFromApiForDetailPage, currentNovelId, loading: chaptersLoading, error: chaptersError } = useSelector((state) => {
    console.log('🔍 [DetailPage] Full Redux state.chapters:', JSON.stringify(state.chapters, null, 2));
    return state.chapters;
  });
  // chaptersFromApiForDetailPage là danh sách chương cho tab "Danh Sách"
  const [showReviewDialog, setShowReviewDialog] = useState(false); // THÊM: State để quản lý dialog
  const [activeTab, setActiveTab] = useState('summary');
  const [currentChapterListPage, setCurrentChapterListPage] = useState(1); // Đổi tên để rõ ràng
  const chaptersPerPageInList = 50;
  const { currentUser, followedNovels, userHistory } = useSelector((state) => state.user);
  const { allTransactions } = useSelector((state) => state.transaction);

  // Utility function để kiểm tra loại page load
  const getPageLoadType = () => {
    try {
      const navigationType = performance.getEntriesByType('navigation')[0]?.type;
      return {
        isReload: navigationType === 'reload',
        isBackForward: navigationType === 'back_forward',
        isNavigate: navigationType === 'navigate',
        isFirstLoad: !sessionStorage.getItem(`visited_novel_${novelId}`)
      };
    } catch (e) {
      console.warn('⚠️ [DetailPage] Cannot detect page load type:', e);
      return { isReload: false, isBackForward: false, isNavigate: true, isFirstLoad: true };
    }
  };

  // Helper function để kiểm tra chapter có được thuê không và còn hạn không
  const getChapterRentInfo = (chapterId) => {
    if (!allTransactions?.rentedNovels) return null;
    
    for (const novel of Object.values(allTransactions.rentedNovels)) {
      if (novel.chapters && Array.isArray(novel.chapters)) {
        const rentedChapter = novel.chapters.find(ch => String(ch.idChapter) === String(chapterId));
        if (rentedChapter) {
          const expirationDate = new Date(rentedChapter.dateEndRent);
          const now = new Date();
          const isExpired = now > expirationDate;
          const daysLeft = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
          
          return {
            isRented: true,
            isExpired,
            expirationDate,
            daysLeft: isExpired ? 0 : daysLeft
          };
        }
      }
    }
    return null;
  };

  // Chỉ fetch dữ liệu khi novelId đổi, tránh spam API
  const fetchedNovel = React.useRef({});
  const lastFetchedNovelId = React.useRef(null);
  const lastFetchedReviews = React.useRef(null); // Thêm ref cho reviews
  
  // Initialize refs safely - tránh undefined errors khi reload
  React.useEffect(() => {
    if (lastFetchedNovelId.current === undefined) {
      lastFetchedNovelId.current = null;
    }
    if (lastFetchedReviews.current === undefined) {
      lastFetchedReviews.current = null;
    }
  }, []);
  
  // Tối ưu: Batch API calls và intelligent caching với page load detection
  useEffect(() => {
    const pageLoadInfo = getPageLoadType();
    const shouldFetch = novelId && (
      String(novelId) !== String(lastFetchedNovelId.current) || 
      pageLoadInfo.isReload || 
      pageLoadInfo.isFirstLoad
    );
    
    if (shouldFetch) {
      console.log('🔍 [DetailPage] Load info:', {
        novelId,
        loadType: pageLoadInfo,
        lastFetched: lastFetchedNovelId.current
      });
      
      // Mark this novel as visited
      sessionStorage.setItem(`visited_novel_${novelId}`, Date.now().toString());
      
      // Reset refs on reload or first load
      if (pageLoadInfo.isReload || pageLoadInfo.isFirstLoad) {
        console.log('🔄 [DetailPage] Resetting refs due to reload/first load...');
        lastFetchedNovelId.current = null;
        lastFetchedReviews.current = null;
        fetchedLibrary.current = null;
      }
      
      // Chỉ clear chapters data khi navigate between different novels
      if (!pageLoadInfo.isReload && !pageLoadInfo.isFirstLoad && 
          currentNovelId && currentNovelId !== novelId) {
        console.log('🧹 [DetailPage] Clearing chapters for different novel:', currentNovelId, '->', novelId);
        dispatch(clearChapterState());
      }
      
      setActiveTab('summary');
      setCurrentChapterListPage(1);
      
      // Cache configuration với logic thông minh hơn
      const novelCacheKey = `novel_${novelId}`;
      const chaptersCacheKey = `chapters_${novelId}`;
      const reviewsCacheKey = `reviews_${novelId}`;
      const cachedNovel = sessionStorage.getItem(novelCacheKey);
      const cachedChapters = sessionStorage.getItem(chaptersCacheKey);
      const cachedReviews = sessionStorage.getItem(reviewsCacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${novelCacheKey}_timestamp`);
      
      // Dynamic cache duration based on load type
      let CACHE_DURATION;
      if (pageLoadInfo.isReload) {
        CACHE_DURATION = 2 * 60 * 1000; // 2 phút cho reload
      } else if (pageLoadInfo.isBackForward) {
        CACHE_DURATION = 10 * 60 * 1000; // 10 phút cho back/forward
      } else {
        CACHE_DURATION = 15 * 60 * 1000; // 15 phút cho navigate
      }
      
      const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION;
      
      // Smart store checking - avoid checking store on reload
      const hasNovelInStore = !pageLoadInfo.isReload && novelDetailData && 
                             String(novelDetailData.idNovel) === String(novelId);
      const hasChaptersInStore = !pageLoadInfo.isReload && chaptersFromApiForDetailPage && 
                                chaptersFromApiForDetailPage.length > 0 && 
                                String(currentNovelId) === String(novelId);
      
      const apiPromises = [];
      
      // Smart novel data fetching
      if (!hasNovelInStore && (!cachedNovel || !isCacheValid)) {
        console.log('🔄 [DetailPage] Fetching novel data for:', novelId);
        apiPromises.push(
          dispatch(getNovelById(novelId)).then((result) => {
            if (result.payload) {
              sessionStorage.setItem(novelCacheKey, JSON.stringify(result.payload));
              sessionStorage.setItem(`${novelCacheKey}_timestamp`, Date.now().toString());
            }
            return result;
          })
        );
      } else {
        console.log('✅ [DetailPage] Using existing/cached novel data');
      }
      
      // Smart chapters data fetching
      if (!hasChaptersInStore && (!cachedChapters || !isCacheValid)) {
        console.log('🔄 [DetailPage] Fetching chapters data for:', novelId);
        apiPromises.push(
          dispatch(getAllChapters(novelId)).then((result) => {
            if (result.payload) {
              sessionStorage.setItem(chaptersCacheKey, JSON.stringify(result.payload));
            }
            return result;
          })
        );
      } else {
        console.log('✅ [DetailPage] Using existing/cached chapters data');
      }

      // Smart reviews fetching với optimized delay
      if (String(lastFetchedReviews.current) !== String(novelId) && 
          (!cachedReviews || !isCacheValid)) {
        console.log('🔄 [DetailPage] Fetching reviews data for:', novelId);
        lastFetchedReviews.current = novelId;
        
        // Optimized delay based on load type
        const reviewDelay = pageLoadInfo.isReload ? 100 : 
                           pageLoadInfo.isBackForward ? 200 : 500;
        
        setTimeout(() => {
          dispatch(getAllReviews(novelId)).then((result) => {
            if (result.payload) {
              sessionStorage.setItem(reviewsCacheKey, JSON.stringify(result.payload));
            }
          });
        }, reviewDelay);
      } else {
        console.log('✅ [DetailPage] Using existing/cached reviews data');
      }
      
      // Execute API calls with comprehensive error handling
      if (apiPromises.length > 0) {
        console.log(`🔄 [DetailPage] Executing ${apiPromises.length} API calls...`);
        Promise.allSettled(apiPromises).then((results) => {
          const failures = results.filter(result => result.status === 'rejected');
          if (failures.length > 0) {
            console.warn('⚠️ [DetailPage] Some API calls failed:', failures);
            // Retry failed calls after delay
            setTimeout(() => {
              failures.forEach((failure, index) => {
                console.warn(`🔄 [DetailPage] Retrying failed API call ${index + 1}...`);
              });
            }, 2000);
          } else {
            console.log('✅ [DetailPage] All critical data loaded successfully');
          }
        });
      } else {
        console.log('✅ [DetailPage] No API calls needed - using cached/existing data');
      }
      
      lastFetchedNovelId.current = novelId;
    } else {
      console.log('✅ [DetailPage] Data already available for novelId:', novelId);
    }
  }, [dispatch, novelId, currentNovelId, novelDetailData, chaptersFromApiForDetailPage]);
 // Tối ưu việc fetch danh sách theo dõi
 const fetchedLibrary = React.useRef(null);
 const previousUser = React.useRef(null);
 
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

  // Tối ưu: Không cần fetch transactions nữa vì đã có từ Home
  // useEffect(() => {
  //   if (currentUser?.idUser) {
  //     console.log('🔄 [DetailPage] Fetching transactions for user:', currentUser.idUser);
  //     dispatch(getAllTransactions({ statusDeposit: 'SUCCESS' }));
  //   }
  // }, [currentUser?.idUser, dispatch]);

  // Tối ưu: Chỉ track user login status change mà không clear toàn bộ cache
  useEffect(() => {
    // Lưu trạng thái user hiện tại để so sánh lần sau (không trigger re-render)
    if (previousUser.current?.idUser !== currentUser?.idUser) {
      console.log('👤 [DetailPage] User changed:', previousUser.current?.idUser, '->', currentUser?.idUser);
      previousUser.current = currentUser;
    }
  }, [currentUser?.idUser]);

  // Cleanup an toàn - không clear data khi reload
  useEffect(() => {
    return () => {
      // Kiểm tra loại navigation để quyết định cleanup
      const navigationType = performance.getEntriesByType('navigation')[0]?.type;
      const isPageReload = navigationType === 'reload';
      const isHotReload = process.env.NODE_ENV === 'development' && 
                          window.location.href.includes('localhost');
      
      // Chỉ clear khi thực sự navigate away, không phải reload/hot reload
      if (!isPageReload && !isHotReload) {
        console.log('🧹 [DetailPage] Component unmounting (navigation), clearing chapters data...');
        dispatch(clearChapterState());
        
        // Clear refs khi navigate away
        lastFetchedNovelId.current = null;
        lastFetchedReviews.current = null;
        fetchedLibrary.current = null;
      } else {
        console.log('🔄 [DetailPage] Page reload/hot reload detected, preserving data...');
      }
    };
  }, [dispatch]);

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
    if (!targetChapterId) {
        toast.warn("Không thể xác định chương cần đọc.");
        return;
    }

    // Tìm thông tin chapter để kiểm tra giá
    const targetChapter = sortedChaptersForDetailPage.find(ch => ch.idChapter === targetChapterId);
    const coinPrice = targetChapter?.coinPrice || 0;

    // Nếu chapter miễn phí (coinPrice = 0), cho phép đọc ngay cả khi chưa đăng nhập
    if (coinPrice === 0) {
      console.log('📖 [DetailPage] Navigating to free chapter:', targetChapterId);
      navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
      return;
    }

    // Nếu chapter không miễn phí, yêu cầu đăng nhập
    if (!currentUser) {
        toast.info("Vui lòng đăng nhập để đọc chương có phí này.");
        navigate('/');
        return;
    } 

    // Logic kiểm tra chương đã mua hoặc thuê cho user đã đăng nhập
    const isPurchased = currentUser.chapterBought?.includes(targetChapterId);
    
    if (isPurchased) {
      // Nếu đã mua, cho phép điều hướng
      console.log('🔄 [DetailPage] Navigating to purchased chapter:', targetChapterId);
      navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
      return;
    }
    
    // Kiểm tra nếu đã thuê chapter và còn hạn
    const rentInfo = getChapterRentInfo(targetChapterId);
    if (rentInfo?.isRented && !rentInfo?.isExpired) {
      console.log('🔄 [DetailPage] Navigating to rented chapter:', targetChapterId, `(${rentInfo.daysLeft} days left)`);
      navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
      return;
    }

    // Nếu chưa mua và chưa thuê (hoặc hết hạn thuê), thông báo lỗi
    if (rentInfo?.isRented && rentInfo?.isExpired) {
      toast.error("Chương thuê đã hết hạn. Vui lòng thuê lại hoặc mua chương này để đọc.");
    } else {
      toast.error("Bạn cần mua hoặc thuê chương này để có thể đọc. Vui lòng tìm chương trong danh sách bên dưới.");
    }
    setActiveTab('chapters');
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
    // Validation: Chỉ sử dụng chapters nếu chúng thuộc về novel hiện tại
    if (chaptersFromApiForDetailPage && Array.isArray(chaptersFromApiForDetailPage) && 
        currentNovelId && String(currentNovelId) === String(novelId)) {
      console.log('✅ [DetailPage] Using chapters for novel:', novelId, 'Total:', chaptersFromApiForDetailPage.length);
      console.log('📋 [DetailPage] Raw chapters data:', chaptersFromApiForDetailPage);
      
      // Không sort gì cả, giữ nguyên thứ tự từ API để debug
      return [...chaptersFromApiForDetailPage];
    }
    
    // Nếu chapters không thuộc về novel hiện tại hoặc chưa có data
    if (currentNovelId && String(currentNovelId) !== String(novelId)) {
      console.log('⚠️ [DetailPage] Chapters belong to different novel. Current:', currentNovelId, 'Expected:', novelId);
    }
    
    console.log('⚠️ [DetailPage] No chapters data available:', {
      chaptersFromApiForDetailPage: !!chaptersFromApiForDetailPage,
      isArray: Array.isArray(chaptersFromApiForDetailPage),
      currentNovelId,
      novelId
    });
    
    return [];
  }, [chaptersFromApiForDetailPage, currentNovelId, novelId]);

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

  console.log('📄 [DetailPage] Chapter pagination data:', {
    totalChapters: sortedChaptersForDetailPage.length,
    currentChapterListPage,
    chaptersPerPageInList,
    totalChapterListPages,
    currentChaptersForTabDisplay: currentChaptersForTabDisplay.length
  });

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
                    currentPage={currentChapterListPage}
                    chaptersPerPage={chaptersPerPageInList}
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