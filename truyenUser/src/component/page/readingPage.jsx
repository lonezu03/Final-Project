import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getNovelById } from '../../redux/novelSlice';
import {
  getNovelChaptersList,
  getChapterContentById,
  clearChapterState
} from '../../redux/chapterSlice';
import { createHistory } from '../../redux/userSlice';

import { FaCog, FaListUl, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import AudioPlayer from '../AudioPlayer';
import ChapterComments from '../ChapterComments';

// Component Dialog để hỏi người dùng
const ContinueReadingDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
    <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-sm text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Đọc tiếp?</h3>
      <p className="text-gray-600 mb-6">Bạn có muốn tiếp tục đọc từ vị trí lần trước không?</p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Bỏ qua
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
        >
          Đọc tiếp
        </button>
      </div>
    </div>
  </div>
);

const ReadingPage = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentNovel, loading: novelLoading, error: novelError } = useSelector((state) => state.novels);
  const {
    currentChapterContent,
    chaptersForReadingPageDropdown,
    loadingContent,
    errorContent,
    loadingListForReading,
    errorListForReading,
  } = useSelector((state) => state.chapters);
  const currentUser = useSelector((state) => state.user?.currentUser || null);

  const [showChapterListDropdown, setShowChapterListDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('readingFontSize') || '20', 10));
  const [lineHeight, setLineHeight] = useState(() => parseFloat(localStorage.getItem('readingLineHeight') || '1.8'));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('readingFontFamily') || 'Tahoma');
  const [theme, setTheme] = useState(() => localStorage.getItem('readingTheme') || 'xam-nhat');
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(null);
  const contentRef = useRef(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);
  const audioTestUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  // BẠN CẦN ĐO CHÍNH XÁC CÁC GIÁ TRỊ NÀY TỪ GIAO DIỆN CỦA MÌNH VÀ CẬP NHẬT
  const NAVBAR_MAIN_HEIGHT_PX = 0; // Ví dụ: chiều cao navbar chính của trang web
  const AUDIO_PLAYER_ACTUAL_HEIGHT_PX = 0; // Ví dụ: chiều cao của AudioPlayer component

  const pagePaddingTop = `${NAVBAR_MAIN_HEIGHT_PX}px`;
  const pagePaddingBottom = showAudioPlayer ? `${AUDIO_PLAYER_ACTUAL_HEIGHT_PX}px` : '0px';
  const readingHeaderStickyTop = `${NAVBAR_MAIN_HEIGHT_PX}px`; // Header đọc truyện dính ngay dưới navbar chính

  const getPositionKey = () => `reading_position_${novelId}_${chapterId}`;

  useEffect(() => {
    localStorage.setItem('readingFontSize', fontSize.toString());
    localStorage.setItem('readingLineHeight', lineHeight.toString());
    localStorage.setItem('readingFontFamily', fontFamily);
    localStorage.setItem('readingTheme', theme);
  }, [fontSize, lineHeight, fontFamily, theme]);

  useEffect(() => {
    if (novelId) {
      dispatch(getNovelById(novelId));
      dispatch(getNovelChaptersList(novelId));
    }
    return () => dispatch(clearChapterState());
  }, [dispatch, novelId]);

  useEffect(() => {
    if (novelId && chapterId) {
      dispatch(getChapterContentById({ novelId, chapterId }));
      setShowChapterListDropdown(false);
      setShowSettings(false);
      if (contentRef.current) contentRef.current.scrollTop = 0;
      localStorage.setItem(`lastRead_${novelId}`, chapterId);
    }
  }, [dispatch, novelId, chapterId]);

  useEffect(() => {
    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;
    let debounceTimer;
    const handleScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (scrollContainer.scrollTop > 100) {
          localStorage.setItem(getPositionKey(), scrollContainer.scrollTop.toString());
        }
      }, 1000);
    };
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(debounceTimer);
    };
  }, [novelId, chapterId]);

  useEffect(() => {
    // Khi chuyển chương, reset lại vị trí cuộn hoặc sử dụng vị trí đã lưu
    if (savedScrollPosition && contentRef.current) {
      setTimeout(() => {
        contentRef.current.scrollTop = savedScrollPosition;
      }, 100);
    } else {
      // Reset scroll về 0 nếu không có vị trí lưu
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  }, [savedScrollPosition, chapterId]);  // Sử dụng `savedScrollPosition` khi chuyển chương

  useEffect(() => {
    if (!loadingContent && currentChapterContent && novelId && chapterId) {
      const key = getPositionKey();
      const positionString = localStorage.getItem(key);

      if (positionString) {
        const scrollPos = parseInt(positionString, 10);

        // Kiểm tra nếu vị trí cuộn hợp lệ và lớn hơn 0
        if (!isNaN(scrollPos) && scrollPos > 0) {
          setSavedScrollPosition(scrollPos);
          setShowContinueDialog(true);  // Hiển thị dialog để người dùng tiếp tục
        } else {
          localStorage.removeItem(key);  // Xóa nếu không có vị trí hợp lệ
        }
      } else {
        // Không có vị trí lưu trữ, không cần thực hiện gì
      }
    }
  }, [loadingContent, currentChapterContent, novelId, chapterId]);

  // useEffect để gửi vị trí đọc khi thoát hoặc chuyển chương
  useEffect(() => {
    const getFinalReadPlace = () => {
      const key = getPositionKey();
      const lastKnownReadPlaceString = localStorage.getItem(key);
      const currentScrollTop = contentRef.current ? contentRef.current.scrollTop : 0;
      const positionFromStorage = lastKnownReadPlaceString ? parseInt(lastKnownReadPlaceString, 10) : 0;

      // Tránh gửi vị trí đọc 0 nếu không có thay đổi
      if (currentScrollTop > 50) {
        return currentScrollTop;
      } else if (positionFromStorage > 0) {
        return positionFromStorage;
      }
      return 0;  // Trả về 0 nếu không có vị trí đọc hợp lệ
    };

    const prepareHistoryPayload = (readPlace) => {
      if (!currentUser || !novelId || !chapterId || !currentChapterContent?.titleChapter || readPlace <= 0) {
        return null;
      }
      return {
        idNovel: novelId,
        email: currentUser.emailUser,
        idChapter: Number(chapterId),
        readPlace: Number(readPlace),
        titleChapter: currentChapterContent.titleChapter || '',
      };
    };

    const savePositionWithDispatch = () => {
      const finalReadPlace = getFinalReadPlace();
      const historyPayload = prepareHistoryPayload(finalReadPlace);
      console.log("Lưu vị trí đọc:", finalReadPlace, "với payload:", historyPayload);
      if (historyPayload) {
        dispatch(createHistory(historyPayload))
          .unwrap()
          .then(() => {
            console.log("Lịch sử đọc đã được gửi (dispatch khi unmount/chuyển chương):", historyPayload);
            localStorage.removeItem(getPositionKey()); // Remove position after sending
          })
          .catch((error) => {
            console.error("Lỗi khi gửi lịch sử đọc (dispatch khi unmount):", error);
          });
      }
    };

    // Gọi savePositionWithDispatch khi người dùng đóng tab hoặc reload trang
    const handleBeforeUnload = (event) => {
      event.preventDefault();  // Prevent the default action for the event
      savePositionWithDispatch();  // Gọi API khi reload hoặc đóng tab
    };

    // Kích hoạt sự kiện khi người dùng rời khỏi trang (reload hoặc đóng tab)
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    // Cleanup các sự kiện khi component bị unmount hoặc trang được đóng
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      savePositionWithDispatch(); // Lưu vị trí khi chuyển chương
    };
  }, [novelId, chapterId, currentUser, dispatch, currentChapterContent]);

  const handleConfirmContinue = () => {
    if (contentRef.current && savedScrollPosition) {
      setTimeout(() => { contentRef.current.scrollTop = savedScrollPosition; }, 100);
    }
    setShowContinueDialog(false);
    localStorage.removeItem(getPositionKey());
  };

  const handleCancelContinue = () => {
    setShowContinueDialog(false);
    localStorage.removeItem(getPositionKey());
  };

  const { currentChapterIndex, prevChapterDetails, nextChapterDetails } = useMemo(() => {
    if (!chaptersForReadingPageDropdown || chaptersForReadingPageDropdown.length === 0) {
      return { currentChapterIndex: -1, prevChapterDetails: null, nextChapterDetails: null };
    }
    const currentIndex = chaptersForReadingPageDropdown.findIndex(chap => chap.idChapter === chapterId);
    if (currentIndex === -1) {
        return { currentChapterIndex: -1, prevChapterDetails: null, nextChapterDetails: null };
    }
    const prev = currentIndex > 0 ? chaptersForReadingPageDropdown[currentIndex - 1] : null;
    const next = currentIndex < chaptersForReadingPageDropdown.length - 1 ? chaptersForReadingPageDropdown[currentIndex + 1] : null;
    return { currentChapterIndex: currentIndex, prevChapterDetails, nextChapterDetails };
  }, [chapterId, chaptersForReadingPageDropdown]);

  const currentChapterNumber = useMemo(() => {
    if (currentChapterIndex !== -1 && chaptersForReadingPageDropdown?.[currentChapterIndex]) {
      return chaptersForReadingPageDropdown[currentChapterIndex].chapterNumber;
    }
    return currentChapterContent?.chapterNumber;
  }, [currentChapterIndex, chaptersForReadingPageDropdown, currentChapterContent]);

  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = !!(chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length > 0 && currentChapterIndex === chaptersForReadingPageDropdown.length - 1);

  const handlePrevChapter = () => {
    if (prevChapterDetails?.idChapter) navigate(`/novel/${novelId}/chapter/${prevChapterDetails.idChapter}`);
  };
  const handleNextChapter = () => {
    if (nextChapterDetails?.idChapter) navigate(`/novel/${novelId}/chapter/${nextChapterDetails.idChapter}`);
  };
  const handleChapterSelect = (selectedChapterId) => {
    if (selectedChapterId !== chapterId) navigate(`/novel/${novelId}/chapter/${selectedChapterId}`);
    setShowChapterListDropdown(false);
  };

  const renderErrorText = (err, type = "Nội dung") => (
    <div className="text-center py-10 text-red-500">
      Lỗi tải {type}: {typeof err === 'string' ? err : (err?.message || 'Đã có lỗi không xác định.')}
    </div>
  );

  // Điều kiện render loading/error
  if (novelLoading && !currentNovel) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải thông tin truyện...</div>;
  if (novelError && !currentNovel) return renderErrorText(novelError, "thông tin truyện");
  if (!currentNovel) {
    if (!novelLoading) return <div className="flex justify-center items-center min-h-screen text-xl">Không tìm thấy thông tin truyện.</div>;
    return <div className="flex justify-center items-center min-h-screen text-xl">Đang chuẩn bị dữ liệu truyện...</div>;
  }
  if (loadingListForReading && (!chaptersForReadingPageDropdown || chaptersForReadingPageDropdown.length === 0)) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải danh sách chương...</div>;
  if (errorListForReading && (!chaptersForReadingPageDropdown || chaptersForReadingPageDropdown.length === 0)) return renderErrorText(errorListForReading, "danh sách chương");
  if (chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length === 0 && !loadingListForReading && !errorListForReading) return <div className="flex justify-center items-center min-h-screen text-xl">Truyện này chưa có chương nào.</div>;
  if (loadingContent && (!currentChapterContent || currentChapterContent.idChapter !== chapterId)) return <div className="flex justify-center items-center min-h-screen text-xl">Đang tải nội dung chương...</div>;
  if (errorContent && (!currentChapterContent || currentChapterContent.idChapter !== chapterId)) return renderErrorText(errorContent, "nội dung chương");
  if (!currentChapterContent) {
    if (chapterId && !loadingContent && !errorContent) return <div className="flex justify-center items-center min-h-screen text-xl">Không tìm thấy nội dung chương này.</div>;
    return <div className="flex justify-center items-center min-h-screen text-xl">Đang chuẩn bị nội dung...</div>;
  }

  const themeClasses = {
    'xam-nhat': 'bg-gray-100 text-gray-800',
    'den': 'bg-gray-900 text-gray-200',
    'trang': 'bg-white text-gray-900',
  };
  const currentThemeClass = themeClasses[theme] || themeClasses['xam-nhat'];

  return (
    <div
      className={`reading-page min-h-screen flex flex-col ${currentThemeClass} transition-colors duration-300`}
      style={{ fontFamily: fontFamily, paddingTop: pagePaddingTop, paddingBottom: pagePaddingBottom }}
    >
      {showContinueDialog && (
        <ContinueReadingDialog
          onConfirm={handleConfirmContinue}
          onCancel={handleCancelContinue}
        />
      )}
      { <div
      className={`reading-page min-h-screen flex flex-col ${currentThemeClass} transition-colors duration-300`}
      style={{ fontFamily: fontFamily, paddingTop: pagePaddingTop, paddingBottom: pagePaddingBottom }}
    >
      {showContinueDialog && (
        <ContinueReadingDialog
          onConfirm={handleConfirmContinue}
          onCancel={handleCancelContinue}
        />
      )}

      <header
        className={`${theme === 'den' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} shadow-md py-3 sticky z-30`}
        style={{ top: readingHeaderStickyTop }}
      >
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-center sm:text-left mb-2 sm:mb-0">
            <h1 className="text-xl md:text-2xl font-semibold truncate max-w-xs md:max-w-md lg:max-w-2xl">
              <Link to={`/novel/${novelId}`} className={`${theme === 'den' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline`}>
                {currentNovel.nameNovel || 'Tên truyện'}
              </Link>
            </h1>
            <p className={`text-sm ${theme === 'den' ? 'text-gray-400' : 'text-gray-600'}`}>
              Chương {currentChapterNumber || 'N/A'}: {currentChapterContent?.titleChapter || 'Tiêu đề chương'}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={handlePrevChapter}
              disabled={isFirstChapter || !prevChapterDetails}
              className={`px-2 py-1.5 sm:px-3 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <FaAngleLeft className="inline mr-1" /> Trước
            </button>
            <div className="relative">
              <button onClick={() => setShowChapterListDropdown(prev => !prev)} className="px-2 py-1.5 sm:px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm w-28 sm:w-32 text-center flex items-center justify-center">
                <FaListUl className="inline mr-1" /> C. {currentChapterNumber || '?'}
                <svg className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform duration-200 ${showChapterListDropdown ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {showChapterListDropdown && chaptersForReadingPageDropdown && chaptersForReadingPageDropdown.length > 0 && (
                <div className={`absolute top-full mt-1 ${theme === 'den' ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} border rounded shadow-lg max-h-60 w-64 sm:w-72 overflow-y-auto z-40`}>
                  {chaptersForReadingPageDropdown.map((chap) => (
                    <button key={chap.idChapter} onClick={() => handleChapterSelect(chap.idChapter)}
                      className={`block w-full text-left px-3 py-2 text-sm truncate ${chap.idChapter === chapterId ? `font-bold ${theme === 'den' ? 'text-blue-300 bg-gray-600' : 'text-blue-600 bg-blue-50'}` : `${theme === 'den' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}`}
                      title={`Chương ${chap.chapterNumber}: ${chap.titleChapter || 'Chưa có tiêu đề'}`}
                    >
                      C. {chap.chapterNumber}: {chap.titleChapter || 'Chưa có tiêu đề'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleNextChapter}
              disabled={isLastChapter || !nextChapterDetails}
              className={`px-2 py-1.5 sm:px-3 ${theme === 'den' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
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

      <div ref={contentRef} className="flex-grow overflow-y-auto">
        <main className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8">
          <div
            // Thêm class "no-select-parent" để CSS có thể áp dụng user-select: none
            className={`chapter-content no-select-parent prose-lg max-w-none ${theme === 'den' ? 'prose-invert text-gray-300' : ''} ${theme === 'trang' ? 'text-gray-900' : ''} ${theme === 'xam-nhat' ? 'text-gray-800' : ''}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            dangerouslySetInnerHTML={{ __html: currentChapterContent?.contentChapter?.replace(/\n/g, '<br />') || 'Nội dung chương đang được cập nhật...' }}
          />
        </main>

        {chapterId && currentNovel && currentChapterContent && (
          <div className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8">
            <ChapterComments
              chapterId={chapterId}
              novelId={novelId}
            />
          </div>
        )}
      </div>

      {showAudioPlayer && (currentChapterContent?.audioUrl || audioTestUrl) && (
        <AudioPlayer
          audioSrc={currentChapterContent?.audioUrl || audioTestUrl}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          isFirstChapter={isFirstChapter}
          isLastChapter={isLastChapter}
          novelTitle={currentNovel?.nameNovel}
          chapterTitle={currentChapterContent?.titleChapter}
          coverImage={currentNovel?.imageNovel}
        />
      )}
    </div>}
    </div>
  );
};

export default ReadingPage;
