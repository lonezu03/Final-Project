import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Thêm hook Redux
import { logout } from '../../redux/userSlice'; // Import action logout
import { FaUserCircle } from 'react-icons/fa';
import { 
    ChevronLeft, DollarSign, LogOut, Bell, MessageSquare, Menu, BookOpen, 
    Repeat, Settings, UserCheck, HelpCircle, LogIn 
} from 'lucide-react';

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy currentUser từ Redux store
  const { currentUser } = useSelector((state) => state.user);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Hàm điều hướng chung, giúp đóng sidebar
  const handleNavigate = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    dispatch(logout());
    setIsSidebarOpen(false);
    navigate('/'); // Điều hướng về trang chủ sau khi đăng xuất
  };

  return (
    <>
      <button onClick={toggleSidebar} className="fixed top-4 right-4 p-3 bg-gray-700 text-white rounded-full shadow-lg z-30 hover:bg-gray-600 transition-colors" aria-label="Mở menu">
        <Menu size={24} />
      </button>

      {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black bg-opacity-50 z-30" aria-hidden="true"></div>}

      <div className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-900 shadow-xl transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0 w-80' : 'translate-x-full'} overflow-y-auto`}>
        {isSidebarOpen && (
          <div className="p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 min-w-0">
                {currentUser?.avatarUser ? (
                  <img src={currentUser.avatarUser} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <FaUserCircle className="text-3xl text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  {currentUser ? (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[150px]">
                      {currentUser.userNameUser || currentUser.emailUser}
                    </p>
                  ) : (
                    <button onClick={() => handleNavigate('/login')} className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                      Đăng nhập / Đăng ký
                    </button>
                  )}
                </div>
              </div>
              <button onClick={toggleSidebar} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Đóng menu">
                <ChevronLeft size={24} />
              </button>
            </div>

            {/* Các mục menu chính */}
            <nav className="flex-grow space-y-1">
              {currentUser && (
                <>
                  <button onClick={() => handleNavigate('/deposit')} className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center text-lg font-semibold mb-4 dark:bg-orange-600 dark:hover:bg-orange-700">
                    <DollarSign size={20} className="mr-2" /> Nạp
                  </button>
                  {/* ... Các nút khác cho user đã đăng nhập */}
                  <button onClick={() => handleNavigate('/user/reading-history')} className="w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors flex items-center">
                    <BookOpen size={16} className="mr-2 text-gray-500 dark:text-gray-400" /> Lịch sử đọc truyện
                  </button>
                  <button onClick={() => handleNavigate('/user/profile')} className="w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors flex items-center">
                    <Settings size={16} className="mr-2 text-gray-500 dark:text-gray-400" /> Cài đặt cá nhân
                  </button>
                </>
              )}
              
              <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 mb-1">Khám phá</h3>
                {/* ... Các nút khám phá ... */}
              </div>
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-slate-700">
              {currentUser ? (
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-red-500 dark:text-red-400 transition-colors flex items-center">
                    <LogOut size={18} className="mr-2" /> Đăng xuất
                </button>
              ) : (
                 <button onClick={() => handleNavigate('/login')} className="w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 transition-colors flex items-center">
                    <LogIn size={18} className="mr-2" /> Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default Sidebar;