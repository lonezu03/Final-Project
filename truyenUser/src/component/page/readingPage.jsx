// src/component/page/readingPage.jsx
import React, { useState, useEffect, useRef, useMemo,useCallback  } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getNovelById } from '../../redux/novelSlice';
import {
  getAllChapters,
  generateDropdownFromExistingChapters,
  getChapterContentById,
  clearChapterState,
  increaseChapterView, 
} from '../../redux/chapterSlice';
import { createHistory, getAllHistoryByUser, refreshUserHistory  } from '../../redux/userSlice';
import { getAllTransactions } from '../../redux/transactionSlice';
import apiClient from '../../services/api'; // Đảm bảo đường dẫn này đúng
import { optimizeCloudinaryAudioUrl, optimizeCloudinaryImageUrl } from '../../utils/cloudinaryOptimizer';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCog, FaListUl, FaAngleLeft, FaAngleRight, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import AudioPlayer from '../AudioPlayer'; // Đảm bảo đường dẫn này đúng
import ChapterComments from '../ChapterComments'; // Đảm bảo đường dẫn này đúng
import CanvasTextRenderer from '../CanvasTextRenderer'; // COMPONENT MỚI ĐỂ VẼ CANVAS

// Component Dialog để hỏi người dùng
const ContinueReadingDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
    <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-sm text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Đọc tiếp?</h3>
      <p className="text-gray-600 mb-6">Bạn có muốn tiếp tục đọc từ vị trí lần trước không?</p>
      <div className="flex justify-center space-x-4">
        <button onClick={onCancel} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">Bỏ qua</button>
        <button onClick={onConfirm} className="px-6 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors">Đọc tiếp</button>
      </div>
    </div>
  </div>
);


const ReadingPage = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentNovel, loading: novelLoading, error: novelError } = useSelector((state) => state.novels);

 // Tách ra thành các selector riêng lẻ để tối ưu hóa và tránh cảnh báo
const currentChapterContent = useSelector((state) => state.chapters.currentChapterContent);
const chaptersForReadingPageDropdown = useSelector((state) => state.chapters.chaptersForReadingPageDropdown);
const { chapters: chaptersFromApiForDetailPage, loading: chaptersLoading, error: chaptersError } = useSelector((state) => state.chapters);
const loadingContent = useSelector((state) => state.chapters.loadingContent);
const errorContent = useSelector((state) => state.chapters.errorContent);
const loadingListForReading = useSelector((state) => state.chapters.loadingDropdownChapters);
const errorListForReading = useSelector((state) => state.chapters.errorDropdownChapters);

// Phần lấy user vẫn giữ nguyên như đã sửa
const currentUser = useSelector((state) => state.user.currentUser); 
const userHistory = useSelector((state) => state.user.userHistory);
const { allTransactions } = useSelector((state) => state.transaction);

//   const {currentUser,userHistory} = useSelector((state) => state.user || {});

  const [showChapterListDropdown, setShowChapterListDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('readingFontSize') || '20', 10));
  const [lineHeight, setLineHeight] = useState(() => parseFloat(localStorage.getItem('readingLineHeight') || '1.8'));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('readingFontFamily') || 'Tahoma');
  const [theme, setTheme] = useState(() => localStorage.getItem('readingTheme') || 'xam-nhat');
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(null);
  const [savedAudioPosition, setSavedAudioPosition] = useState(null);

  // Thêm state loading để đồng bộ hóa việc tải dữ liệu
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(true);
  const [historyLoadCompleted, setHistoryLoadCompleted] = useState(false);
  const [chapterContentLoadCompleted, setChapterContentLoadCompleted] = useState(false);

  const mainContentAreaRef = useRef(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(() => {
    const saved = localStorage.getItem('showAudioPlayer');
    return saved !== null ? saved === 'true' : true;
  });
  const urlAudio = currentChapterContent?.urlAudio || null;

  const [processedChapterContent, setProcessedChapterContent] = useState(null);
  const [canvasContainerWidth, setCanvasContainerWidth] = useState(0);

  const NAVBAR_MAIN_HEIGHT_PX = 0; // CẬP NHẬT GIÁ TRỊ NÀY
  const AUDIO_PLAYER_ACTUAL_HEIGHT_PX = 0; // CẬP NHẬT GIÁ TRỊ NÀY

  const pagePaddingTop = `${NAVBAR_MAIN_HEIGHT_PX}px`;
  const pagePaddingBottom = showAudioPlayer ? `${AUDIO_PLAYER_ACTUAL_HEIGHT_PX}px` : '0px';
  const readingHeaderStickyTop = `${NAVBAR_MAIN_HEIGHT_PX}px`;
  const lastKnownPosition = useRef(0);
  const contentRef = useRef(null); 
  const debounceTimerRef = useRef(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const currentAudioTimeRef = useRef(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const getPositionKey = () => `reading_position_${novelId}_${chapterId}`;

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

  // Helper function để kiểm tra quyền đọc chapter (tương tự ChapterListDisplay)
  const checkChapterReadPermission = (chapterId, chapterContent) => {
    // Kiểm tra dữ liệu cơ bản trước
    if (!chapterId || !chapterContent) {
      return { canRead: false, reason: 'Missing chapter data' };
    }

    // Kiểm tra nếu chapter miễn phí (coinPrice = 0) - KHÔNG CẦN ĐĂNG NHẬP
    const coinPrice = chapterContent.coinPrice || 0;
    if (coinPrice === 0) {
      return { canRead: true, reason: 'Free chapter (coinPrice = 0)' };
    }

    // Với chapter có phí, yêu cầu phải đăng nhập
    if (!currentUser) {
      return { canRead: false, reason: 'Login required for paid chapter' };
    }
    
    // Kiểm tra nếu đã mua chapter
    const isPurchased = currentUser?.chapterBought?.includes(chapterId);
    if (isPurchased) {
      return { canRead: true, reason: 'Chapter purchased' };
    }
    
    // Kiểm tra nếu đã thuê chapter và còn hạn
    const rentInfo = getChapterRentInfo(chapterId);
    if (rentInfo?.isRented && !rentInfo?.isExpired) {
      return { 
        canRead: true, 
        reason: `Chapter rented (${rentInfo.daysLeft} days left)`,
        rentInfo 
      };
    }
    
    return { canRead: false, reason: 'Chapter not purchased or rented' };
  };

  //luu vị trí đọc audio
  const [audioProgress, setAudioProgress] = useState(0);
  const mainContentRef = useRef(null); // Gắn ref này vào thẻ <main>
 const handleAudioProgressUpdate = useCallback((percentage, currentTimeInSeconds, isPlaying = false) => {
   setCurrentAudioTime(currentTimeInSeconds);
   currentAudioTimeRef.current = currentTimeInSeconds;
   setAudioProgress(percentage);
   setIsAudioPlaying(isPlaying); // Track trạng thái phát
 }, []);
//  const latestDataRef = useRef({});
//   useEffect(() => {
//     latestDataRef.current = {
//       currentUser,
//       currentChapterContent,
//       novelId,
//       chapterId,
//     };
//   }, [currentUser, currentChapterContent, novelId, chapterId]);
// useEffect theo doi audio - COMMENT lại vì không cần cuộn theo audio nữa
 // const isScrollingByAudio = useRef(false);
 
 // useEffect(() => {
 //   if (mainContentAreaRef.current && audioProgress > 0 && !isScrollingByAudio.current) {
 //     isScrollingByAudio.current = true;
 //     
 //     const contentHeight = mainContentAreaRef.current.scrollHeight;
 //     const viewportHeight = window.innerHeight;
 //     const maxScrollableHeight = contentHeight - viewportHeight;
 //     
 //     if (maxScrollableHeight > 0) {
 //       const targetScrollTop = (audioProgress / 100) * maxScrollableHeight;
 //       
 //       window.scrollTo({
 //         top: targetScrollTop,
 //         behavior: 'smooth'
 //       });
 //       
 //       // Gọi createHistory khi cuộn theo audio
 //       if (currentUser && currentChapterContent && targetScrollTop > 100) {
 //         const payload = {
 //           email: currentUser.emailUser,
 //           idChapter: currentChapterContent.idChapter,
 //           readPlace: Math.round(targetScrollTop),
 //           hearTime: currentAudioTimeRef.current,
 //         };
 //         
 //         console.log('[Audio Scroll] Saving history at position:', Math.round(targetScrollTop));
 //         dispatch(createHistory(payload)).catch(error => {
 //           console.error('Error creating history from audio scroll:', error);
 //         });
 //       }
 //     }
 //     
 //     // Reset flag sau khi hoàn thành cuộn
 //     setTimeout(() => {
 //       isScrollingByAudio.current = false;
 //     }, 1000); // Tăng thời gian để đảm bảo cuộn hoàn thành
 //   }
 // }, [audioProgress, currentUser, currentChapterContent, dispatch]);

 // Effect mới: Tự động lưu lịch sử audio mỗi 5 giây khi ĐANG PHÁT audio
 // KHÔNG phụ thuộc vào currentAudioTime để tránh tạo interval liên tục
 const audioSaveIntervalRef = useRef(null);
 
 useEffect(() => {
   // SỬA: Chỉ phụ thuộc vào isAudioPlaying, không phụ thuộc currentAudioTime
   if (currentUser && currentChapterContent && isAudioPlaying) {
     console.log('[Audio Auto Save] Starting auto save interval - Playing:', isAudioPlaying);
     
     // Clear interval cũ nếu có
     if (audioSaveIntervalRef.current) {
       clearInterval(audioSaveIntervalRef.current);
     }
     
     // Tạo interval mới để lưu lịch sử mỗi 5 giây KHI ĐANG PHÁT
     audioSaveIntervalRef.current = setInterval(() => {
       // Kiểm tra lại điều kiện trong interval để đảm bảo vẫn có thể lưu
       if (!currentUser || !currentChapterContent || currentAudioTimeRef.current <= 0) {
         console.log('[Audio Auto Save] Conditions not met, skipping save');
         return;
       }
       
       const currentScrollPosition = Math.round(window.pageYOffset || document.documentElement.scrollTop);
       
       const payload = {
         email: currentUser.emailUser,
         idChapter: currentChapterContent.idChapter,
         readPlace: currentScrollPosition, // Lấy vị trí scroll hiện tại thay vì tính từ audio
         hearTime: currentAudioTimeRef.current,
       };
       
       console.log('[Audio Auto Save] Saving history every 5s while playing - Audio time:', currentAudioTimeRef.current, 'Scroll pos:', currentScrollPosition);
       dispatch(createHistory(payload)).catch(error => {
         console.error('Error creating history from audio auto save:', error);
       });
     }, 5000); // 5 giây
   } else {
     // Clear interval khi không đủ điều kiện HOẶC audio không phát
     if (audioSaveIntervalRef.current) {
       console.log('[Audio Auto Save] Stopping auto save interval - Playing:', isAudioPlaying);
       clearInterval(audioSaveIntervalRef.current);
       audioSaveIntervalRef.current = null;
     }
   }
   
   // Cleanup khi component unmount hoặc dependencies thay đổi
   return () => {
     if (audioSaveIntervalRef.current) {
       clearInterval(audioSaveIntervalRef.current);
       audioSaveIntervalRef.current = null;
     }
   };
 }, [currentUser, currentChapterContent, isAudioPlaying, dispatch]); // Loại bỏ currentAudioTime

  // Reset loading states khi user thay đổi
  useEffect(() => {
    console.log("[User Change] Resetting loading states for new user");
    setHistoryLoadCompleted(false);
    historyLoadedForUser.current = null;
  }, [currentUser?.idUser]);

  // Fetch transaction data để kiểm tra chapter thuê
  useEffect(() => {
    if (currentUser?.idUser) {
      dispatch(getAllTransactions({ statusDeposit: 'SUCCESS', idUser: currentUser.idUser }));
    }
  }, [currentUser?.idUser, dispatch]);

  // Effect kiểm tra quyền truy cập - Thêm ref để tránh toast trùng lặp
 const permissionCheckedRef = useRef(null);
 const toastShownRef = useRef(null); // Ref để track toast đã hiển thị
 
 useEffect(() => {
    // Kiểm tra quyền truy cập khi có đầy đủ thông tin chapter (không cần currentUser cho chapter miễn phí)
    if (chapterId && novelId && currentChapterContent) {
      // Tạo key duy nhất để track việc kiểm tra quyền
      const checkKey = `${chapterId}_${currentUser?.idUser || 'guest'}`;
      
      // Nếu đã kiểm tra rồi thì không kiểm tra lại
      if (permissionCheckedRef.current === checkKey) {
        return;
      }
      
      // Tìm thông tin chapter từ dropdown list để có đầy đủ thông tin về giá
      const chapterFromDropdown = chaptersForReadingPageDropdown?.find(ch => String(ch.idChapter) === String(chapterId));
      const chapterForPermissionCheck = chapterFromDropdown || currentChapterContent;
      
      const permission = checkChapterReadPermission(chapterId, chapterForPermissionCheck);
      
      if (!permission.canRead) {
        // Đánh dấu đã kiểm tra
        permissionCheckedRef.current = checkKey;
        
        // Tạo toast key để tránh trùng lặp
        const toastKey = `${chapterId}_${permission.reason}`;
        if (toastShownRef.current !== toastKey) {
          toastShownRef.current = toastKey;
          
          // Chỉ chặn nếu thực sự không có quyền đọc
          if (permission.reason === 'Login required for paid chapter') {
            toast.info("Vui lòng đăng nhập để đọc chương có phí này.");
          } else {
            toast.error("Bạn cần mua chương này để có thể đọc. Vui lòng tìm chương trong danh sách bên dưới.");
          }
        }
        // Điều hướng người dùng về trang chi tiết của truyện
        navigate(`/novel/${novelId}`, { replace: true });
      } else {
        // Đánh dấu đã kiểm tra thành công
        permissionCheckedRef.current = checkKey;
        
        // Log thông tin để debug
        console.log(`✅ [ReadingPage] Access granted for chapter ${chapterId} - ${permission.reason}`);
        if (permission.rentInfo) {
          console.log(`🕐 [ReadingPage] Rent expires: ${permission.rentInfo.expirationDate.toLocaleDateString('vi-VN')} (${permission.rentInfo.daysLeft} days left)`);
        }
      }
    }
  }, [chapterId, novelId, currentChapterContent, currentUser?.idUser, navigate, chaptersForReadingPageDropdown]);
  
  useEffect(() => {
    localStorage.setItem('readingFontSize', fontSize.toString());
    localStorage.setItem('readingLineHeight', lineHeight.toString());
    localStorage.setItem('readingFontFamily', fontFamily);
    localStorage.setItem('readingTheme', theme);
  }, [fontSize, lineHeight, fontFamily, theme]);
  // Effect #1: Tối ưu tải dữ liệu cơ bản với intelligent caching và batching
useEffect(() => {
  if (novelId) {
    console.log("[Effect #1] Tối ưu tải dữ liệu cho novelId:", novelId);
    
    // Tối ưu: Kiểm tra cache với thời gian dài hơn
    const novelCacheKey = `novel_${novelId}`;
    const chaptersCacheKey = `chapters_${novelId}`;
    const cachedNovel = sessionStorage.getItem(novelCacheKey);
    const cachedChapters = sessionStorage.getItem(chaptersCacheKey);
    const cacheTimestamp = sessionStorage.getItem(`${novelCacheKey}_timestamp`);
    const CACHE_DURATION = 15 * 60 * 1000; // Tăng lên 15 phút cache
    
    const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION;
    
    const shouldFetchNovel = !currentNovel || String(currentNovel.idNovel) !== String(novelId);
    const hasChaptersData = chaptersFromApiForDetailPage && chaptersFromApiForDetailPage.length > 0;
    const isChaptersLoading = chaptersLoading;
    
    // Tối ưu: Chỉ batch khi thực sự cần thiết
    const batchPromises = [];
    
    if (shouldFetchNovel && !novelLoading) {
      if (cachedNovel && isCacheValid) {
        console.log("✅ [ReadingPage] Using cached novel data");
      } else {
        console.log("🔄 [ReadingPage] Fetching novel data for:", novelId);
        batchPromises.push(
          dispatch(getNovelById(novelId)).then((result) => {
            if (result.payload) {
              sessionStorage.setItem(novelCacheKey, JSON.stringify(result.payload));
              sessionStorage.setItem(`${novelCacheKey}_timestamp`, Date.now().toString());
            }
            return result;
          })
        );
      }
    } else {
      console.log("✅ [ReadingPage] Novel data already available in store");
    }
    
    if (hasChaptersData) {
      console.log("✅ [ReadingPage] Using existing chapters data from DetailPage");
      // Tạo dropdown từ dữ liệu có sẵn thay vì gọi API
      dispatch(generateDropdownFromExistingChapters(novelId));
    } else if (!isChaptersLoading) {
      if (cachedChapters && isCacheValid) {
        console.log("✅ [ReadingPage] Using cached chapters data");
      } else {
        console.log("🔄 [ReadingPage] No chapters data found, fetching from API");
        batchPromises.push(
          dispatch(getAllChapters(novelId)).then((result) => {
            if (result.payload) {
              sessionStorage.setItem(chaptersCacheKey, JSON.stringify(result.payload));
            }
            return result;
          })
        );
      }
    } else {
      console.log("⏳ [ReadingPage] Chapters are loading, skipping API call");
    }
    
    // Execute batch với error handling
    if (batchPromises.length > 0) {
      Promise.allSettled(batchPromises).then((results) => {
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn('[ReadingPage] Some API calls failed:', failures);
        } else {
          console.log('✅ [ReadingPage] Batch API calls completed successfully');
        }
      });
    }
    
  }
  
  return () => {
    // Không clear state nữa để tái sử dụng data
    // dispatch(clearChapterState());
  };
}, [dispatch, novelId, currentNovel, chaptersFromApiForDetailPage, chaptersLoading, novelLoading]);

// Effect để tự động tạo dropdown khi có dữ liệu chapters từ DetailPage
useEffect(() => {
  if (chaptersFromApiForDetailPage && chaptersFromApiForDetailPage.length > 0 && novelId) {
    // Kiểm tra xem dropdown đã được tạo cho novelId này chưa
    const currentDropdownNovelId = chaptersForReadingPageDropdown.length > 0 ? 
      chaptersForReadingPageDropdown[0]?.novelId || novelId : null;
    
    if (!currentDropdownNovelId || String(currentDropdownNovelId) !== String(novelId)) {
      console.log("🔄 [ReadingPage] Auto-generating dropdown from existing chapters data");
      dispatch(generateDropdownFromExistingChapters(novelId));
    }
  }
}, [chaptersFromApiForDetailPage, novelId, dispatch, chaptersForReadingPageDropdown]);

// Effect #2: Tải nội dung chương và tăng lượt xem
useEffect(() => {
  let isCurrentRequest = true;

  const loadChapterContent = async () => {
    if (novelId && chapterId) {
      console.log("[Effect #2] Tải nội dung cho chapterId:", chapterId);
      
      // Đánh dấu bắt đầu tải content
      setChapterContentLoadCompleted(false);
      
      // SỬA: SCROLL VỀ TOP NGAY LẬP TỨC khi bắt đầu load chương mới
      window.scrollTo({ top: 0, behavior: 'auto' });
      console.log("[Effect #2] Reset scroll position to top for new chapter");
      
      try {
        // Reset states trước khi tải nội dung mới
        if (contentRef.current) contentRef.current.scrollTop = 0;
        setShowContinueDialog(false);
        setSavedScrollPosition(null);
        setProcessedChapterContent(null);
        
        // SỬA: Reset trạng thái audio khi chuyển chương
        setCurrentAudioTime(0);
        setIsAudioPlaying(false);
        currentAudioTimeRef.current = 0;

        // Tải nội dung chương
        const result = await dispatch(getChapterContentById({ novelId, chapterId }));
        // Nếu lỗi (ví dụ: admin đã xóa chapter), điều hướng về trang truyện
        if (result?.error) {
          if (isCurrentRequest) {
            setChapterContentLoadCompleted(true);
            navigate(`/novel/${novelId}`, { replace: true });
          }
          return;
        }

        // Đánh dấu hoàn thành tải content
        if (isCurrentRequest) {
          setChapterContentLoadCompleted(true);
        }

        // TĂNG VIEW: chỉ gọi nếu chưa tăng view cho chương này trong session
        const viewKey = `viewed_${novelId}_${chapterId}`;
        if (!sessionStorage.getItem(viewKey)) {
          if (isCurrentRequest) {
            dispatch(increaseChapterView(chapterId));
            sessionStorage.setItem(viewKey, '1');
          }
        } else {
          console.log(`[Effect #2] Đã tăng view cho chương này trong session, bỏ qua tăng view.`);
        }
      } catch (error) {
        console.error("[Effect #2] Lỗi khi tải nội dung:", error);
        if (isCurrentRequest) {
          setChapterContentLoadCompleted(true); // Vẫn đánh dấu completed dù có lỗi
        }
      }
    }
  };

  loadChapterContent();

  return () => {
    isCurrentRequest = false;
  };
}, [dispatch, novelId, chapterId]);

// Effect #3: Tải lịch sử đọc của người dùng (chỉ một lần cho mỗi user)
const historyLoadedForUser = useRef(null);

useEffect(() => {
  let isActive = true;

  const loadUserHistory = async () => {
    if (currentUser?.idUser && currentUser.idUser !== historyLoadedForUser.current) {
      console.log("[Effect #3] Tải lịch sử cho user:", currentUser.idUser);
      
      // Đánh dấu bắt đầu tải history
      setHistoryLoadCompleted(false);
      
      try {
        if (isActive) {
          await dispatch(getAllHistoryByUser(currentUser.idUser));
          historyLoadedForUser.current = currentUser.idUser; // Đánh dấu đã tải cho user này
          
          // Đánh dấu hoàn thành tải history
          if (isActive) {
            setHistoryLoadCompleted(true);
          }
        }
      } catch (error) {
        console.error("[Effect #3] Lỗi khi tải lịch sử:", error);
        if (isActive) {
          setHistoryLoadCompleted(true); // Vẫn đánh dấu completed dù có lỗi
        }
      }
    } else if (!currentUser?.idUser) {
      // Không có user, coi như hoàn thành
      setHistoryLoadCompleted(true);
    } else {
      // User đã được tải rồi, coi như hoàn thành
      setHistoryLoadCompleted(true);
    }
  };

  loadUserHistory();

  return () => {
    isActive = false;
  };
}, [dispatch, currentUser?.idUser]); // Chỉ phụ thuộc vào user ID

// Effect để kiểm tra khi cả history và content đã load xong
useEffect(() => {
  const bothCompleted = historyLoadCompleted && chapterContentLoadCompleted;
  
  console.log(`[Data Loading Status] History: ${historyLoadCompleted}, Content: ${chapterContentLoadCompleted}, Both: ${bothCompleted}`);
  
  if (bothCompleted) {
    setIsInitialDataLoading(false);
    console.log("[Data Loading] All initial data loaded, ready for interactions");
  } else {
    setIsInitialDataLoading(true);
  }
}, [historyLoadCompleted, chapterContentLoadCompleted]);

// Effect #4: Hiển thị dialog "ĐỌC TIẾP?" và set vị trí audio - CHỈ KHI ĐÃ LOAD XONG
// Sử dụng ref để tránh hiển thị dialog nhiều lần cho cùng một chương
const dialogShownForChapter = useRef(null);
const dialogProcessedForChapter = useRef(null); // Thêm ref để track việc đã xử lý dialog

useEffect(() => {
  // ĐIỀU KIỆN MỚI: Chỉ chạy khi tất cả dữ liệu đã được tải xong
  if (isInitialDataLoading) {
    console.log("[Effect #4] Still loading initial data, skipping history dialog check");
    return;
  }

  // Điều kiện tiên quyết: chỉ chạy khi có đủ dữ liệu
  if (loadingContent || !currentChapterContent || !Array.isArray(userHistory) || userHistory.length === 0) {
    setSavedAudioPosition(0); // reset audio về 0 khi vào chương mới
    return;
  }

  // RÀNG BUỘC CHẶT: Kiểm tra cả dialogShownForChapter và dialogProcessedForChapter
  if (dialogShownForChapter.current === chapterId || dialogProcessedForChapter.current === chapterId) {
    console.log("[Effect #4] Dialog already shown/processed for this chapter, skipping");
    return;
  }

  // RÀNG BUỘC THÊM: Chỉ chạy khi dialog chưa được hiển thị
  if (showContinueDialog) {
    console.log("[Effect #4] Dialog is already showing, skipping");
    return;
  }

  console.log("[Effect #4] Checking history for chapter:", chapterId);

  let chapterHistoryFound = null;
  for (const novelGroup of userHistory) {
    if (novelGroup && Array.isArray(novelGroup.historyReadRespones)) {
      const found = novelGroup.historyReadRespones.find(
        (chap) => String(chap.id?.idChapter) === String(chapterId)
      );
      if (found) {
        chapterHistoryFound = found;
        break;
      }
    }
  }

  if (chapterHistoryFound) {
    console.log("[Effect #4] Found chapter history:", chapterHistoryFound);
    
    // Set vị trí audio ngay lập tức nếu có trong lịch sử
    if (chapterHistoryFound.hearTime && chapterHistoryFound.hearTime > 0) {
      console.log('[History] Setting audio position to:', chapterHistoryFound.hearTime);
      setSavedAudioPosition(chapterHistoryFound.hearTime);
    } else {
      setSavedAudioPosition(0);
    }
    
    // RÀNG BUỘC CHẶT HƠN: Chỉ hiển thị dialog nếu có vị trí đọc đáng kể VÀ chưa được xử lý
    if (chapterHistoryFound.readPlace > 100) { // Tăng threshold từ 50 lên 100
      console.log("[Effect #4] Showing continue dialog for saved position:", chapterHistoryFound.readPlace);
      setSavedScrollPosition(chapterHistoryFound.readPlace);
      setShowContinueDialog(true);
      
      // Đánh dấu cả hai ref để đảm bảo không hiển thị lại
      dialogShownForChapter.current = chapterId;
      dialogProcessedForChapter.current = chapterId;
    } else {
      // Đánh dấu đã xử lý dù không hiển thị dialog
      dialogProcessedForChapter.current = chapterId;
    }
  } else {
    console.log("[Effect #4] No history found for chapter:", chapterId);
    setSavedAudioPosition(0); // reset audio về 0 nếu không có lịch sử
    // Đánh dấu đã xử lý dù không có lịch sử
    dialogProcessedForChapter.current = chapterId;
  }
}, [userHistory, loadingContent, currentChapterContent, chapterId, isInitialDataLoading, showContinueDialog]);

// Effect set lại scroll position khi dialog được xác nhận
// Khi vào chương mới, luôn scroll về top 0 và reset dialog state  
useEffect(() => {
  // SỬA: Đảm bảo scroll về top khi chuyển chương (backup)
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop > 0) {
    console.log("[Chapter Change] Force scroll to top - Current position:", scrollTop);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  
  // Reset dialog state khi chương thay đổi
  setShowContinueDialog(false);
  setSavedScrollPosition(null);
  dialogShownForChapter.current = null; // Reset flag để có thể hiển thị dialog cho chương mới
  dialogProcessedForChapter.current = null; // Reset flag xử lý dialog
  permissionCheckedRef.current = null; // Reset permission check để có thể kiểm tra lại cho chương mới
  toastShownRef.current = null; // Reset toast để có thể hiển thị lại cho chương mới
  
  // Reset loading states khi chuyển chương
  setIsInitialDataLoading(true);
  setHistoryLoadCompleted(false);
  setChapterContentLoadCompleted(false);
}, [chapterId]);

// Khi ấn Đọc tiếp mới scroll tới vị trí đã lưu
useEffect(() => {
  if (showContinueDialog && savedScrollPosition !== null) {
    // Không scroll ở đây nữa, chỉ show dialog
    // (Scroll sẽ thực hiện khi user ấn Đọc tiếp)
  }
}, [showContinueDialog, savedScrollPosition]);
// Effect #5: Theo dõi và LƯU VỊ TRÍ ĐỌC - CHỈ KHI ĐÃ LOAD XONG DỮ LIỆU
let vitrilandau = 100;
const lastSavedPosition = useRef(0); // Track vị trí đã lưu gần nhất

useEffect(() => {
  // ĐIỀU KIỆN MỚI: Chỉ cho phép lưu lịch sử khi đã load xong dữ liệu ban đầu
  if (isInitialDataLoading) {
    console.log("[Effect #5] Still loading initial data, scroll tracking disabled");
    return;
  }

  // THAY ĐỔI Ở ĐÂY:
  // Thay vì lắng nghe trên `contentRef.current`, chúng ta sẽ lắng nghe trên `window`.
  // `window` là đối tượng đáng tin cậy nhất cho sự kiện cuộn trang toàn cục.
  const scrollContainer = contentRef.current; // Vẫn giữ ref này để lấy chiều cao nếu cần

  // Điều kiện để gắn listener vẫn giữ nguyên
  if (!scrollContainer || !currentUser || !currentChapterContent?.titleChapter) {
    return;
  }
  
  console.log("[Effect #5] Enabling scroll tracking for chapter:", chapterId);
  
  const handleScroll = () => {
    // COMMENT: Không cần kiểm tra isScrollingByAudio nữa vì audio không cuộn
    // if (isScrollingByAudio.current) {
    //   return;
    // }
    
    // --- THÊM LOG DEBUG ---
    const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const divScrollTop = scrollContainer.scrollTop;
    // console.log(`[Scroll Debug] Window ScrollTop: ${windowScrollTop}, Div ScrollTop: ${divScrollTop}`);
    // ----------------------

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      // SỬA Ở ĐÂY: Luôn sử dụng `windowScrollTop` để có giá trị chính xác.
      const readPlace = Math.round(windowScrollTop); 
      
      // Chỉ lưu nếu vị trí thay đổi đáng kể (ít nhất 200px) và > 50px
      const positionDiff = Math.abs(readPlace - lastSavedPosition.current);
      
      // SỬA: Cho phép lưu lịch sử khi cuộn cả lên và xuống, chỉ cần > 50px và có thay đổi đáng kể
      if (readPlace > 50 && chapterId && positionDiff >= 200) {
        // console.log(currentChapterContent)
        const payload = {
          email: currentUser.emailUser,
          // Giờ đây chapterId đã được đảm bảo có giá trị
          idChapter: currentChapterContent.idChapter, // Gửi đi dưới dạng chuỗi là an toàn nhất
          readPlace,
          hearTime: currentAudioTimeRef.current, // Luôn lấy giá trị mới nhất
        };
        console.log(`[Manual Scroll] Dispatching createHistory... Position: ${readPlace}, Direction: ${readPlace > lastSavedPosition.current ? 'Down' : 'Up'}`);
        
        lastSavedPosition.current = readPlace; // Cập nhật vị trí đã lưu
        
        dispatch(createHistory(payload))
          .unwrap()
          .then(() => {
            // Chỉ refresh history nếu cần thiết (ví dụ: mỗi 5 lần lưu)
             dispatch(refreshUserHistory()); // Tạm thời comment để giảm spam API
          })
          .catch(error => {
            console.error('Error creating history:', error);
          });
      }
    }, 2000); // Giảm debounce time xuống 2s để responsive hơn
  };

  // console.log(`[Effect #5] Gắn listener cuộn chuột cho chapterId: ${chapterId}`);
  // Lắng nghe sự kiện trên `window`
  window.addEventListener('scroll', handleScroll);

  // Hàm dọn dẹp
  return () => {
    // console.log(`[Effect #5] Dọn dẹp listener cuộn chuột cho chapterId: ${chapterId}`);
    // Gỡ listener khỏi `window`
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(debounceTimerRef.current);
  };
}, [dispatch, currentUser, currentChapterContent, novelId, chapterId, isInitialDataLoading]);
// Effect #5: Theo dõi và LƯU VỊ TRÍ ĐỌC Thoat(sử dụng ref để tránh lặp lại)
//  useEffect(() => {
//   // Chỉ thực hiện logic này nếu người dùng đã đăng nhập
//   if (!currentUser) {
//     return;
//   }

//   const handleBeforeUnload = (event) => {
//     const currentScrollPosition = Math.round(window.pageYOffset || document.documentElement.scrollTop);

//     // Kiểm tra nếu các điều kiện hợp lệ để gửi dữ liệu lịch sử đọc
//     if (currentScrollPosition > 100 && novelId && chapterId && currentChapterContent?.titleChapter) {
//       const payload = {
//         email: currentUser.emailUser,
//         idChapter: currentChapterContent.idChapter,
//         readPlace: currentScrollPosition,
//       };

//       console.log('[Effect Beacon] Đang chuẩn bị gửi lịch sử đọc:', payload);

//       // Gửi yêu cầu bằng apiClient (axios)
//       const beaconURL = `${apiClient.defaults.baseURL}/user/createHistory`;

//       apiClient.post(beaconURL, payload)
//         .then(response => {
//           if (response.status === 200) {
//             console.log('[Axios] Dữ liệu lịch sử đã được gửi thành công.');
//           } else {
//             console.error('[Axios] Lỗi khi gửi dữ liệu lịch sử:', response.status);
//           }
//         })
//         .catch(error => {
//           console.error('[Axios] Không thể gửi dữ liệu lịch sử:', error.message);
//         });
//     }
//   };

//   // Gắn sự kiện `beforeunload` để lưu lịch sử đọc khi người dùng rời khỏi trang
//   window.addEventListener('beforeunload', handleBeforeUnload);

//   // Dọn dẹp sự kiện khi component unmount
//   return () => {
//     window.removeEventListener('beforeunload', handleBeforeUnload);
//   };
// }, [currentUser, novelId, chapterId, currentChapterContent]);
  const handleNavigateWithPurchaseCheck = (targetChapterId) => {
    if (!targetChapterId) {
      console.error("ID chương mục tiêu không hợp lệ.");
      return; 
    }

    // Tìm chapter trong danh sách để lấy thông tin coinPrice
    const targetChapter = chaptersForReadingPageDropdown?.find(ch => String(ch.idChapter) === String(targetChapterId));
    
    if (targetChapter) {
      const permission = checkChapterReadPermission(targetChapterId, targetChapter);
      
      if (permission.canRead) {
        // Có quyền đọc: Cho phép điều hướng
        setProcessedChapterContent(null); // Xóa nội dung cũ để hiển thị loading
        navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
      } else {
        // Không có quyền: Báo lỗi và thông báo tương ứng
        if (permission.reason === 'Login required for paid chapter') {
          toast.info("Vui lòng đăng nhập để đọc chương có phí này.");
          navigate('/');
        } else {
          toast.error("Bạn cần mua hoặc thuê chương này để đọc. Vui lòng kiểm tra trong danh sách chương.");
          navigate(`/novel/${novelId}`); 
        }
      }
    } else {
      // Không tìm thấy chapter trong danh sách, cho phép điều hướng (có thể là chapter miễn phí)
      console.warn("Không tìm thấy chapter trong dropdown, cho phép điều hướng...");
      setProcessedChapterContent(null);
      navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
    }
  };
  useEffect(() => {
    if (currentChapterContent?.contentChapter && mainContentAreaRef.current && canvasContainerWidth > 0) {
      const originalText = currentChapterContent.contentChapter;
      const paragraphs = originalText.split(/\r\n|\n/).filter(p => p.trim() !== '');

      let potentialCanvasSegments = [];
      const MIN_LENGTH_FOR_CANVAS = 50;
      const MAX_LENGTH_FOR_CANVAS = 100;
      const NUM_CANVAS_SECTIONS = 5;


      paragraphs.forEach((paragraphText, pIndex) => {
        const trimmedText = paragraphText.trim();
        if (trimmedText.length >= MIN_LENGTH_FOR_CANVAS && trimmedText.length <= MAX_LENGTH_FOR_CANVAS && !/<[^>]+>/.test(trimmedText) && !/^Chương\s*\d+/i.test(trimmedText) && trimmedText.split(' ').length > 3 ) {
          potentialCanvasSegments.push({ text: trimmedText, originalIndex: pIndex });
        }
      });

      let contentToRender = [];
      let canvasIndices = new Set();

      if (potentialCanvasSegments.length > 0) {
          let tempPoints = [...potentialCanvasSegments];
          for (let i = 0; i < NUM_CANVAS_SECTIONS && tempPoints.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * tempPoints.length);
            canvasIndices.add(tempPoints[randomIndex].originalIndex);
            tempPoints.splice(randomIndex, 1);
          }
      }

      let htmlBufferArray = [];
      paragraphs.forEach((paragraphText, pIndex) => {
        const isSelectedForCanvas = canvasIndices.has(pIndex);
        if (isSelectedForCanvas) {
          if (htmlBufferArray.length > 0) {
            contentToRender.push({ type: 'html', content: htmlBufferArray.join('<br />') });
            htmlBufferArray = [];
          }
          contentToRender.push({ type: 'canvas', text: paragraphText.trim() });
        } else {
          htmlBufferArray.push(paragraphText);
        }
      });

      if (htmlBufferArray.length > 0) {
        contentToRender.push({ type: 'html', content: htmlBufferArray.join('<br />') });
      }
      
      if (contentToRender.length === 0 && originalText) {
        setProcessedChapterContent([{ type: 'html', content: originalText.replace(/\n/g, '<br />') }]);
      } else if (contentToRender.length > 0) {
        setProcessedChapterContent(contentToRender);
      } else {
         setProcessedChapterContent([{ type: 'html', content: originalText.replace(/\n/g, '<br />') }]);
      }
    } else if (currentChapterContent?.contentChapter) {
      setProcessedChapterContent([{ type: 'html', content: currentChapterContent.contentChapter.replace(/\n/g, '<br />') }]);
    } else {
      setProcessedChapterContent(null);
    }
  }, [currentChapterContent?.contentChapter, fontSize, fontFamily, lineHeight, theme, canvasContainerWidth]);
   useEffect(() => {
    const measureContainer = () => {
      if (mainContentAreaRef.current) {
        const newWidth = mainContentAreaRef.current.offsetWidth;
        if (newWidth > 0 && newWidth !== canvasContainerWidth) {
            setCanvasContainerWidth(newWidth);
        }
      }
    };
    let rafId;
    const debouncedMeasure = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(measureContainer);
    };
    if(mainContentAreaRef.current && canvasContainerWidth === 0) { // Đo lần đầu nếu chưa có width
        debouncedMeasure();
    }
    window.addEventListener('resize', debouncedMeasure);
    return () => {
        window.removeEventListener('resize', debouncedMeasure);
        cancelAnimationFrame(rafId);
    };
  }, [canvasContainerWidth, currentChapterContent?.contentChapter]); // Chạy lại khi currentChapterContent thay đổi


  const handleConfirmContinue = () => {
    // Khi ấn Đọc tiếp, scroll tới vị trí đã lưu
    if (savedScrollPosition !== null) {
      setTimeout(() => {
        window.scrollTo({
          top: savedScrollPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
    
    // Vị trí audio đã được set từ trước trong effect #4, không cần lấy lại
    console.log('[Continue] Audio position already set to:', savedAudioPosition);
    
    setShowContinueDialog(false);
    // RÀNG BUỘC: Đánh dấu rằng dialog đã được xử lý hoàn toàn cho chương này
    dialogShownForChapter.current = chapterId;
    dialogProcessedForChapter.current = chapterId;
  };
  
  const handleCancelContinue = () => {
    setShowContinueDialog(false);
    setSavedScrollPosition(null);
    setSavedAudioPosition(0);
    // RÀNG BUỘC: Đánh dấu rằng dialog đã được xử lý hoàn toàn cho chương này
    dialogShownForChapter.current = chapterId;
    dialogProcessedForChapter.current = chapterId;
    localStorage.removeItem(getPositionKey());
  };

  // Toggle function for audio player
  const toggleAudioPlayer = () => {
    setShowAudioPlayer(prev => !prev);
    // Lưu trạng thái vào localStorage
    localStorage.setItem('showAudioPlayer', (!showAudioPlayer).toString());
  };
  
  // ======================= FIX 2: SẮP XẾP LẠI THỨ TỰ KHAI BÁO =======================
  // BƯỚC 1: Khai báo các biến tính toán từ state (useMemo) trước.
  const { currentChapterIndex, prevChapterDetails, nextChapterDetails } = useMemo(() => {
    if (!chaptersForReadingPageDropdown || chaptersForReadingPageDropdown.length === 0) {
      return { currentChapterIndex: -1, prevChapterDetails: null, nextChapterDetails: null };
    }
    const currentIndex = chaptersForReadingPageDropdown.findIndex(chap => String(chap.idChapter) === String(chapterId));
    if (currentIndex === -1) {
        return { currentChapterIndex: -1, prevChapterDetails: null, nextChapterDetails: null };
    }
    const prev = currentIndex > 0 ? chaptersForReadingPageDropdown[currentIndex - 1] : null;
    const next = currentIndex < chaptersForReadingPageDropdown.length - 1 ? chaptersForReadingPageDropdown[currentIndex + 1] : null;
    return { currentChapterIndex: currentIndex, prevChapterDetails: prev, nextChapterDetails: next };
  }, [chapterId, chaptersForReadingPageDropdown]);

  const currentindexChapter = useMemo(() => {
    // Ưu tiên lấy từ currentChapterContent nếu có indexChapter hoặc chapterNumber
    if (currentChapterContent) {
      // Kiểm tra indexChapter từ currentChapterContent trước
      if (currentChapterContent.indexChapter !== null && currentChapterContent.indexChapter !== undefined && !isNaN(currentChapterContent.indexChapter)) {
        return Number(currentChapterContent.indexChapter) ; // Hiển thị từ 1
      }
      // Nếu không có indexChapter, thử chapterNumber
      if (currentChapterContent.chapterNumber !== null && currentChapterContent.chapterNumber !== undefined && !isNaN(currentChapterContent.chapterNumber)) {
        return Number(currentChapterContent.chapterNumber);
      }
    }
    
    // Nếu không có từ currentChapterContent, lấy từ dropdown
    if (currentChapterIndex !== -1 && chaptersForReadingPageDropdown?.[currentChapterIndex]) {
      const chap = chaptersForReadingPageDropdown[currentChapterIndex];
      if (chap.indexChapter !== null && chap.indexChapter !== undefined && !isNaN(chap.indexChapter)) {
        return Number(chap.indexChapter) + 1; // Hiển thị từ 1
      }
      if (chap.chapterNumber !== null && chap.chapterNumber !== undefined && chap.chapterNumber !== 'N/A' && !isNaN(Number(chap.chapterNumber))) {
        return Number(chap.chapterNumber);
      }
    }
    
    return null;
  }, [currentChapterIndex, chaptersForReadingPageDropdown, currentChapterContent]);

  const isFirstChapter = currentChapterIndex === 0 && chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length > 0;

  const isLastChapter = !!(chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length > 0 && currentChapterIndex === chaptersForReadingPageDropdown.length - 1);

  // BƯỚC 3: Khai báo các hàm xử lý phụ thuộc vào các biến ở trên.
  // const handlePrevChapter = () => {
  //   if (prevChapterDetails?.idChapter) {
  //     setProcessedChapterContent(null);
  //     navigate(`/novel/${novelId}/chapter/${prevChapterDetails.idChapter}`);
  //   }
  // };

  // const handleNextChapter = () => {
  //   if (nextChapterDetails?.idChapter) {
  //     setProcessedChapterContent(null);
  //     navigate(`/novel/${novelId}/chapter/${nextChapterDetails.idChapter}`);
  //   }
  // };

  // const handleChapterSelect = (selectedChapterId) => {
  //   if (selectedChapterId && String(selectedChapterId) !== String(chapterId)) {
  //     setProcessedChapterContent(null);
  //     navigate(`/novel/${novelId}/chapter/${selectedChapterId}`);
  //   }
  //   setShowChapterListDropdown(false);
  // };
   const handlePrevChapter = () => {
    if (prevChapterDetails?.idChapter) {
      handleNavigateWithPurchaseCheck(prevChapterDetails.idChapter);
    }
  };

  const handleNextChapter = () => {
    if (nextChapterDetails?.idChapter) {
      handleNavigateWithPurchaseCheck(nextChapterDetails.idChapter);
    }
  };

  const handleChapterSelect = (selectedChapterId) => {
    if (selectedChapterId && String(selectedChapterId) !== String(chapterId)) {
      handleNavigateWithPurchaseCheck(selectedChapterId);
    }
    setShowChapterListDropdown(false);
  };
  
  // ======================= KẾT THÚC FIX 2 =======================

  const renderErrorText = (err, type = "Nội dung") => (
    <div className="text-center py-10 text-red-500">Lỗi tải {type}: {typeof err === 'string' ? err : (err?.message || 'Đã có lỗi không xác định.')}</div>
  );
 // Kiểm tra quyền truy cập trước khi render để tránh flash content
  if (currentUser && currentChapterContent) {
    // Sử dụng cùng logic như useEffect
    const chapterFromDropdown = chaptersForReadingPageDropdown?.find(ch => String(ch.idChapter) === String(chapterId));
    const chapterForPermissionCheck = chapterFromDropdown || currentChapterContent;
    const permission = checkChapterReadPermission(chapterId, chapterForPermissionCheck);
    
    if (!permission.canRead) {
      return <div className="flex justify-center items-center min-h-screen text-xl">Đang kiểm tra quyền truy cập...</div>;
    }
  }

  // Hiển thị loading khi đang tải dữ liệu ban đầu
  if (isInitialDataLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-xl">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <div className="text-center">
          <p className="mb-2">Đang tải dữ liệu chương...</p>
          <p className="text-sm text-gray-600">
            {!historyLoadCompleted && "⏳ Đang tải lịch sử đọc..."}
            {!chapterContentLoadCompleted && "⏳ Đang tải nội dung chương..."}
          </p>
        </div>
      </div>
    );
  }

  if (loadingContent && (!currentChapterContent || String(currentChapterContent.idChapter) !== String(chapterId))) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải nội dung chương...</div>;
  if (errorContent && (!currentChapterContent || String(currentChapterContent.idChapter) !== String(chapterId))) return renderErrorText(errorContent, "nội dung chương");
  if (!currentChapterContent) return <div className="flex justify-center items-center min-h-screen text-xl">Không tìm thấy nội dung chương này.</div>;


  if (novelLoading && !currentNovel) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải thông tin truyện...</div>;
  if (novelError && !currentNovel) return renderErrorText(novelError, "thông tin truyện");
  if (!currentNovel) {
    if (!novelLoading) return <div className="flex justify-center items-center min-h-screen text-xl">Không tìm thấy thông tin truyện.</div>;
    return <div className="flex justify-center items-center min-h-screen text-xl">Đang chuẩn bị dữ liệu truyện...</div>;
  }
  // if (loadingListForReading && (!chaptersForReadingPageDropdown || chaptersForReadingPageDropdown.length === 0)) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải danh sách chương...</div>;
  // if (errorListForReading && (!chaptersForReadingPageDropdown || chaptersForReadingPageDropdown.length === 0)) return renderErrorText(errorListForReading, "danh sách chương");
  // if (chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length === 0 && !loadingListForReading && !errorListForReading) return <div className="flex justify-center items-center min-h-screen text-xl">Truyện này chưa có chương nào.</div>;
  if (loadingContent && (!currentChapterContent || String(currentChapterContent.idChapter) !== String(chapterId))) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải nội dung chương...</div>;
  if (errorContent && (!currentChapterContent || String(currentChapterContent.idChapter) !== String(chapterId))) return renderErrorText(errorContent, "nội dung chương");
  if (!currentChapterContent) {
    if (chapterId && !loadingContent && !errorContent) return <div className="flex justify-center items-center min-h-screen text-xl">Không tìm thấy nội dung chương này.</div>;
    return <div className="flex justify-center items-center min-h-screen text-xl">Đang chuẩn bị nội dung...</div>;
  }

  const themeClasses = {
    'xam-nhat': 'bg-gray-100 text-gray-800', 'den': 'bg-gray-900 text-gray-200', 'trang': 'bg-white text-gray-900',
  };
  const currentThemeClass = themeClasses[theme] || themeClasses['xam-nhat'];

  return (
    <div className={`reading-page min-h-screen flex flex-col ${currentThemeClass} transition-colors duration-300`} style={{ fontFamily: fontFamily, paddingTop: pagePaddingTop, paddingBottom: pagePaddingBottom }}>
      {showContinueDialog && ( <ContinueReadingDialog onConfirm={handleConfirmContinue} onCancel={handleCancelContinue} /> )}

      <header className={`${theme === 'den' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} shadow-md py-3 sticky z-30`} style={{ top: readingHeaderStickyTop }}>
         <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-center sm:text-left mb-2 sm:mb-0">
            <h1 className="text-xl md:text-2xl font-semibold truncate max-w-xs md:max-w-md lg:max-w-2xl">
              <Link to={`/novel/${novelId}`} className={`${theme === 'den' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline`}>{currentNovel.nameNovel || 'Tên truyện'}</Link>
            </h1>
            <p className={`text-sm ${theme === 'den' ? 'text-gray-400' : 'text-gray-600'}`}>
              Chương {currentindexChapter !== null && currentindexChapter !== undefined ? currentindexChapter : 'N/A'}: {currentChapterContent?.titleChapter || 'Tiêu đề chương'}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Previous Button - kiểm tra quyền truy cập */}
            {(() => {
              const prevCanAccess = prevChapterDetails ? 
                checkChapterReadPermission(prevChapterDetails.idChapter, prevChapterDetails).canRead : false;
              return (
                <button 
                  onClick={handlePrevChapter} 
                  disabled={isFirstChapter || !prevChapterDetails || !prevCanAccess} 
                  className={`px-2 py-1.5 sm:px-3 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={!prevCanAccess && prevChapterDetails ? 'Chapter trước cần mua hoặc thuê để đọc' : undefined}
                >
                  <FaAngleLeft className="inline mr-1" /> Trước
                </button>
              );
            })()}
            <div className="relative">
              <button onClick={() => setShowChapterListDropdown(prev => !prev)} className="px-2 py-1.5 sm:px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm w-28 sm:w-32 text-center flex items-center justify-center">
                <FaListUl className="inline mr-1" />  Chương {currentindexChapter !== null && currentindexChapter !== undefined ? currentindexChapter : '?'}
                <svg className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform duration-200 ${showChapterListDropdown ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {showChapterListDropdown && chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length > 0 && (
                <div className={`absolute top-full mt-1 ${theme === 'den' ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} border rounded shadow-lg max-h-60 w-64 sm:w-72 overflow-y-auto z-40`}>
                  {chaptersForReadingPageDropdown.map((chap, index) => {

                    // Logic này giờ đã an toàn vì `indexChapter` được đảm bảo có trong `chap`
                    let displayindexChapter;
                    if (chap.indexChapter !== null && chap.indexChapter !== undefined && !isNaN(chap.indexChapter)) {
                      displayindexChapter = Number(chap.indexChapter) + 1; // Hiển thị cho người dùng (từ 1)
                    } else {
                      displayindexChapter = index + 1;
                    }
                    const chapterTitleText = chap.titleChapter || 'Chưa có tiêu đề';
                    const fullTitle = `Chương ${displayindexChapter}: ${chapterTitleText}`;

                    // Kiểm tra quyền đọc chapter - KHÔNG CẦN currentUser cho chapter miễn phí
                    const permission = checkChapterReadPermission(chap.idChapter, chap);
                    const isCurrentChapter = String(chap.idChapter) === String(chapterId);
                    const canAccess = permission.canRead;
                    
                    // Visual cues cho chapter bị khóa
                    const lockIcon = !canAccess ? ' 🔒' : '';
                    const displayTitle = `Chương ${displayindexChapter}: ${chapterTitleText}${lockIcon}`;
                    
                    return (
                      <button 
                        key={chap.idChapter || `chap-dropdown-${index}`} 
                        onClick={() => canAccess ? handleChapterSelect(chap.idChapter) : toast.error("Bạn cần mua hoặc thuê chương này để đọc.")} 
                        className={`block w-full text-left px-3 py-2 text-sm truncate ${
                          isCurrentChapter 
                            ? `font-bold ${theme === 'den' ? 'text-blue-300 bg-gray-600' : 'text-blue-600 bg-blue-50'}` 
                            : canAccess 
                              ? `${theme === 'den' ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}` 
                              : `${theme === 'den' ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`
                        }`} 
                        title={canAccess ? fullTitle : `${fullTitle} - Cần mua hoặc thuê để đọc`}
                        disabled={!canAccess}
                      >
                        {displayTitle}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Next Button - kiểm tra quyền truy cập */}
            {(() => {
              const nextCanAccess = nextChapterDetails ? 
                checkChapterReadPermission(nextChapterDetails.idChapter, nextChapterDetails).canRead : false;
              return (
                <button 
                  onClick={handleNextChapter} 
                  disabled={isLastChapter || !nextChapterDetails || !nextCanAccess} 
                  className={`px-2 py-1.5 sm:px-3 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={!nextCanAccess && nextChapterDetails ? 'Chapter tiếp theo cần mua hoặc thuê để đọc' : undefined}
                >
                  Sau <FaAngleRight className="inline ml-1" />
                </button>
              );
            })()}
             <div className="relative">
              <button onClick={() => setShowSettings(prev => !prev)} className={`p-2 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded`} title="Tùy chỉnh"><FaCog /></button>
              {showSettings && (
                <div className={`absolute top-full mt-1 right-0 ${theme === 'den' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} border rounded shadow-lg p-4 w-60 sm:w-64 z-40`}>
                  <h4 className="text-sm font-semibold mb-3">Tùy Chỉnh</h4>
                  <div className="mb-2"><label className="block text-xs mb-1">Màu nền:</label><select value={theme} onChange={(e) => setTheme(e.target.value)} className={`w-full p-1.5 text-xs border rounded ${theme === 'den' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'} focus:outline-none focus:border-blue-500`}><option value="xam-nhat">Xám nhạt</option><option value="den">Đen</option><option value="trang">Trắng</option></select></div>
                  <div className="mb-2"><label className="block text-xs mb-1">Font chữ:</label><select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className={`w-full p-1.5 text-xs border rounded ${theme === 'den' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'} focus:outline-none focus:border-blue-500`}><option value="Tahoma">Tahoma</option><option value="Arial">Arial</option><option value="Verdana">Verdana</option><option value="'Times New Roman'">Times New Roman</option></select></div>
                  <div className="mb-2"><label className="block text-xs mb-1">Size chữ: {fontSize}px</label><input type="range" min="12" max="32" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/></div>
                  <div><label className="block text-xs mb-1">Dãn dòng: {(lineHeight * 100).toFixed(0)}%</label><input type="range" min="1.2" max="2.5" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Rest of the component remains the same */}
      <div ref={contentRef} className="flex-grow overflow-y-auto">
        <main ref={mainContentAreaRef} className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8">
          <div className={`chapter-content no-select-parent prose-lg max-w-none ${theme === 'den' ? 'prose-invert text-gray-300' : ''} ${theme === 'trang' ? 'text-gray-900' : ''} ${theme === 'xam-nhat' ? 'text-gray-800' : ''}`} style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
            {loadingContent && <div className="text-center py-10">Đang tải nội dung chương...</div>}
            {!loadingContent && currentChapterContent && processedChapterContent && canvasContainerWidth > 0 ? (
              processedChapterContent.map((element, index) => {
                const uniqueKey = `content-part-${chapterId}-${index}-${element.type}`;
                if (element.type === 'html') {
                  return <div key={uniqueKey} dangerouslySetInnerHTML={{ __html: element.content }} />;
                } else if (element.type === 'canvas') {

                  return <CanvasTextRenderer key={uniqueKey} text={element.text} fontSize={fontSize + 5} fontFamily={fontFamily} lineHeightFactor={lineHeight} theme={theme} containerWidth={canvasContainerWidth} />;
                }
                return null;
              })
            ) : (
              !loadingContent && currentChapterContent && (<div dangerouslySetInnerHTML={{ __html: currentChapterContent.contentChapter?.replace(/\n/g, '<br />') || 'Nội dung chương đang được xử lý...' }} />)
            )}
            {!loadingContent && !currentChapterContent && <div className="text-center py-10">Nội dung chương đang được cập nhật...</div>}
          </div>
        </main>
        {chapterId && currentNovel && currentChapterContent && (
          <div className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8">
            <ChapterComments chapterId={chapterId} novelId={novelId} />
          </div>
        )}
      </div>

      {/* Nút Toggle Audio Player - Luôn hiển thị khi có audio */}
      {/* {(currentChapterContent?.urlAudio || urlAudio) && (
        <button
          onClick={toggleAudioPlayer}
          className={`fixed right-4 w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl flex items-center justify-center
            ${showAudioPlayer 
              ? (theme === 'den' 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                ) 
              : (theme === 'den' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                )
            }`}
          style={{ 
            bottom: showAudioPlayer ? '80px' : '20px',
            zIndex: 60, // Cao hơn header và navbar
            transition: 'bottom 0.3s ease-in-out, background-color 0.2s, transform 0.2s'
          }}
          title={showAudioPlayer ? 'Ẩn trình phát âm thanh' : 'Hiện trình phát âm thanh'}
        >
          {showAudioPlayer ? (
            <FaVolumeUp className="text-lg" />
          ) : (
            <FaVolumeMute className="text-lg" />
          )}
        </button>
      )} */}

      {/* Audio Player với animation slide - Chỉ render khi có audio */}
      {(currentChapterContent?.urlAudio || urlAudio) && (
        <div 
          className={`fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-in-out ${
            showAudioPlayer ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ zIndex: 55 }} // Cao hơn header nhưng thấp hơn nút toggle
        >
          <AudioPlayer 
            audioSrc={optimizeCloudinaryAudioUrl(currentChapterContent?.urlAudio || urlAudio)} 
            onPrevChapter={handlePrevChapter} 
            onNextChapter={handleNextChapter} 
            isFirstChapter={isFirstChapter} 
            isLastChapter={isLastChapter} 
            novel={currentNovel}  // Đảm bảo truyền novel thay vì novelTitle
            coverImage={optimizeCloudinaryImageUrl(currentNovel?.imageNovel)}
            onProgressUpdate={handleAudioProgressUpdate}
            initialTime={savedAudioPosition}
          />
        </div>
      )}

      {/* Padding bottom để tránh che nội dung khi audio player hiện */}
      <div 
        className={`transition-all duration-300 ${
          showAudioPlayer && (currentChapterContent?.urlAudio || urlAudio) ? 'h-[62px]' : 'h-0'
        }`}
      ></div>
    </div>
  );
};

export default ReadingPage;