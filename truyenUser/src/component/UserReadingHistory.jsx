import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaTimes, FaSortAmountUp, FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Thêm icon chevron
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllHistoryByUser,
  deleteHistory,
  clearUserError,
  clearHistoryActionStatus
} from '../redux/userSlice'; // Sửa đường dẫn nếu cần
import { toast } from 'react-toastify';

// Hàm helper để chuyển mảng thời gian từ API thành đối tượng Date
const convertApiTimeToDate = (timeArray) => {
  if (!Array.isArray(timeArray) || timeArray.length < 6) {
    return null;
  }
  return new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]);
};

// Hàm helper để định dạng "thời gian trước"
const formatTimeAgo = (dateObject) => {
  if (!dateObject || !(dateObject instanceof Date) || isNaN(dateObject.getTime())) {
      return 'Không rõ';
  }
  const now = new Date();
  const seconds = Math.round((now - dateObject) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  
  if (seconds < 5) return 'vừa xong';
  if (seconds < 60) return `${seconds} giây trước`;
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;

  // Hiển thị ngày cụ thể nếu đã hơn 1 ngày
  return dateObject.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const UserReadingHistory = () => {
  const dispatch = useDispatch();
  const {
    currentUser,
    userHistory,
    isUserHistoryLoading,
    historyError,
    historyActionStatus
  } = useSelector((state) => ({
      currentUser: state.user.currentUser,
      userHistory: state.user.userHistory,
      isUserHistoryLoading: state.user.isUserHistoryLoading,
      historyError: state.user.error,
      historyActionStatus: state.user.historyActionStatus
  }));

  const [activeTab, setActiveTab] = useState('dangDoc');
  const [expandedNovelId, setExpandedNovelId] = useState(null);
  const [disableLinks, setDisableLinks] = useState(false); // Thêm trạng thái disable link

  useEffect(() => {
    if (currentUser?.idUser && activeTab === 'dangDoc') {
      dispatch(getAllHistoryByUser(currentUser.idUser));
    }
  }, [dispatch, currentUser, activeTab]);

  useEffect(() => {
    if (historyActionStatus) {
      toast.success(historyActionStatus);
      dispatch(clearHistoryActionStatus());
      if (currentUser?.idUser && activeTab === 'dangDoc') {
        dispatch(getAllHistoryByUser(currentUser.idUser));
      }
    }
    if (historyError) {
      toast.error(`Lỗi: ${historyError}`);
      dispatch(clearUserError());
    }
  }, [historyActionStatus, historyError, dispatch, currentUser, activeTab]);

  const handleToggleExpand = (novelId) => {
    setExpandedNovelId(currentId => (currentId === novelId ? null : novelId));
  };

  const handleRemoveItem = (chapterIdToRemove) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử đọc của truyện này?")) {
      console.log(`Xóa lịch sử đọc truyện với  ID ch: ${chapterIdToRemove}`);
      if (currentUser?.idUser && chapterIdToRemove) {
        dispatch(deleteHistory({ idUser: currentUser.idUser, idChapter: chapterIdToRemove }));
      }
    }
  };

  // Đổi disable link thành true nếu bạn muốn vô hiệu hóa toàn bộ link
  const mappedHistoryItems = Array.isArray(userHistory)
    ? userHistory
      .filter(item => activeTab === 'dangDoc' && Array.isArray(item.historyReadRespones) && item.historyReadRespones.length > 0)
      .map(novelHistoryGroup => {
        const sortedChapters = [...novelHistoryGroup.historyReadRespones].sort((a, b) => {
            const dateA = convertApiTimeToDate(a.readingTime)?.getTime() || 0;
            const dateB = convertApiTimeToDate(b.readingTime)?.getTime() || 0;
            return dateB - dateA;
        });

        const latestChapterRead = sortedChapters[0];
        const novelId = novelHistoryGroup.idNovel || latestChapterRead.idNovel;
        const novelTitle = novelHistoryGroup.nameNovel || 'Tên truyện không xác định';

        return {
          uniqueKey: novelId,
          novelId: novelId,
          novelLink: `/novel/${novelId}`,
          coverImage: latestChapterRead.urlNovel || `https://ui-avatars.com/api/?name=${encodeURIComponent(novelTitle.charAt(0))}&background=random`,
          title: novelTitle,
          latestChapter: {
            id: latestChapterRead.id.idChapter,
            name: latestChapterRead.titleChapter || 'Chương ??',
            link: `/novel/${novelId}/chapter/${latestChapterRead.id.idChapter}`,
            timeFormatted: formatTimeAgo(convertApiTimeToDate(latestChapterRead.readingTime)),
          },
          allChaptersRead: sortedChapters.map(chap => ({
            id: chap.id.idChapter,
            name: chap.titleChapter || 'Chương ??',
            link: `/novel/${novelId}/chapter/${chap.id.idChapter}`,
            timeFormatted: formatTimeAgo(convertApiTimeToDate(chap.readingTime)),
          })),
          lastReadTimeRaw: convertApiTimeToDate(latestChapterRead.readingTime),
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => (b.lastReadTimeRaw?.getTime() || 0) - (a.lastReadTimeRaw?.getTime() || 0))
    : [];

  if (!currentUser) {
    return (
      <div className="container mx-auto my-8 p-6 bg-white dark:bg-slate-800 shadow-xl rounded-lg text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Vui lòng <Link to="/login" className="text-blue-500 hover:underline">đăng nhập</Link> để xem lịch sử đọc truyện.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-xl rounded-lg">
      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('dangDoc')}
          className={`px-4 py-3 text-sm font-medium transition-colors duration-150 ${activeTab === 'dangDoc' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          TRUYỆN ĐANG ĐỌC
        </button>
      </div>

      {isUserHistoryLoading && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Đang tải lịch sử...</p>}

      {!isUserHistoryLoading && activeTab === 'dangDoc' && mappedHistoryItems.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Bạn chưa đọc truyện nào gần đây.</p>}

      {!isUserHistoryLoading && activeTab === 'dangDoc' && mappedHistoryItems.length > 0 && (
        <div className="space-y-4">
          {mappedHistoryItems.map((item) => {
            const isExpanded = expandedNovelId === item.novelId;
            return (
              <div key={item.uniqueKey} className="bg-gray-50 dark:bg-slate-700/50 rounded-md shadow-sm transition-all duration-300">
                <div className="flex items-center p-4">
                  <img src={item.coverImage} alt={item.title} className="w-16 h-24 object-cover rounded" />
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1" title={item.title}>{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Đã đọc đến: <span className="font-medium text-blue-600 dark:text-blue-400">{item.latestChapter.name}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4 flex items-center space-x-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block">{item.latestChapter.timeFormatted}</p>
                    <button onClick={() => handleToggleExpand(item.novelId)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600" title={isExpanded ? "Thu gọn" : "Xem thêm"}>
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    <button onClick={() => handleRemoveItem(item.chapterId)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-red-500" title="Xóa">
                      <FaTimes />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-slate-600">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Lịch sử các chương đã đọc:</h4>
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {item.allChaptersRead.map(chapter => (
                        <li key={chapter.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-300 truncate" title={chapter.name}>
                            {chapter.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-4 whitespace-nowrap">{chapter.timeFormatted}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserReadingHistory;
