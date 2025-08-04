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
  const { currentNovel: novelDetailData, loading: novelLoading, error: novelError, reviews, loadingReviews } = useSelector((state) => state.novels);
  const { chapters: chaptersFromApiForDetailPage, currentNovelId, loading: chaptersLoading, error: chaptersError } = useSelector((state) => {
    console.log('🔍 [DetailPage] Full Redux state.chapters:', JSON.stringify(state.chapters, null, 2));
    return state.chapters;
  });
  // chaptersFromApiForDetailPage là danh sách chương cho tab "Danh Sách"
  const [showReviewDialog, setShowReviewDialog] = useState(false); // THÊM: State để quản lý dialog
  const [activeTab, setActiveTab] = useState('summary');
  const [currentChapterListPage, setCurrentChapterListPage] = useState(1); // Đổi tên để rõ ràng
  const chaptersPerPageInList = 5; // Giảm xuống 5 như ReadingPage để khớp với UI
  
  // THÊM: Loading states riêng cho novel và chapters
  const [isLoadingNovelData, setIsLoadingNovelData] = useState(false);
  const [isLoadingChaptersData, setIsLoadingChaptersData] = useState(false);
  const { currentUser, followedNovels, userHistory, loading: userLoading } = useSelector((state) => state.user);
  const { allTransactions, error: transactionError } = useSelector((state) => state.transaction);

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
      const rentedChapter = novel.chapterBoughtRespone?.find(ch => ch.idChapter === chapterId);
      if (rentedChapter && rentedChapter.rentExpiration) {
        const expirationDate = new Date(rentedChapter.rentExpiration);
        const now = new Date();
        const isExpired = now > expirationDate;
        
        return {
          isRented: true,
          expirationDate,
          isExpired,
          daysLeft: isExpired ? 0 : Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
        };
      }
    }
    return null;
  };

  // Chỉ fetch dữ liệu khi novelId đổi, tránh spam API
  const fetchedNovel = React.useRef({});
  const lastFetchedNovelId = React.useRef(null);
  const lastFetchedReviews = React.useRef(null); // Thêm ref cho reviews
  const lastFetchedTransactionsUserId = React.useRef(null); // Track transaction fetch cho user
  const reviewsTimeoutRef = React.useRef(null); // Debounce reviews API calls
  
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
      
      // BỎ phần clear chapters - giờ luôn fetch mới mỗi lần
      
      setActiveTab('summary');
      setCurrentChapterListPage(1);
      
      // Cache configuration với production safety
      const novelCacheKey = `novel_${novelId}`;
      const chaptersCacheKey = `chapters_${novelId}`;
      const reviewsCacheKey = `reviews_${novelId}`;
      
      // Safe sessionStorage access với error handling
      let cachedNovel, cachedChapters, cachedReviews, cacheTimestamp;
      try {
        cachedNovel = sessionStorage.getItem(novelCacheKey);
        cachedChapters = sessionStorage.getItem(chaptersCacheKey);
        cachedReviews = sessionStorage.getItem(reviewsCacheKey);
        cacheTimestamp = sessionStorage.getItem(`${novelCacheKey}_timestamp`);
      } catch (error) {
        console.warn('⚠️ [DetailPage] SessionStorage access failed:', error);
        // Fallback - force API calls when sessionStorage fails
        cachedNovel = cachedChapters = cachedReviews = cacheTimestamp = null;
      }
      
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
      
      // Smart store checking với fallback cho production  
      // BỎ hasNovelInStore - novel luôn được fetch mới
      // BỎ hasChaptersInStore - chapters luôn được fetch mới
      
      // BỎ Production safety checks - luôn fetch mới
      
      const apiPromises = [];
      
      // SIMPLE novel data fetching với loading state
      console.log('🔄 [DetailPage] Fetching novel data for:', novelId, '(always fetch)');
      setIsLoadingNovelData(true);
      apiPromises.push(
        dispatch(getNovelById(novelId)).then((result) => {
          if (result.payload) {
            try {
              sessionStorage.setItem(novelCacheKey, JSON.stringify(result.payload));
              sessionStorage.setItem(`${novelCacheKey}_timestamp`, Date.now().toString());
            } catch (error) {
              console.warn('⚠️ [DetailPage] Failed to save novel cache:', error);
            }
          }
          setIsLoadingNovelData(false);
          return result;
        }).catch((error) => {
          setIsLoadingNovelData(false);
          throw error;
        })
      );
      
      // SIMPLE chapters fetching với loading state
      console.log('🔄 [DetailPage] Fetching chapters data for:', novelId, '(always fetch)');
      setIsLoadingChaptersData(true);
      apiPromises.push(
        dispatch(getAllChapters(novelId)).then((result) => {
          if (result.payload) {
            try {
              sessionStorage.setItem(chaptersCacheKey, JSON.stringify(result.payload));
            } catch (error) {
              console.warn('⚠️ [DetailPage] Failed to save chapters cache:', error);
            }
          }
          setIsLoadingChaptersData(false);
          return result;
        }).catch((error) => {
          setIsLoadingChaptersData(false);
          throw error;
        })
      );

      // Smart reviews fetching với optimized delay và better caching
      const hasReviewsInStore = reviews && Array.isArray(reviews) && reviews.length >= 0; // Có thể là array rỗng
      const shouldFetchReviews = String(lastFetchedReviews.current) !== String(novelId) && 
                                (!cachedReviews || !isCacheValid) && 
                                !loadingReviews; // Không fetch nếu đang loading
      
      if (shouldFetchReviews) {
        console.log('🔄 [DetailPage] Fetching reviews data for:', novelId);
        lastFetchedReviews.current = novelId; // Set ngay để tránh gọi lại
        
        // Clear existing timeout
        if (reviewsTimeoutRef.current) {
          clearTimeout(reviewsTimeoutRef.current);
        }
        
        // Optimized delay based on load type
        const reviewDelay = pageLoadInfo.isReload ? 100 : 
                           pageLoadInfo.isBackForward ? 200 : 500;
        
        reviewsTimeoutRef.current = setTimeout(() => {
          // Double check trước khi gọi API
          if (String(lastFetchedReviews.current) === String(novelId) && !loadingReviews) {
            console.log('🔄 [DetailPage] Actually calling getAllReviews for:', novelId);
            dispatch(getAllReviews(novelId)).then((result) => {
              if (result.payload) {
                try {
                  sessionStorage.setItem(reviewsCacheKey, JSON.stringify(result.payload));
                } catch (error) {
                  console.warn('⚠️ [DetailPage] Failed to save reviews cache:', error);
                }
              }
            }).catch((error) => {
              console.error('❌ [DetailPage] Failed to fetch reviews:', error);
              // Reset để có thể retry
              if (String(lastFetchedReviews.current) === String(novelId)) {
                lastFetchedReviews.current = null;
              }
            });
          }
        }, reviewDelay);
      } else if (hasReviewsInStore) {
        console.log('✅ [DetailPage] Using existing reviews data');
      } else {
        console.log('✅ [DetailPage] Using existing/cached reviews data');
      }
      
      // Execute API calls - LUÔN CÓ ÍT NHẤT 2 CALLS: novel + chapters
      console.log(`🔄 [DetailPage] Executing ${apiPromises.length} API calls (novel + chapters always)...`);
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
      
      lastFetchedNovelId.current = novelId;
    } else {
      console.log('✅ [DetailPage] Data already available for novelId:', novelId);
    }
  }, [dispatch, novelId]); // ĐƠN GIẢN HÓA dependencies - chỉ cần dispatch và novelId
  // NOTE: Bỏ hết dependencies phức tạp để tránh lỗi khi chuyển truyện
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

  // Fetch all transactions để kiểm tra chapter thuê - chỉ gọi 1 lần ở DetailPage
  // Đợi user loading xong để tránh lỗi 401 khi token chưa được refresh
  useEffect(() => {
    // Chỉ gọi khi:
    // 1. Có currentUser với idUser
    // 2. User không đang loading (đã refresh xong)
    // 3. Chưa fetch cho user này
    if (currentUser?.idUser && !userLoading && 
        lastFetchedTransactionsUserId.current !== currentUser.idUser) {
      
      // Thêm delay nhỏ để đảm bảo token đã được refresh (đặc biệt khi reload)
      const delay = performance.getEntriesByType('navigation')[0]?.type === 'reload' ? 1000 : 500;
      
      console.log('🔄 [DetailPage] User ready, will fetch transactions for user:', currentUser.idUser, `in ${delay}ms`);
      
      const timeoutId = setTimeout(() => {
        if (currentUser?.idUser && !userLoading) { // Double check
          dispatch(getAllTransactions({ statusDeposit: 'SUCCESS', idUser: currentUser.idUser }))
            .unwrap()
            .then(() => {
              console.log('✅ [DetailPage] Transactions fetched successfully');
              lastFetchedTransactionsUserId.current = currentUser.idUser;
            })
            .catch((error) => {
              console.error('❌ [DetailPage] Failed to fetch transactions:', error);
              // Nếu lỗi 401, có thể retry sau 1 giây (token có thể đang được refresh)
              if (error?.status === 401 || error?.code === 401) {
                console.log('🔄 [DetailPage] Got 401, will retry transactions in 2 seconds...');
                setTimeout(() => {
                  if (currentUser?.idUser && !userLoading) {
                    console.log('🔄 [DetailPage] Retrying transactions fetch...');
                    dispatch(getAllTransactions({ statusDeposit: 'SUCCESS', idUser: currentUser.idUser }))
                      .unwrap()
                      .then(() => {
                        console.log('✅ [DetailPage] Transactions retry successful');
                        lastFetchedTransactionsUserId.current = currentUser.idUser;
                      })
                      .catch((retryError) => {
                        console.error('❌ [DetailPage] Transactions retry failed:', retryError);
                      });
                  }
                }, 2000);
              }
            });
        }
      }, delay);
      
      // Cleanup timeout if component unmounts or dependencies change
      return () => clearTimeout(timeoutId);
        
    } else if (currentUser?.idUser && userLoading) {
      console.log('⏳ [DetailPage] User still loading, waiting for refresh to complete...');
    } else if (currentUser?.idUser && lastFetchedTransactionsUserId.current === currentUser.idUser) {
      console.log('✅ [DetailPage] Transactions already fetched for user:', currentUser.idUser);
    }
    
    // Reset khi user logout
    if (!currentUser?.idUser && lastFetchedTransactionsUserId.current !== null) {
      lastFetchedTransactionsUserId.current = null;
    }
  }, [currentUser?.idUser, userLoading, dispatch]);

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
        lastFetchedTransactionsUserId.current = null;
        
        // Clear timeouts
        if (reviewsTimeoutRef.current) {
          clearTimeout(reviewsTimeoutRef.current);
        }
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
        toast.info("");
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
      
      // Sắp xếp theo indexChapter tăng dần như ReadingPage (0-based)
      const sorted = [...chaptersFromApiForDetailPage].sort((a, b) => {
        const aIndex = a.indexChapter !== null && a.indexChapter !== undefined ? Number(a.indexChapter) : 999999;
        const bIndex = b.indexChapter !== null && b.indexChapter !== undefined ? Number(b.indexChapter) : 999999;
        return aIndex - bIndex;
      });
      
      console.log('📋 [DetailPage] Sorted chapters by indexChapter:', sorted.map(ch => ({ 
        id: ch.idChapter, 
        indexChapter: ch.indexChapter,
        displayNumber: ch.indexChapter !== null && ch.indexChapter !== undefined ? Number(ch.indexChapter) + 1 : 'N/A',
        title: ch.titleChapter 
      })));
      
      return sorted;
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
    ads: novelDetailData.ads || [{ id: 1, image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw8NDQ4NDQ8NDRAPDg8QDQ8ODg8PDg4NFRUWFhYRFRUZHigsGBomHhYVIzEtKCo3Li4yFyMzODMtNyguLzcBCgoKDg0OGxAQFy0lHyYtLSszLCsvKy0tKy8rLTctLS0tLS8rLTAtKystKy0tLTArLisrKyswKystKy0tKy0rK//AABEIAKMBNgMBEQACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAQYEBQcCA//EAEsQAAEEAAMEBQcFDAgHAAAAAAEAAgMRBAUSBiExURNBYYGRBxQyUnGSoSJCsbLBNDVUYmNyc3SUotLwFhcjJFOj0fElM0OChJOz/8QAGwEBAAMBAQEBAAAAAAAAAAAAAAEEBQMGAgf/xAA9EQACAQMABA0ACAYCAwAAAAAAAQIDBBEFEiExE0FRYXGBkaGxwdHh8BQVIjIzNFLxFiMkU3KiQmKCsuL/2gAMAwEAAhEDEQA/AMNYB+lBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQEoCEAQEoCEAQBAEAQBAEAQBAEAQBAEAQEoCEAQBQApAQBAEAQBASgIQBAEAQBAEBKgBAEAQBAEAQBAEAQBAEAQBAEAQCkAQBAEAQBAEAQBAEApAEAQCkApAEAQBAEAQBAEAQHpCAgCAIAgCEhCAgCEhCAgCAISEICAIAgCAIAgCAIAgCAIAgCAISEICAISEICAIAgCAIAhIQgmlAFIBSAUgFICQ29wBJO4ACyTyAQZLzkmxEbI/OMydpFajFr0MY38o/n7CK5laFK0SWtV7PU85d6anKfB2qzz4y30L1Mzp8gvo6w3LV0Utf8Asr42vvWtd2z5znDU0tjWzLtXhnyMXOtiYpIvOMteHWNQi1645G/iP5+017F8VbRNa1Ls9Dta6ZnCfB3S68Ya6V6d5RHNIJBBBBIIIIII4gjqKzz0aedqIpCRSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAmlBBNICKQCkApAW3ydZUJsS/EPFtw4GgHgZnXR7gD3kHqV2yp609Z8XiYmnLp06SpR3y39C9fUxdtc8fi8Q+FriIIXlrGjg97dxkPPfYHZ7Svi6rOcscSO2irKNCkptfaks9C5PX2K5SqmqWHY3PHYPENjc49BM4NkaeDHHcJBy6r7PYFZtqzpyxxMzNKWUbik5JfaW1c/N6c/WZ/lGyoRTsxTBQnsSVw6VvX3j6p5rre09WSkuMq6DunOm6Ut8d3Q/R+JUKVE3SKQE0gIpATSAikBNICKQE0gIpATSAUgIpAKQCkApAKQE0gIpATSAikApAKQE0gIpAKQE0gFICKQHqkApAKQFuyzYZ+Iw8U/nLWdKxrw3oS7SDvAvUFdp2TnFS1t/N7mHcabjRqyp8HnDxv8AYyf6un/hbf2c/wAa+/oD/X3e5x/iGP8Aa/29iy7M5GcBBJF0gkc+Rz9YZpq2taBVnl8Vat6PBRazkyb+9V1VU9XCSxjOePPIVoeTp/4W0/8Ajn+NVPq9/r7vc1v4hj/a/wBvYf1dP/C2/s5/jU/QH+vu9x/EMf7X+3sD5Onkfdbf2c/xqPq9/r7vcn+IY/2v9vYs20eRnH4aOAyBjmPa/pCzVZDS07rHHUetW69HhYKOTHsb1WtZ1NXKaaxnnzycxWf6un/hbf2c/wAaq/V7/X3e5r/xDH+1/t7GPmOwj4IJZ/OWP6KN8hb0JbqDRZF6jXDkvidk4xctbdze51oacjVqRp8HjLS38vUVClSN0UgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFIBSAUgFID0oICAIDr2yjry/CfoWjw3fYty2/Cj0HhdJLF1U6TbLuUggPjisVHCwyTPZG0cXPcGi+W/rXzKSisyeD7p0p1JasE2+Y1I2uy+9PnA9vRy6fHTS4/S6OfveJe+qbvGeD716m1wmMinbrhkjlb1ljg4A8jXBdozjJZi8lKrRqUnicWnzn3X0cwgNXtQ6svxf6CQeIr7VxuPwpdDLmj1m6p/5I4+sI92EBs8q2fxWMGqGP5HDpHkMjvsJ491rtToVKn3UU7m/oW+yctvItr+dJs37CY4CwcM7sbK6/i0Lt9Cq83b7FNactW/+S6l6mkzDLJ8K4NxET4r4Ei2u9jhuPiq06c4feWDRoXNKus05J/OTefTJcolx0rooTGHNYXkyOc1ukEDqB3/KCmlSlVeInzdXdO2gpzzjONn7rkPhmGCfhppIJC0vjIDiwktugdxIHNfM4OEnF8R0oVo1qaqR3PlMdfJ1CAIAgCAIAgCAIAgCAIAgFIAgCAIAgCAID0oIFIAgOr7FuvLcN7Hjwe4fYty0eaMfnGeK0qsXc+rwRu1YM4IDn2AwxzvHTSzvd5vAajY018kkhrRysNJJ49XKsuEfpNVuT2L5+56itUWjbaMKa+3Le/HszhcXnav6MYHTp82iqqujq967+Ku/RqWMaqMX6zus54R/ObcYEGx0UGKixGGllha11vjDidbepodd1dWDdjkuUbOMZqUG0WZ6XqVaMqVWKbe58nPjl5MYLMrhkBAabbF2nLsSebGjxc0faq908UZGhotZu4dPkcmWGe2Njs7l4xWMhgdehziZK3fIaC4jvqu9dqFPhKiiyrfXDoUJVFv4ul7PcuO2G0T8EWYTCBsbujDi/SCI2bw1rG8L3de7gr91cOm1CGwwNF6Pjcp1qzys7uV8bbKtFtTj2m/OHHmHMjc09lV9CpK6rL/l4G1LRdpJY4PvfqZ2Z7YyYrBuw74mNe8gPe3ewsG/c08Hd66VLxzp6rW0rW+iIUK6qxk8Li489PIe/Jv92yfqz/rxr6sPxH0eaPnTv5eP+S8Gaza7744r89v1GrjdfjS+cRc0Z+Up9HmzUKuXgpAUAhASpAQBQApAUAIAgCAIAgCAIAgIUgKASgJQgIAgOo7CH/hsI5OmH+Y4/atmy/BXX4njtML+rl1eCLArZlhAc/ZJJkeNkLo3Pws53FvqgktAPrNsijx4rKzK1qPK+y/naeocYaTt44licfj6ny8RcMtzvDYquhmY5x+YTpk9071oU69Op91mDXsq9D78Hjl4u02C6lUIAgNBt06stn7XQj/MYVVvfwX1eJp6HX9XHr8GctWKeyM/Icf5pioZyCWscQ8DiWOBae+jfculGpwc1IrXlDh6Eqa3vd0raXjaXZ9uZNjxWFkZr0AAk/2csdkjeOBFn6CtK4t1XSnB7fE87YX7s26NaLxnrT9CjZhlGJw3/PhkYB8+tUfvCws2dKcPvI9HRu6Nb8OafNx9m8wVzLBavJx92yfqz/rxq7YfiPo80Y2nfy8f8l4M+2b7MYrF4/EyMa1kZeNMkri0OprQaABJ8KX1VtalSrJpbOc522k6FvbQjJ5eNy6TExmxGMjaXM6KauLWOIf3BwF+K+J2NWKysM70tNW03h5XTu7iuPYWktcC0gkOBBBBHEEdRVPcayaayhFG57gxjXOc401rQS5x5ABEm3hESkorMnhFkwuw+MkaHPMMN/Ne8l/fpBHxVyNjVe/CMmppu2i8LL6Fs7zEzXZbF4Vpe5jZGDe58JLg0cyCAQO6lzqWtSmstZXMd7bSlvXeqnh8j2expCq+TRLDjtkMTEyJzdM5lcGtZGHWLaXWSaAG7ieatTs5xSa255DKo6XoTlJP7ONuX047TJi2DxRbbpMOw+rqeT3kNX2rCpja0cpadt08KMn2epqM3yHE4PfMwaCaEjDqjvlfV3hcKtCdL7y6y9bX9C42Qe3ke/50GsXEtmdlWUT4xxbAzVXpPJ0sZ7T9nFdKVKdR4iivcXdK3WakurjZvH7B4sNsSYZx9XU8eB0qy7CpjevnUZy07bt4cZd3qV3HYKXDyGKdjo3jfR6xzBHEexVJwlB4ksGrRrU60dem8ox18nQ3uV7J4vEtEga2Jh3tdMS0uHMNAJ8VZp2lSazjC5zOuNK29F6reXzep9sdsXjIWl7RHOBxETjr90gX3b19TsqsVlbeg50dM21R4eY9O7tK6R1Hdz7CqhqkIAgCA9KAEAQHS9gHXgAOUsg+N/atmx/C62eQ00v6rqRZFcMkIDxNE2RpZI1r2uFOa9oc0jtBUNJrDR9RnKD1ovD5it5jsRhZbdCX4d3EaflR3z0nh3EKnUsactsdhrUNNV4bJ4kux9vqma3D5pi8qmZBjiZoH+hLZcWt9ZrjvNWLB38u3iq1W3ko1Nq5fngW52tvf03Ut1qzXF7c/E11814BveN4PBaZ5zcSgK5t+6sA4c5Yx8b+xU778LrRraFX9UuhnM1jHrxSAzsszbEYQ3BK5gJtzNzo3Htafp4rpTrTp/dZWuLSjXX8yOefj7S05ft5dNxUIo7i+E2O9jurvV6npDinHs9DGr6Cxtoz6n6r0PvnGzeGxsHnWX6A4guDY90ctcW6fmu+3jzX1VtqdWOvS9n7/GcrXSNa2qcDc7ufeuvjXxGq8nP3bJ+rP+vGuOj/AMR9Hmi7p38vH/JeDNjthtPLDMcLhnCMsA6WSgXaiLDW3w3Eb+3qpdbu6lGWpDtKui9GU6lPhqqzncvNmmyna7FQyNM0jp4r/tGvALg3rLTz+H0qvTvKkX9p5RfudE0KkHqR1ZcWPM2vlCy5hbFjYwLcRHIR88EEsf8ACu8cl3v6awqi6CloS4lmVCXFtXNyr5zn22LwUWFwkmYzDeWvINWWQtsEDtJB9u5fVnCMKbqy+I+NK1p166toc3W36epocx2sxkzy5khgZfyY46FDtdVk/DsVWpeVZPKeEadDRVtTjiUdZ8r9DbbK7VyumZh8U7pGyHTHIQA5rzwaa4g8Odld7a7k5KE9ueMo6R0VTVN1aKw1ta4sexqtt8pbhcTcYDY5ml7Wjg143OaOzeD/ANy4XtJU57NzLuiLp16OJb47OnkL5mmZtweD6dw1EMYGNutchG4X8fYCtSrVVKnrHmbe2dzccGuV5fIjneI2mxsj9ZxD2b9zY6awdldffayZXVZvOseqhoy1hHV1E+na/nQWrZXPvP2yYPGBsjiwm9IAlj4ODhz3jh9iu2txwqdOpt8zF0lY/RWq9B4Wex83MU/McqdFjXYNpsmVrIyetr60E9zhaoVKTjV4NcvjuN6hdKpbKu+Rt9W/wL7mhky/CR4fL4HyPNgObGXhlelI6uLiT/NUtSprUaajSjn5vPNW6hd15VLmaS6cZ5EuZfN5V4sZnLX66xjje8OgJYezTX0Kkp3SedvYbEqOjJR1cx6nt7cljzPDHMsuL5YXwYiNrnNa9pa5sjRvAv5rgPjzCt1IuvRy44kvnYzJt6is7vVhPWg9mzkfmvmxlW2JytuKxWqQB0cLQ8tPBzyaaD2cT3KlZ0lUqZe5G1pe6lQo4jvls6uM3202Z5g6V0ODhxDI2bjIyFxdK7rINbm+zlxVq5q13LVpp45cbzM0fbWagp1pxcnxN7vcxMlzTNIZGjEQ4qeIkB4dC4vaPWaQN57D8Fzo1biL+0m10He7tbCpB8HOMZcWGsPme08eULK2xvjxbAG9KSyUDcDJVtd7SAb9gUX9JJqa4z60JdSnF0ZcW1dHIU9Z5vCkApAeqUECkApAdE8nbrwcg5Yh4/cYVsaPf8t9J5TTi/qF/ivFlpV4xjzJIGNLnENa0EuJNANG8kqG0llkxi5NJLaYmWZpBi2a4Hh4HpDg9p7WneF8Uq0KizFne4tatvLVqLHh2mauhXKh5RsQzoIodzpTKHtaN7gwNcCe8kDt7ln6QktRR48m7oKnLhJT/wCOMdeSz5dEY4IY3ekyKNrvzg0Aq7TTUUnyGPXkp1ZSW5tvvMhfZyKt5RHVg4xzxLB+48/YqOkHimunyZtaCWbh/wCL8Uc7pY56o++CwcmIkbFC0ve66AocBZJJ4L7hCU3qx3nOrVhSg5zeEjxiIHxPMcjXMe30muFEKJJxeGtp9QnGcVKLyj50vk+i+eTeOQRYhxsROezo74F4BDyP3B3di1dHJ6snxfM+R5nT0oOcEvvJPPRxeZhbEva7M8U5nouZO5tcNJlYR8FysmnXk1z+JY0smrOmnvzH/wBWabaz74Yn89v1GqvdfjS+cRoaN/Kw6PNmoIVcvHQdrvvTD7cP9Va93+XXUeX0Z+el/wCXiTlkZxmRmGL0xG9mm/8AqMdqDe8afeSkuEtdVb93YRcS+j6S157sp9TWO7yOfEUSCCCCQQRRBHEELIPU5Njs7gnz4yBjAfkyMkefVjY4Ek+Fe0hdreDnUSXLnsKl9WjSt5SlyNdbN95Sp2ukw8Q9JkcjndgeWgfUKtaRkspcz7/2M3QEGoTnxNpdn7m52xwT5suaWAuMRjlLRxLQ0tPgHX3KzeQcqOzi2mfoutGndvW48rv9sHN1jHrSz7AYJz8WZgDoiY4F3UXuFBvgSfDmr1hBuprcSMfTVaMaHB8bfcuM851jmDORLY0RTwtceoBmkPPcdXgorVF9J1uJNe5NpQl9X6nG0+/d2lr2ozibBMjliiZLGSWyOcXfIdu08Oo7/hzV+6rypJNLKMTR1pSuZOE5NPi5+XsK7/T2f/Ah956p/WMv0o1fqKl+t9wdtxiXMeRh4qAou/tC1pddX/PUn0+bT+yFoSipLM30bNuCfJtM1suIiPF8cbm9oYXA/XCaOklKUeZd37jT0G4QnyN9/wCxmZztZicJiJIHQRUDcbiX/LjPou/nrBXWteTpzcXFFe00VQuKSqKb592x8fzkML+ns/8AgQ+89cvrGX6UWPqGl+t9xr9oNopsZEyKWJkTdTZWkB9uFOAIvq3nwXGvdSqxSaxxlqy0dTt5ucJZe7i2e5oaVU0xSAUgJQgIAgL/AOTk/wB2nH5e/Fjf9FraO+5Lp8jzGnV/Oi/+vmy2rQMM8vYHAtcA4EEOBFgg8QQoazsZKbTyiq47YxuvpcFM/DP3023aR2NcDbR4qhOxWdanLDNqjpl6upXgpL5vW59x8jlec+h53HXPXvr26LXzwV3u1186jp9K0Zv4J9n/ANYMrJdkxFKMTipDiZgQ4XZaH+sSd7iOq10o2WrLXm8v52nC70s6kOCox1Y+XJs3FnV4xwgKl5Rj/doB+XvwY7/VZ+kfuR6fI3NBL+bN/wDXzRQFknpzOyfNJMFN00WkmtLmuFhzCQSL6uA8F1o1pUpa0SvdWsLmnqT6ehlybtFl2NaG4uMMdylYXAH8WRvD4LR+lUKqxUXb6mA9H3ts80ZZXM/FP3PLMHkjDr1QO7DO+Qe4XG/BQoWa25XbnuyS62lJfZw+xLvwYef7WxmI4bAgtaW6TJp0BrOGljer27q6lzr3sXHUp9vod7LRM1Phbh7d+N+3nZrth8ZFh8U98z2RNMDmguNDVrYa+BXGynGFRuTxsLel6NSrRUYRy9bi6GYG0kzJcbiJI3B7HPBa5u8EaWjd4LlcSUqsmtxZsIShbQjJYaXma0hcC4XXabM8PLlsUUcsb3jobY11uFN37lqXNaEqKipbdh57R9tWp3cpyi0tu00OzuevwMhIGuJ9dJHdcODm8nfT4EVLe4dF8xpX1jG6hySW5+T5vAtM0+T449LKY2vPpay+B9/jEEavir0pWtbbLf2GLGnpK2+xDLXNiS88dxEmf5fgI3MwTGyPPVGDpJ6i+Q8fijuaFFYprL5vNkxsLy7mpV3hc/kv2KNj8U+eSSaU6nvJLj1dgHIAUO5ZVSbm3KW89JRpRpRUILYjqGaZu3BQQSPa57XuZG7TWpoLHHUAePo/FbtWuqUYtrm7jxtvaSuak4xeGsvv9zUPGSTnpXGFpO8jVJDZ7WAj6FXf0Of2njvXcXk9KUlqLPc+/afDNNq4IIfN8uaBuIDwzRHHfEtB9J3w696+Kt5CEdWivRHW30VVq1OEun1Zy36L5sKQd/HffEneSVmHoi37P7VsbEMNjgXsDdLZNOsFnqvb1+34da0Le8SjqVd3L6mFe6KlKfC27w9+N23lTM04PJHHXqhF79InkYPd1bl11LN7crtZWVbSkfs4fYn34MbOtoMEzCyYPBxNe17S00wsiaT87fvc7ge7ivitc0VTdOmvQ7WlhdSrKvXlhrny+jmXzBUsHinwSsmiOl7DbT9IPMEWO9Z8JuElKO83KtKNWDhNbGXeLaDL8fG1mNY2N46pAdIPWWSDh8FqK5oVliosPn8medlo+8tZuVu8rm81x95DIckgPSaoXkbwDJJP+5Z+hQo2cNuV2t9wc9KVfs4a6lHv2Gh2szuPGvjEUelsQcA9257wa3UODd3+yqXVxGq1qrcaejbKdtF68tr4uJe/zaaBVTTCAID1SgCkApAWjYfOI8M+SGZwYyXSWvdua143U49VivDtV+yrxptxluZjaXs51oqdNZa4uYvoxEZ+ez3mrW1lynmODnyMnzhnrs94KdZco4OXIx5wz12e8E1lyjg5cjHnDPXZ7wTWXKODlyMecM9dnvBNZco4OXIx07PXZ7wTWXKODlyMh2IjAsvYAOJLhSjWXKFTm9yZQdt84jxMkcULg9kWoueN7XPND5J6wAOPasi9rxqNRjuR6fRFnOjFzqLDfFzFYpUTZFIBSAUgFIBSAUgFIBSAUgFIBSAhw3H2I9wW8v23n3Bh/wBNH/8AN61r/wDCj0+TPM6G/Mz6H4ooVLJPTCkApAKQCkApAKQCkApAKQCkApAKQEoQKQBATSAjSOQ8FGETlkaRyHgmEMsaRyHgmEMsaRyHgmEMjSOQ8EwhljSOQ8Ewhlk6RyHgmEMilJApAKQClAFKQKQCkApATSAikApAKQCkAIUEm9z3aM4yCOAwiLo3tdq6XXdNc2q0iuKt17p1YqOrjHP7GZZ6OVtVdTXzlY3Y488rNHSqmkRSAUgFIBSAUgJpAKQEUgFICaQEUgFID0oAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBCCUAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBASoAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAEAQBAf/Z" }],
  };

  const totalChapterListPages = Math.ceil(sortedChaptersForDetailPage.length / chaptersPerPageInList) || 1;
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
    console.log('🔍 [DetailPage] Going to chapter display number:', chapterNum);
    
    // Chuyển sang tab chapters nếu chưa active
    if (activeTab !== 'chapters') {
      setActiveTab('chapters');
    }
    
    // Tính toán page chứa chapter này
    const targetPage = Math.ceil(chapterNum / chaptersPerPageInList);
    
    if (targetPage >= 1 && targetPage <= totalChapterListPages) {
      console.log('📄 [DetailPage] Switching to page containing chapter:', chapterNum, 'on page:', targetPage);
      setCurrentChapterListPage(targetPage);
      
      // Optional: Scroll to top of chapter list để user dễ thấy
      setTimeout(() => {
        const chapterListElement = document.querySelector('[data-chapter-list]');
        if (chapterListElement) {
          chapterListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
    } else {
      console.warn('⚠️ [DetailPage] Invalid chapter number:', chapterNum);
      alert(`Số chương không hợp lệ. Vui lòng nhập số từ 1 đến ${sortedChaptersForDetailPage.length}.`);
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

  // SKELETON LOADING COMPONENTS với cải tiến animation
  const NovelHeroSkeleton = () => (
    <div className="py-8 md:py-12 bg-no-repeat bg-cover bg-center relative">
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-black opacity-80' : 'bg-black opacity-60'}`}></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0 mx-auto md:mx-0">
            <div className={`w-full max-w-[180px] md:max-w-full h-auto rounded-md shadow-lg mx-auto aspect-[2/3] animate-pulse bg-gradient-to-r ${
              isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
              backgroundSize: '400% 400%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
          </div>
          <div className="md:w-3/4 lg:w-4/5 text-white text-center md:text-left">
            <div className={`h-8 md:h-10 rounded mb-3 bg-gradient-to-r ${
              isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
              backgroundSize: '400% 400%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
            <div className={`h-4 rounded mb-2 bg-gradient-to-r ${
              isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
              backgroundSize: '400% 400%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
            <div className={`h-4 rounded mb-2 w-3/4 bg-gradient-to-r ${
              isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
              backgroundSize: '400% 400%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
            <div className="flex items-center justify-center md:justify-start space-x-1 mt-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded bg-gradient-to-r ${
                  isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                }`} style={{ 
                  backgroundSize: '400% 400%',
                  animation: 'shimmer 2s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`
                }}></div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3 mt-3 text-sm">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className={`h-4 w-16 rounded mb-1 bg-gradient-to-r ${
                    isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                  }`} style={{ 
                    backgroundSize: '400% 400%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`
                  }}></div>
                  <div className={`h-6 w-12 rounded bg-gradient-to-r ${
                    isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                  }`} style={{ 
                    backgroundSize: '400% 400%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    animationDelay: `${i * 0.2 + 0.1}s`
                  }}></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-6 w-16 rounded bg-gradient-to-r ${
                  isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                }`} style={{ 
                  backgroundSize: '400% 400%',
                  animation: 'shimmer 2s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`
                }}></div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-10 w-24 rounded bg-gradient-to-r ${
                  isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                }`} style={{ 
                  backgroundSize: '400% 400%',
                  animation: 'shimmer 2s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`
                }}></div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-8 w-20 rounded bg-gradient-to-r ${
                  isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                }`} style={{ 
                  backgroundSize: '400% 400%',
                  animation: 'shimmer 2s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`
                }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Animation để tạo hiệu ứng shimmer */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -400% 0; }
          100% { background-position: 400% 0; }
        }
      `}</style>
    </div>
  );

  const ChapterListSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`p-4 rounded border animate-pulse ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`h-5 w-3/4 rounded animate-pulse ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
            <div className={`h-4 w-16 rounded animate-pulse ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
          </div>
          <div className={`h-4 w-1/2 rounded animate-pulse mt-2 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
          }`}></div>
        </div>
      ))}
    </div>
  );

  const LoadingOverlay = ({ children, isLoading, loadingText }) => (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-lg z-10 backdrop-blur-sm ${
          isDarkMode ? 'bg-gray-900 bg-opacity-90' : 'bg-white bg-opacity-90'
        }`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full animate-bounce mx-1 ${
                    isDarkMode ? 'bg-sky-400' : 'bg-sky-500'
                  }`}
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.4s'
                  }}
                ></div>
              ))}
            </div>
            <p className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {loadingText}
            </p>
            <div className={`mt-2 h-1 w-32 mx-auto rounded-full overflow-hidden ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div className={`h-full rounded-full animate-pulse ${
                isDarkMode ? 'bg-sky-400' : 'bg-sky-500'
              }`} style={{
                width: '30%',
                animation: 'loading-bar 2s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS cho loading bar animation */}
      <style jsx>{`
        @keyframes loading-bar {
          0%, 100% { 
            transform: translateX(-100%); 
            width: 30%;
          }
          50% { 
            transform: translateX(233%); 
            width: 70%;
          }
        }
      `}</style>
    </div>
  );


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

      {/* Hero Section với Loading State */}
      {isLoadingNovelData ? (
        <NovelHeroSkeleton />
      ) : (
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
                  <button 
                    onClick={handleReadFirstChapter} 
                    disabled={isLoadingChaptersData}
                    className={`flex items-center font-semibold py-2 px-4 rounded text-sm transition-colors ${
                      isLoadingChaptersData 
                        ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                        : (isDarkMode 
                          ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                          : 'bg-sky-500 hover:bg-sky-600 text-white')
                    }`}>
                    <FaBookOpen className="mr-2" /> Đọc từ đầu
                  </button>
                  <button 
                    onClick={handleReadContinue} 
                    disabled={isLoadingChaptersData}
                    className={`flex items-center font-semibold py-2 px-4 rounded text-sm transition-colors ${
                      isLoadingChaptersData 
                        ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                        : (isDarkMode 
                          ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                          : 'bg-sky-500 hover:bg-sky-600 text-white')
                    }`}>
                    <FaListUl className="mr-2" /> Đọc tiếp
                  </button>
                  <button 
                    onClick={handleReadLatestChapter} 
                    disabled={isLoadingChaptersData}
                    className={`flex items-center font-semibold py-2 px-4 rounded text-sm transition-colors ${
                      isLoadingChaptersData 
                        ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                        : (isDarkMode 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white')
                    }`}>
                    <FaPlusSquare className="mr-2" /> Chương mới nhất
                  </button>
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
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className={`w-full md:flex-grow p-6 rounded-lg shadow-lg transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200 border border-gray-600' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 border border-gray-200'
          }`}>
            {activeTab === 'summary' && (
              <LoadingOverlay 
                isLoading={isLoadingNovelData}
                loadingText="Đang tải thông tin truyện..."
              >
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
              </LoadingOverlay>
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
                
                {/* Loading Overlay cho Chapters */}
                <LoadingOverlay 
                  isLoading={isLoadingChaptersData}
                  loadingText="Đang tải danh sách chương..."
                >
                  {(chaptersLoading || isLoadingChaptersData) && !currentChaptersForTabDisplay.length && <ChapterListSkeleton />}
                  {chaptersError && !currentChaptersForTabDisplay.length && <p className="text-red-500 text-center py-4">Lỗi tải chương. Phiên đăng nhập của bạn có thể đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.</p>}
                  {!chaptersLoading && !isLoadingChaptersData && !chaptersError && currentChaptersForTabDisplay.length > 0 && (
                    <div data-chapter-list>
                      <ChapterListDisplay
                        chapters={currentChaptersForTabDisplay}
                        novelId={novelId} // Truyền novelId xuống
                        currentPage={currentChapterListPage}
                        chaptersPerPage={chaptersPerPageInList}
                      />
                    </div>
                  )}
                  {!chaptersLoading && !isLoadingChaptersData && !chaptersError && sortedChaptersForDetailPage.length === 0 && (
                    <p className={`text-center py-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Truyện này chưa có chương nào.</p>
                  )}
                </LoadingOverlay>
                
                {/* Pagination dưới danh sách chương nếu cần */}
                {totalChapterListPages > 1 && currentChaptersForTabDisplay.length > 0 && !isLoadingChaptersData && (
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
                <a href="https://www.youtube.com/watch?v=ul86dicq_ck&list=RDul86dicq_ck&start_radio=1" aria-label={`Quảng cáo ${ad.id}`}><img src={ad.image} alt={`Quảng cáo ${ad.id}`} className="w-full h-auto rounded-md object-contain"/></a>
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