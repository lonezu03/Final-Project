// SettingsSidebar.js
import React from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom'; // THÊM: Import useNavigate
import {
  X,
  Gift,
  PenLine,
  Archive,
  ListOrdered,
  LineChart,
  Star,
  Sun,
  Moon,
  KeyRound,
  Coins,
  Wallet,
  UserCircle2,
  BookOpen, // THÊM: Icon cho Lịch sử đọc truyện
  Repeat,   // THÊM: Icon cho Lịch sử giao dịch
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // THÊM: Import useTheme
import ThemeToggle from './ThemeToggle'; // THÊM: Import ThemeToggle

// Dữ liệu cho các mục điều hướng trong sidebar
const sidebarNavItems = [
  // {
  //   label: "Kho truyện",
  //   icon: Archive,
  //   href: "#",
  //   subItems: [
  //     { label: "Truyện mới", href: "#" },
  //     { label: "Truyện full", href: "#" },
  //   ],
  // },
  // {
  //   label: "Xếp hạng",
  //   icon: ListOrdered,
  //   href: "#",
  //   subItems: [
  //     { label: "Xếp hạng lượt đọc", href: "#" },
  //     { label: "Xếp hạng đề cử", href: "#" },
  //     { label: "Xếp hạng tặng thưởng", href: "#" },
  //     { label: "Xếp hạng bình luận", href: "#" },
  //   ],
  // },
  // { label: "Thời gian thực", icon: LineChart, href: "#" },
  // { label: "Đánh giá mới", icon: Star, href: "#" },
];

const SettingsSidebar = ({ isOpen, onClose, username, userLoggedIn = false }) => {
  const navigate = useNavigate(); // THÊM: Sử dụng hook useNavigate
  const { isDarkMode } = useTheme(); // THÊM: Sử dụng theme context
  const dispatch = useDispatch();

  // THÊM: Hàm điều hướng
  const handleNavigate = (path) => {
    navigate(path);
    onClose(); // Đóng sidebar sau khi điều hướng
  };

  // Logout handler
  const handleLogout = () => {
    dispatch(logoutUser());
    onClose();
    navigate('/');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sidebar Content */}
      <div
        className={`fixed top-0 right-0 h-full w-72 sm:w-80 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white border-gray-600' 
            : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-800 border-gray-200'
        } shadow-2xl z-50 transform transition-all duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col border-l`}
      >
        {/* Header with Close Button */}
        <div className={`flex justify-between items-center p-4 border-b ${
          isDarkMode 
            ? 'border-gray-600 bg-gradient-to-r from-slate-800 to-gray-800' 
            : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'
        }`}>
          {userLoggedIn ? (
             <div className="flex items-center">
              <div className={`w-8 h-8 bg-gradient-to-br ${
                isDarkMode 
                  ? 'from-blue-500 to-purple-600' 
                  : 'from-yellow-400 to-orange-500'
              } rounded-full flex items-center justify-center mr-2`}>
                {isDarkMode ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-white" />}
              </div>
              <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Cài đặt</span>
             </div>
          ) : (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-2">
                <UserCircle2 size={20} className="text-white" />
              </div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Tiện ích</h2>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <ThemeToggle size={18} />
            <button 
              onClick={onClose} 
              className={`${
                isDarkMode 
                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
              } p-2 rounded-full transition-all duration-200`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-grow p-4 overflow-y-auto">
          {/* User Profile Section (hiển thị nếu đăng nhập) */}
          {userLoggedIn && (
            <div className={`mb-6 p-4 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
              isDarkMode 
                ? 'border-gray-600 bg-gradient-to-br from-slate-800 to-gray-800' 
                : 'border-gray-200 bg-gradient-to-br from-white to-gray-50'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center min-w-0 flex-1 mr-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <UserCircle2 size={24} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`font-bold block truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {username || "User Name"}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Thành viên
                    </span>
                  </div>
                  <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold animate-pulse flex-shrink-0">0</span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 flex-shrink-0 ${
                    isDarkMode 
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' 
                      : 'bg-red-100 hover:bg-red-200 text-red-600'
                  }`}
                >
                  Thoát
                </button>
              </div>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {/* Menu items with dark mode support */}
                <li
                  onClick={() => handleNavigate('/user/my-bookshelf')}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center transition-all duration-200 group ${
                    isDarkMode 
                      ? 'hover:bg-green-800/30 hover:text-green-300' 
                      : 'hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <Archive size={16} className={`mr-2 group-hover:scale-110 transition-transform ${
                    isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`} />
                  <span>Tủ truyện của tôi</span>
                </li>
                <li
                  onClick={() => handleNavigate('/user/reading-history')}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center transition-all duration-200 group ${
                    isDarkMode 
                      ? 'hover:bg-purple-800/30 hover:text-purple-300' 
                      : 'hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <BookOpen size={16} className={`mr-2 group-hover:scale-110 transition-transform ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  }`} />
                  <span>Lịch sử đọc truyện</span>
                </li>
                <li
                  onClick={() => handleNavigate('/user/transaction-history')}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center transition-all duration-200 group ${
                    isDarkMode 
                      ? 'hover:bg-blue-800/30 hover:text-blue-300' 
                      : 'hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Repeat size={16} className={`mr-2 group-hover:scale-110 transition-transform ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`} />
                  <span>Lịch sử giao dịch</span>
                </li>
                <li
                  onClick={() => handleNavigate('/user/profile')}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center transition-all duration-200 group ${
                    isDarkMode 
                      ? 'hover:bg-indigo-800/30 hover:text-indigo-300' 
                      : 'hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <UserCircle2 size={16} className={`mr-2 group-hover:scale-110 transition-transform ${
                    isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                  }`} />
                  <span>Cài đặt cá nhân</span>
                </li>
                <li
                  onClick={() => handleNavigate('/user/support')}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center transition-all duration-200 group ${
                    isDarkMode 
                      ? 'hover:bg-orange-800/30 hover:text-orange-300' 
                      : 'hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Gift size={16} className={`mr-2 group-hover:scale-110 transition-transform ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                  }`} />
                  <span>Yêu cầu hỗ trợ</span>
                </li>
              </ul>
            </div>
          )}

          {/* Nạp Button - Chỉ hiển thị khi đã đăng nhập */}
          {userLoggedIn ? (
            <button
              onClick={() => handleNavigate('/deposit')}
              className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center text-base mb-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-orange-700 to-red-700 hover:from-orange-800 hover:to-red-800 text-white shadow-orange-500/20' 
                  : 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white'
              }`}
            >
              <Wallet size={20} className="mr-2" />
              Nạp tiền
              <span role="img" aria-label="butterfly" className="ml-2 text-xl animate-bounce">🦋</span>
            </button>
          ) : (
            <div className={`w-full font-medium py-3 px-4 rounded-lg flex items-center justify-center text-base mb-6 cursor-not-allowed ${
              isDarkMode 
                ? 'bg-slate-800 text-gray-400 border border-gray-600' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              <Wallet size={20} className="mr-2" />
              Đăng nhập để nạp tiền
            </div>
          )}

          {/* Navigation Items */}
          <nav>
            <ul className="space-y-1">
              {sidebarNavItems.map((item, index) => (
                <li key={index}>
                  {/* SỬA: Dùng onClick để navigate thay vì href cho các mục cần điều hướng bằng React Router */}
                  <button
                    onClick={() => item.href && item.href !== "#" ? handleNavigate(item.href) : undefined}
                    className={`w-full flex items-center py-3 px-3 rounded-lg transition-all duration-300 group text-left border border-transparent ${
                      isDarkMode 
                        ? 'hover:bg-gradient-to-r hover:from-slate-700 hover:to-gray-700 hover:border-gray-600' 
                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200'
                    }`}
                    // Vô hiệu hóa nếu href là "#" hoặc không có href
                    disabled={!item.href || item.href === "#"}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-slate-700 to-gray-700 group-hover:from-slate-600 group-hover:to-gray-600' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100'
                    }`}>
                      <item.icon size={18} className={`transition-colors ${
                        isDarkMode 
                          ? 'text-gray-300 group-hover:text-blue-400' 
                          : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'text-gray-300 group-hover:text-white' 
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}>{item.label}</span>
                  </button>
                  {item.subItems && (
                    <ul className="pl-7 mt-1 space-y-0.5 text-xs">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                           <button
                            onClick={() => subItem.href && subItem.href !== "#" ? handleNavigate(subItem.href) : undefined}
                            className={`w-full block py-1 px-2 rounded-md transition-colors text-left ${
                              isDarkMode 
                                ? 'hover:bg-slate-700 text-gray-400 hover:text-gray-200' 
                                : 'hover:bg-stone-200 text-gray-500 hover:text-gray-700'
                            }`}
                            disabled={!subItem.href || subItem.href === "#"}
                          >
                            • {subItem.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default SettingsSidebar;