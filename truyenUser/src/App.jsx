import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from "react-redux";

import store from "./redux/store";

import { getAllNovels, searchNovels } from './redux/novelSlice';
import { getAllCategories } from './redux/categorySlice';
import { loadUserFromStorage } from './redux/userSlice';
import NotificationWebSocket from './redux/NotificationWebSocket'; // Import NotificationWebSocket

// Import các component trang
import ReadingPage from './component/page/readingPage';
import Home from './component/page/home';
import Navbar from './component/Navbar';
import DetailPage from './component/page/DetailPage';
import NotFoundPage from './component/NotFoundPage';
import DepositPage from './component/page/DepositPage';
import ReadingHistoryPage from './component/page/ReadingHistoryPage';
import TransactionHistoryPage from './component/page/TransactionHistoryPage';
import SearchResultsPage from './component/SearchResultsPage';
import UserProfilePage from './component/page/UserProfilePage'; // Đổi tên route để khớp với đây
import LibraryPage from './component/page/LibraryPage'; // Thêm trang Thư viện

// AppContent bây giờ chỉ chịu trách nhiệm fetch dữ liệu không thay đổi thường xuyên
const AppContent = () => {
  const dispatch = useDispatch();
  const novels = useSelector((state) => state.novels.novels);
  const categories = useSelector((state) => state.categories.categories);
  
  // State để lưu thông báo nhận được từ WebSocket
  const [notifications, setNotifications] = useState([]);

  // Xử lý khi nhận thông báo từ WebSocket
  const handleNotificationMessage = (message) => {
    // Thêm thông báo vào trạng thái
    setNotifications((prevNotifications) => [...prevNotifications, message]);
  };

  useEffect(() => {
    // Chỉ fetch nếu dữ liệu chưa tồn tại
    if (!novels || novels.length === 0) {
      dispatch(getAllNovels());
    }
    if (!categories || categories.length === 0) {
      // dispatch(getAllCategories());
    }
  }, [dispatch, novels, categories]);

  return (
    <Router>
      <Navbar />
      {/* <NotificationWebSocket token={localStorage.getItem('authToken')} onMessage={handleNotificationMessage} />  */}
      
      <div>
        {/* Hiển thị các thông báo nhận được */}
        {notifications.length > 0 && (
          <div className="notifications">
            {notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                {notification}
              </div>
            ))}
          </div>
        )}
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novel/:novelId" element={<DetailPage />} />
        <Route path="/novel/:novelId/chapter/:chapterId" element={<ReadingPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/user/reading-history" element={<ReadingHistoryPage />} />
        <Route path="/user/transaction-history" element={<TransactionHistoryPage />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/user/profile" element={<UserProfilePage />} />
        <Route path="/user/my-bookshelf" element={<LibraryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

// Component App gốc chịu trách nhiệm cung cấp store và tải phiên đăng nhập
function App() {
  // useEffect để dispatch loadUserFromStorage một lần duy nhất khi app khởi động
  useEffect(() => {
    store.dispatch(loadUserFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
