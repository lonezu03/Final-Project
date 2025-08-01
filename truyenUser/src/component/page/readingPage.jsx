// src/component/page/readingPage.jsx
import React, { useState, useEffect, useRef, useMemo,useCallback  } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getNovelById } from '../../redux/novelSlice';
import {
  getAllChapters,
  getNovelChaptersList, 
  getChapterContentById,
  clearChapterState,
  increaseChapterView, 
} from '../../redux/chapterSlice';
import { createHistory, getAllHistoryByUser, refreshUserHistory  } from '../../redux/userSlice';
import apiClient from '../../services/api'; // Đảm bảo đường dẫn này đúng
import { optimizeCloudinaryAudioUrl, optimizeCloudinaryImageUrl } from '../../utils/cloudinaryOptimizer';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCog, FaListUl, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
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
const loadingContent = useSelector((state) => state.chapters.loadingContent);
const errorContent = useSelector((state) => state.chapters.errorContent);
const loadingListForReading = useSelector((state) => state.chapters.loadingDropdownChapters);
const errorListForReading = useSelector((state) => state.chapters.errorDropdownChapters);

// Phần lấy user vẫn giữ nguyên như đã sửa
const currentUser = useSelector((state) => state.user.currentUser); 
const userHistory = useSelector((state) => state.user.userHistory);

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

  const mainContentAreaRef = useRef(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);
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

  const getPositionKey = () => `reading_position_${novelId}_${chapterId}`;

  //luu vị trí đọc audio
  const [audioProgress, setAudioProgress] = useState(0);
  const mainContentRef = useRef(null); // Gắn ref này vào thẻ <main>
 const handleAudioProgressUpdate = useCallback((percentage, currentTimeInSeconds) => {
   setCurrentAudioTime(currentTimeInSeconds);
   currentAudioTimeRef.current = currentTimeInSeconds;
   setAudioProgress(percentage);
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
// useEffect theo doi audio
 useEffect(() => {
    // Thêm flag để tránh vòng lặp vô tận
    let isScrolling = false;
    
    if (mainContentAreaRef.current && audioProgress > 0 && !isScrolling) {
      isScrolling = true;
      const contentHeight = mainContentAreaRef.current.scrollHeight;
      const viewportHeight = window.innerHeight;
      const maxScrollableHeight = contentHeight - viewportHeight;
      
      if (maxScrollableHeight > 0) {
        window.scrollTo({
          top: (audioProgress / 100) * maxScrollableHeight,
          behavior: 'smooth'
        });
      }
      
      setTimeout(() => {
        isScrolling = false;
      }, 100);
    }
  }, [audioProgress]);
 useEffect(() => {
    // Chỉ kiểm tra khi có đầy đủ thông tin cần thiết
    if (currentUser && chapterId && novelId) {
      // Giả sử có truyện miễn phí hoặc chương đầu miễn phí (thêm logic nếu cần)
      // Ví dụ: if (currentNovel.isPaid) { ... }
      
      const isPurchased = currentUser.chapterBought?.includes(chapterId);

      if (!isPurchased) {
        // Nếu chưa mua, không cho phép truy cập
        toast.error("Bạn chưa mua chương này. Vui lòng quay lại để thực hiện thanh toán.");
        // Điều hướng người dùng về trang chi tiết của truyện
        navigate(`/novel/${novelId}`, { replace: true });
      }
    }
  }, [currentUser, chapterId, novelId, navigate, currentNovel]);
  useEffect(() => {
    localStorage.setItem('readingFontSize', fontSize.toString());
    localStorage.setItem('readingLineHeight', lineHeight.toString());
    localStorage.setItem('readingFontFamily', fontFamily);
    localStorage.setItem('readingTheme', theme);
  }, [fontSize, lineHeight, fontFamily, theme]);
  // Effect #1: Tải dữ liệu chính khi vào trang (chạy khi novelId đổi)
// Effect #1: Tải dữ liệu cơ bản của truyện
useEffect(() => {
  if (novelId) {
    console.log("[Effect #1] Tải dữ liệu cơ bản cho novelId:", novelId);
    
    // Kiểm tra xem đã có novel data trong store chưa (có thể từ DetailPage)
    const shouldFetchNovel = !currentNovel || String(currentNovel.idNovel) !== String(novelId);
    
    const promises = [];
    
    if (shouldFetchNovel) {
      console.log("🔄 [ReadingPage] Fetching novel data for:", novelId);
      promises.push(dispatch(getNovelById(novelId)));
    } else {
      console.log("✅ [ReadingPage] Novel data already available in store");
    }
    
    // Luôn load chapters và dropdown
    promises.push(
      dispatch(getAllChapters(novelId)).then(() => {
        // Sau khi getAllChapters hoàn thành, gọi getNovelChaptersList để tạo dropdown
        return dispatch(getNovelChaptersList(novelId));
      })
    );
    
    Promise.all(promises);
  }
  
  return () => {
    dispatch(clearChapterState());
  };
}, [dispatch, novelId, currentNovel]);

// Effect #2: Tải nội dung chương và tăng lượt xem
useEffect(() => {
  let isCurrentRequest = true;

  const loadChapterContent = async () => {
    if (novelId && chapterId) {
      console.log("[Effect #2] Tải nội dung cho chapterId:", chapterId);
      try {
        // Reset states trước khi tải nội dung mới
        if (contentRef.current) contentRef.current.scrollTop = 0;
        setShowContinueDialog(false);
        setSavedScrollPosition(null);
        setProcessedChapterContent(null);

        // Tải nội dung chương
        await dispatch(getChapterContentById({ novelId, chapterId }));

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
      
      try {
        if (isActive) {
          await dispatch(getAllHistoryByUser(currentUser.idUser));
          historyLoadedForUser.current = currentUser.idUser; // Đánh dấu đã tải cho user này
        }
      } catch (error) {
        console.error("[Effect #3] Lỗi khi tải lịch sử:", error);
      }
    }
  };

  loadUserHistory();

  return () => {
    isActive = false;
  };
}, [dispatch, currentUser?.idUser]); // Chỉ phụ thuộc vào user ID

// Effect #4: Hiển thị dialog "ĐỌC TIẾP?" (chạy khi có lịch sử hoặc nội dung chương)
// Sử dụng ref để tránh hiển thị dialog nhiều lần cho cùng một chương
const dialogShownForChapter = useRef(null);

useEffect(() => {
  // Điều kiện tiên quyết: chỉ chạy khi có đủ dữ liệu
  if (loadingContent || !currentChapterContent || !Array.isArray(userHistory) || userHistory.length === 0) {
    setSavedAudioPosition(0); // reset audio về 0 khi vào chương mới
    return;
  }

  // Nếu đã hiển thị dialog cho chương này rồi thì không hiển thị nữa
  if (dialogShownForChapter.current === chapterId) {
    return;
  }

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

  if (chapterHistoryFound && chapterHistoryFound.readPlace > 50) {
    setSavedScrollPosition(chapterHistoryFound.readPlace);
    setShowContinueDialog(true);
    dialogShownForChapter.current = chapterId; // Đánh dấu đã hiển thị dialog cho chương này
    // KHÔNG setSavedAudioPosition ở đây, chỉ set khi ấn Đọc tiếp
  } else {
    setSavedAudioPosition(0); // reset audio về 0 nếu không có lịch sử
  }
}, [userHistory, loadingContent, currentChapterContent, chapterId]);

// Effect set lại scroll position khi dialog được xác nhận
// Khi vào chương mới, luôn scroll về top 0 và reset dialog state
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'auto' });
  // Reset dialog state khi chương thay đổi
  setShowContinueDialog(false);
  setSavedScrollPosition(null);
  dialogShownForChapter.current = null; // Reset flag để có thể hiển thị dialog cho chương mới
}, [chapterId]);

// Khi ấn Đọc tiếp mới scroll tới vị trí đã lưu
useEffect(() => {
  if (showContinueDialog && savedScrollPosition !== null) {
    // Không scroll ở đây nữa, chỉ show dialog
    // (Scroll sẽ thực hiện khi user ấn Đọc tiếp)
  }
}, [showContinueDialog, savedScrollPosition]);
// Effect #5: Theo dõi và LƯU VỊ TRÍ ĐỌC (trước đây là Effect #4)
let vitrilandau = 100;
const lastSavedPosition = useRef(0); // Track vị trí đã lưu gần nhất

useEffect(() => {
  // THAY ĐỔI Ở ĐÂY:
  // Thay vì lắng nghe trên `contentRef.current`, chúng ta sẽ lắng nghe trên `window`.
  // `window` là đối tượng đáng tin cậy nhất cho sự kiện cuộn trang toàn cục.
  const scrollContainer = contentRef.current; // Vẫn giữ ref này để lấy chiều cao nếu cần

  // Điều kiện để gắn listener vẫn giữ nguyên
  if (!scrollContainer || !currentUser || !currentChapterContent?.titleChapter) {
    return;
  }
  
  const handleScroll = () => {
    // --- THÊM LOG DEBUG ---
    const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const divScrollTop = scrollContainer.scrollTop;
    // console.log(`[Scroll Debug] Window ScrollTop: ${windowScrollTop}, Div ScrollTop: ${divScrollTop}`);
    // ----------------------

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      // SỬA Ở ĐÂY: Luôn sử dụng `windowScrollTop` để có giá trị chính xác.
      const readPlace = Math.round(windowScrollTop); 
      
      // Chỉ lưu nếu vị trí thay đổi đáng kể (ít nhất 200px)
      const positionDiff = Math.abs(readPlace - lastSavedPosition.current);
      
      // Giữ nguyên điều kiện > 100 và thêm điều kiện chống spam
      if (readPlace > vitrilandau && chapterId && positionDiff >= 200) {
        // console.log(currentChapterContent)
        const payload = {
          email: currentUser.emailUser,
          // Giờ đây chapterId đã được đảm bảo có giá trị
          idChapter: currentChapterContent.idChapter, // Gửi đi dưới dạng chuỗi là an toàn nhất
          readPlace,
          hearTime: currentAudioTimeRef.current, // Luôn lấy giá trị mới nhất
        };
        console.log(`[Effect #5 - Debounced Save] Dispatching createHistory... Position: ${readPlace}`);
        
        vitrilandau = readPlace + 400; // CẬP NHẬT VỊ TRÍ ĐỌC LẦN ĐẦU
        lastSavedPosition.current = readPlace; // Cập nhật vị trí đã lưu
        
        dispatch(createHistory(payload))
          .unwrap()
          .then(() => {
            // Chỉ refresh history nếu cần thiết (ví dụ: mỗi 5 lần lưu)
            // dispatch(refreshUserHistory()); // Tạm thời comment để giảm spam API
          })
          .catch(error => {
            console.error('Error creating history:', error);
          });
      }
    }, 3000); // Tăng debounce time từ 2s lên 3s
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
}, [dispatch, currentUser, currentChapterContent, novelId, chapterId]);
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

    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để chuyển chương.");
      navigate('/login');
      return;
    }

    const isPurchased = currentUser.chapterBought?.includes(targetChapterId);

    if (isPurchased) {
      // ĐÃ MUA: Cho phép điều hướng
      setProcessedChapterContent(null); // Xóa nội dung cũ để hiển thị loading
      navigate(`/novel/${novelId}/chapter/${targetChapterId}`);
    } else {
      // CHƯA MUA: Báo lỗi và quay về trang chi tiết
      toast.error("Bạn cần mua chương này để đọc. Vui lòng mua trong danh sách chương.");
      navigate(`/novel/${novelId}`); 
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
    // Khi ấn Đọc tiếp, set lại audio về vị trí đã lưu
    if (savedScrollPosition !== null) {
      setTimeout(() => {
        window.scrollTo({
          top: savedScrollPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
    
    // Lấy lại vị trí audio từ lịch sử (nếu có)
    if (savedAudioPosition === 0 && userHistory && Array.isArray(userHistory)) {
      for (const novelGroup of userHistory) {
        if (novelGroup && Array.isArray(novelGroup.historyReadRespones)) {
          const found = novelGroup.historyReadRespones.find(
            (chap) => String(chap.id?.idChapter) === String(chapterId)
          );
          if (found && found.hearTime) {
            setSavedAudioPosition(found.hearTime);
            break;
          }
        }
      }
    }
    
    setShowContinueDialog(false);
    // Đánh dấu rằng dialog đã được xử lý cho chương này
    dialogShownForChapter.current = chapterId;
  };
  const handleCancelContinue = () => {
    setShowContinueDialog(false);
    setSavedScrollPosition(null);
    setSavedAudioPosition(0);
    // Đánh dấu rằng dialog đã được xử lý cho chương này
    dialogShownForChapter.current = chapterId;
    localStorage.removeItem(getPositionKey());
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
    if (currentChapterIndex !== -1 && chaptersForReadingPageDropdown?.[currentChapterIndex]) {
        const chap = chaptersForReadingPageDropdown[currentChapterIndex];
        if (chap.chapterNumber !== null && chap.chapterNumber !== undefined && chap.chapterNumber !== 'N/A' && !isNaN(Number(chap.chapterNumber))) {
            return Number(chap.chapterNumber);
        }
    }
    const contentNum = currentChapterContent?.chapterNumber;
    if (contentNum !== null && contentNum !== undefined && !isNaN(contentNum)) {
        return Number(contentNum);
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
 // nhưng để tránh render một frame nội dung sai, có thể thêm kiểm tra ở đây.
  if (currentUser && !currentUser.chapterBought?.includes(chapterId)) {
    // Mặc dù đã có useEffect điều hướng, điều này ngăn chặn việc render nội dung trong một khoảnh khắc
    return <div className="flex justify-center items-center min-h-screen text-xl">Đang kiểm tra quyền truy cập...</div>;
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
              Chương {currentindexChapter !== null && currentindexChapter !== undefined ? currentindexChapter - 1 : 'N/A'}: {currentChapterContent?.titleChapter || 'Tiêu đề chương'}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button onClick={handlePrevChapter} disabled={isFirstChapter || !prevChapterDetails} className={`px-2 py-1.5 sm:px-3 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
              <FaAngleLeft className="inline mr-1" /> Trước
            </button>
            <div className="relative">
              <button onClick={() => setShowChapterListDropdown(prev => !prev)} className="px-2 py-1.5 sm:px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm w-28 sm:w-32 text-center flex items-center justify-center">
                <FaListUl className="inline mr-1" />  Chương {currentindexChapter !== null && currentindexChapter !== undefined ? currentindexChapter - 1 : '?'}
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

                    return (
                      <button key={chap.idChapter || `chap-dropdown-${index}`} onClick={() => handleChapterSelect(chap.idChapter)} className={`block w-full text-left px-3 py-2 text-sm truncate ${String(chap.idChapter) === String(chapterId) ? `font-bold ${theme === 'den' ? 'text-blue-300 bg-gray-600' : 'text-blue-600 bg-blue-50'}` : `${theme === 'den' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}`} title={fullTitle}>
                        Chương {displayindexChapter}: {chapterTitleText}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={handleNextChapter} disabled={isLastChapter || !nextChapterDetails} className={`px-2 py-1.5 sm:px-3 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
              Sau <FaAngleRight className="inline ml-1" />
            </button>
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
       {showAudioPlayer && (currentChapterContent?.urlAudio || urlAudio) && (
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
)}
      <div className='h-[62px]'></div>
    </div>
  );
};

export default ReadingPage;