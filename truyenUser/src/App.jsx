import React, { useEffect, useState,useRef  } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from "react-redux";

import store from "./redux/store";

import { getAllNovels, searchNovels, LyberiNovels } from './redux/novelSlice';
import { getAllCategories } from './redux/categorySlice';
import { setUserFromStorage,loadUserFromStorage,loadAndRefreshUser } from './redux/userSlice';
import NotificationWebSocket from './redux/NotificationWebSocket'; // Import NotificationWebSocket
import 'react-toastify/dist/ReactToastify.css'; // Đảm bảo bạn import CSS của react-toastify
import { ToastContainer } from 'react-toastify';

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
import PaymentCallbackPage from './component/PaymentCallbackPage'; // Import component mới

// AppContent bây giờ chỉ chịu trách nhiệm fetch dữ liệu không thay đổi thường xuyên
const AppContent = () => {
  const dispatch = useDispatch();
  const novels = useSelector((state) => state.novels.novels);
  const categories = useSelector((state) => state.categories.categories);
    const initialFetchDone = useRef(false);

  // State để lưu thông báo nhận được từ WebSocket
  const [notifications, setNotifications] = useState([]);
  
  // Lấy thông tin người dùng từ Redux store
  const currentUser = useSelector((state) => state.user.currentUser); 

  // Xử lý khi nhận thông báo từ WebSocket
  const handleNotificationMessage = (message) => {
    // Thêm thông báo vào trạng thái
    setNotifications((prevNotifications) => [...prevNotifications, message]);
  };

 useEffect(() => {
  // Chỉ fetch nếu dữ liệu chưa tồn tại
  if (!novels || novels.length == 0) {
    dispatch(getAllNovels());
  }

  if (!categories || categories.length === 0) {
    // dispatch(getAllCategories());
  }

 if (currentUser?.idUser) {
        //  dispatch(LyberiNovels({ idUser: currentUser.idUser }));
     }

}, [dispatch, novels, categories, currentUser]); 

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
        <Route path="/payment/callback-success" element={<PaymentCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

// Component App gốc chịu trách nhiệm cung cấp store và tải phiên đăng nhập
function App() {
  // SỬ DỤNG useRef ĐỂ TẠO CỜ (FLAG)
  // useRef sẽ giữ nguyên giá trị của nó qua các lần re-render
  const hasFetched = useRef(false);

  useEffect(() => {
    // Chỉ dispatch action nếu cờ là false
    if (!hasFetched.current) {
      console.log("Dispatching loadAndRefreshUser for the first time.");
      // store.dispatch(loadAndRefreshUser());
      
      // Sau khi dispatch, đặt cờ thành true để không bao giờ chạy lại nữa
      hasFetched.current = true;
    }
  }, []);

  return (
    <Provider store={store}>
      <AppContent />
      <ToastContainer
        position="top-right"
        autoClose={3000} // Giảm thời gian toast
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
      />
    </Provider>
  );
}

export default App;
