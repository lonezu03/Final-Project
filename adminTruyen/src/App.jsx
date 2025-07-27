import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import store from './redux/store';
import RouterSetup from './routes/RouterSetup';
// Chỉ cần import action `refreshUserSession`
import { refreshUserSession } from './redux/userSlice';

/**
 * Component này có nhiệm vụ gọi action khởi tạo MỘT LẦN DUY NHẤT khi ứng dụng tải lần đầu.
 */
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Lấy token trực tiếp từ localStorage để quyết định
    const token = localStorage.getItem('authToken');
    
    // Nếu có token, thì mới dispatch action để làm mới phiên.
    // Nếu không, không làm gì cả.
    if (token) {
      dispatch(refreshUserSession());
    }

    // Mảng dependency rỗng `[]` đảm bảo useEffect này CHỈ CHẠY 1 LẦN
    // sau khi component được mount lần đầu tiên.
  }, [dispatch]);

  return children; // Render RouterSetup
};

function App() {
  return (
    <Provider store={store}>
      <AppInitializer>
        <RouterSetup />
      </AppInitializer>
    </Provider>
  );
}

export default App;