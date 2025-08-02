import React, { useEffect, useState,useRef  } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from "react-redux";

import store from "./redux/store";

import { loadAndRefreshUser } from './redux/userSlice';
import { getAllCategories } from './redux/categorySlice';
import { getAllAuthors } from './redux/authorSlice';
import NotificationWebSocket from './redux/NotificationWebSocket'; // Import NotificationWebSocket
import 'react-toastify/dist/ReactToastify.css'; // Đảm bảo bạn import CSS của react-toastify
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider

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
import DiscoverPage from './component/page/DiscoverPage'; // Thêm trang Discovery
import PaymentCallbackPage from './component/PaymentCallbackPage'; // Import component mới
import SupportPage from './component/page/SupportPage'; // Trang hỗ trợ khách hàng
import AboutUs from './component/page/AboutUs'; // Trang giới thiệu về công ty
import NovelChatBot from './component/NovelChatBot'; // Import chatbot trợ lý truyện

// AppContent bây giờ chỉ chịu trách nhiệm routing và layout
const AppContent = () => {
  const [notifications, setNotifications] = useState([]);

  // Xử lý khi nhận thông báo từ WebSocket
  const handleNotificationMessage = (message) => {
    setNotifications((prevNotifications) => [...prevNotifications, message]);
  };

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
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/novel/:novelId" element={<DetailPage />} />
        <Route path="/novel/:novelId/chapter/:chapterId" element={<ReadingPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/user/reading-history" element={<ReadingHistoryPage />} />
        <Route path="/user/transaction-history" element={<TransactionHistoryPage />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/user/profile" element={<UserProfilePage />} />
        <Route path="/user/my-bookshelf" element={<LibraryPage />} />
        <Route path="/user/support" element={<SupportPage />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/payment/callback-success" element={<PaymentCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Chatbot trợ lý truyện */}
      <NovelChatBot />
    </Router>
  );
};

// Component App gốc chịu trách nhiệm cung cấp store và tải phiên đăng nhập
function App() {
  // SỬ DỤNG useRef ĐỂ TẠO CỜ (FLAG)
  // useRef sẽ giữ nguyên giá trị của nó qua các lần re-render
  const hasFetched = useRef(false);
  const hasFetchedStaticData = useRef(false);

  useEffect(() => {
    // Chỉ dispatch action nếu cờ là false
    if (!hasFetched.current) {
      console.log("Dispatching loadAndRefreshUser for the first time.");
      store.dispatch(loadAndRefreshUser());
      
      // Sau khi dispatch, đặt cờ thành true để không bao giờ chạy lại nữa
      hasFetched.current = true;
    }
  }, []);

  // Tối ưu: Load authors và categories 1 lần duy nhất trong App để tránh spam API
  useEffect(() => {
    if (!hasFetchedStaticData.current) {
      console.log("🔄 [App] Loading static data (authors & categories) once...");
      
      // Clear localStorage để force fetch
      localStorage.clear();
      sessionStorage.clear();
      
      // Load categories và authors song song để tối ưu thời gian
      Promise.allSettled([
        store.dispatch(getAllCategories()).unwrap(),
        store.dispatch(getAllAuthors()).unwrap()
      ]).then((results) => {
        const [categoriesResult, authorsResult] = results;
        
        if (categoriesResult.status === 'fulfilled') {
          console.log('✅ [App] Categories loaded successfully');
        } else {
          console.error('❌ [App] Failed to load categories:', categoriesResult.reason);
        }
        
        if (authorsResult.status === 'fulfilled') {
          console.log('✅ [App] Authors loaded successfully');
        } else {
          console.error('❌ [App] Failed to load authors:', authorsResult.reason);
        }
      });
      
      hasFetchedStaticData.current = true;
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
        <ToastContainer
          position="top-right"
          autoClose={3000} // Giảm thời gian toast
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick={true}
          rtl={false}
        />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
