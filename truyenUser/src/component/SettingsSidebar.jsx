// SettingsSidebar.js
import React from 'react';
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
  KeyRound,
  Coins,
  Wallet,
  UserCircle2,
  BookOpen, // THÊM: Icon cho Lịch sử đọc truyện
  Repeat,   // THÊM: Icon cho Lịch sử giao dịch
} from 'lucide-react';

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

  // THÊM: Hàm điều hướng
  const handleNavigate = (path) => {
    navigate(path);
    onClose(); // Đóng sidebar sau khi điều hướng
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black z-30 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sidebar Content */}
      <div
        className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-stone-50 text-gray-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Header with Close Button */}
        <div className="flex justify-between items-center p-4 border-b border-stone-200">
          {userLoggedIn ? (
             <div className="flex items-center">
              <Sun size={20} className="mr-2 text-yellow-500" />
             </div>
          ) : (
            <h2 className="text-lg font-semibold">Tiện ích</h2>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-grow p-4 overflow-y-auto">
          {/* User Profile Section (hiển thị nếu đăng nhập) */}
          {userLoggedIn && (
            <div className="mb-5 p-3 border border-stone-300 rounded-md bg-white shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <UserCircle2 size={24} className="mr-2 text-gray-600" />
                  <span className="font-semibold text-sm text-gray-700">{username || "User Name"}</span>
                  <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">0</span>
                </div>
                <button className="text-xs bg-gray-200 hover:bg-gray-300 px-2.5 py-1 rounded text-gray-700">Thoát</button>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li
                  onClick={() => handleNavigate('/user/upgrade-account')} // Ví dụ route
                  className="flex justify-between items-center cursor-pointer hover:bg-stone-100 p-1.5 rounded"
                >
                  <span>Nâng cấp tài khoản</span>
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                </li>
                <li
                  onClick={() => handleNavigate('/user/my-bookshelf')} // Ví dụ route
                  className="cursor-pointer hover:bg-stone-100 p-1.5 rounded flex items-center"
                >
                  Tủ truyện của tôi
                </li>
                {/* THÊM LỊCH SỬ ĐỌC TRUYỆN VÀO ĐÂY */}
                <li
                  onClick={() => handleNavigate('/user/reading-history')}
                  className="cursor-pointer hover:bg-stone-100 p-1.5 rounded flex items-center"
                >
                  <BookOpen size={16} className="mr-2 text-gray-500" /> Lịch sử đọc truyện
                </li>
                <li
                  onClick={() => handleNavigate('/user/transaction-history')}
                  className="cursor-pointer hover:bg-stone-100 p-1.5 rounded flex items-center"
                >
                  <Repeat size={16} className="mr-2 text-gray-500" /> Lịch sử giao dịch
                </li>
                <li
                  onClick={() => handleNavigate('/user/profile')} // Ví dụ route
                  className="cursor-pointer hover:bg-stone-100 p-1.5 rounded flex items-center"
                >
                  Cài đặt cá nhân
                </li>
                <li
                  onClick={() => handleNavigate('/user/support')} // Ví dụ route
                  className="cursor-pointer hover:bg-stone-100 p-1.5 rounded flex items-center"
                >
                  Yêu cầu hỗ trợ
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-stone-200 grid grid-cols-2 gap-x-2 text-xs text-gray-600">
                {/* <div className="flex items-center">
                  <Gift size={16} className="mr-1 text-orange-500" /> 0
                  <span className="ml-auto flex items-center"><KeyRound size={14} className="mr-1 text-gray-400" /> 0</span>
                </div>
                <div className="flex items-center">
                  <Coins size={16} className="mr-1 text-yellow-600" /> 0
                  <span className="ml-auto flex items-center"><Wallet size={14} className="mr-1 text-gray-400" /> 0</span>
                </div> */}
              </div>
            </div>
          )}

          {/* Nạp Button */}
          <button
            onClick={() => handleNavigate('/deposit')} // THÊM: Điều hướng khi nhấn nút Nạp
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-md flex items-center justify-center text-base mb-5 shadow hover:shadow-md transition-all"
          >
            Nạp
            <span role="img" aria-label="butterfly" className="ml-1.5 text-xl">🦋</span>
          </button>

          {/* Navigation Items */}
          <nav>
            <ul className="space-y-1">
              {sidebarNavItems.map((item, index) => (
                <li key={index}>
                  {/* SỬA: Dùng onClick để navigate thay vì href cho các mục cần điều hướng bằng React Router */}
                  <button
                    onClick={() => item.href && item.href !== "#" ? handleNavigate(item.href) : undefined}
                    className="w-full flex items-center py-2 px-2.5 rounded-md hover:bg-stone-200 transition-colors group text-left"
                    // Vô hiệu hóa nếu href là "#" hoặc không có href
                    disabled={!item.href || item.href === "#"}
                  >
                    <item.icon size={18} className="mr-2.5 text-gray-600 group-hover:text-gray-800" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                  </button>
                  {item.subItems && (
                    <ul className="pl-7 mt-1 space-y-0.5 text-xs">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                           <button
                            onClick={() => subItem.href && subItem.href !== "#" ? handleNavigate(subItem.href) : undefined}
                            className="w-full block py-1 px-2 rounded-md hover:bg-stone-200 transition-colors text-gray-500 hover:text-gray-700 text-left"
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