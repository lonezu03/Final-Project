import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Thêm import
import { useTheme } from "../context/ThemeContext"; // Import useTheme
// Import các icon từ lucide-react
import {
  Info,
  Compass,
  LifeBuoy,
  Search,
  Trophy,
  PenSquare, // Hoặc UploadCloud
  CreditCard,
  BookOpen,
  Wrench,
  MessageSquare,
  Users,
  Facebook,
  Send, // Tương tự TelegramPlane
  Mail
} from "lucide-react";

const Footer = () => {
  const { isDarkMode } = useTheme(); // Sử dụng theme context
  const navigate = useNavigate(); // Thêm navigate hook
  
  // Hàm cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <footer className={`text-sm ${
      isDarkMode 
        ? 'bg-slate-900 text-gray-400' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Giới thiệu */}
        <div>
          <h3 className={`font-semibold mb-4 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <Info size={22} className={`mr-2 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} /> Giới Thiệu
          </h3>
          <p className="mb-4">
            Đọc truyện online, truyện full, truyện hay được đóng góp bởi cộng đồng thành viên, tác giả .
            Web luôn cập nhật những bộ truyện mới thuộc các thể loại ngôn tình, tiên hiệp, truyện dịch...
          </p>
          <p>
            Tất cả nội dung tuân thủ luật pháp và bị xóa nếu vi phạm. Bản quyền thuộc về tác giả gốc.
          </p>
        </div>

        {/* Điều hướng */}
        <div>
          <h3 className={`font-semibold mb-4 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <Compass size={22} className={`mr-2 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} /> Điều Hướng
          </h3>
          <ul className="space-y-2">
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={scrollToTop}>
              <Search size={18} className="mr-2" /> Tìm kiếm
            </li>
            {/* <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={scrollToTop}>
              <Trophy size={18} className="mr-2" /> Bảng xếp hạng
            </li> */}
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={() => navigate('/user/reading-history')}>
              <PenSquare size={18} className="mr-2" /> Lịch sử đọc
            </li>
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={() => navigate('/user/my-bookshelf')}>
              <BookOpen size={18} className="mr-2" /> Tủ truyện
            </li>
            
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={() => navigate('/deposit')}>
              <CreditCard size={18} className="mr-2" /> Nạp tiền
            </li>
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={() => navigate('/user/profile')}>
              <Users size={18} className="mr-2" /> Cài đặt cá nhân
            </li>
          </ul>
          <div className="flex space-x-3 mt-6">
            {/* Thay thế bằng ảnh thật hoặc component SVG nếu có */}
            <a href="#" aria-label="Google Play">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" alt="Google Play" className="h-10"/>
            </a>
            <a href="#" aria-label="App Store">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" alt="App Store" className="h-10"/>
            </a>
          </div>
        </div>

        {/* Hỗ trợ */}
        <div>
          <h3 className={`font-semibold mb-4 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <LifeBuoy size={22} className={`mr-2 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} /> Hỗ Trợ
          </h3>
          <ul className="space-y-2">
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={scrollToTop}>
              <BookOpen size={18} className="mr-2" /> Hướng dẫn
            </li>
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={scrollToTop}>
              <Wrench size={18} className="mr-2" /> Các lỗi thường gặp
            </li>
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={scrollToTop}>
              <MessageSquare size={18} className="mr-2" /> Chat với chúng tôi
            </li>
            <li className={`flex items-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:text-white' 
                : 'hover:text-gray-800'
            }`} onClick={scrollToTop}>
              <Users size={18} className="mr-2" /> Nhóm thảo luận
            </li>
          </ul>
        </div>
      </div>

      {/* Đường viền + bản quyền */}
      <div className={`border-t mt-8 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <div className="container mx-auto p-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            2025 © truyenhdt.com All right services
            <a
              href="#" // Link tới trang DMCA
              target="_blank"
              rel="noopener noreferrer"
              className={`ml-2 inline-block px-2 py-1 rounded text-xs transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              DMCA PROTECTED
            </a>
          </div>

          {/* Link nhỏ và icon mạng xã hội */}
          <div className="flex flex-col md:flex-row items-center">
            <div className={`flex space-x-2 text-xs mb-3 md:mb-0 md:mr-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <a href="about-us" className={`transition-colors ${
                isDarkMode ? 'hover:text-white' : 'hover:text-gray-800'
              }`}>About</a>
              <span className="select-none">-</span>
              <a href="#" className={`transition-colors ${
                isDarkMode ? 'hover:text-white' : 'hover:text-gray-800'
              }`}>Privacy Policy</a>
              <span className="select-none">-</span>
              <a href="#" className={`transition-colors ${
                isDarkMode ? 'hover:text-white' : 'hover:text-gray-800'
              }`}>TOS</a>
            </div>
            <div className="flex space-x-4 text-xl">
              <a href="#" aria-label="Telegram" className={`transition-colors ${
                isDarkMode ? 'hover:text-white' : 'hover:text-gray-800'
              }`}><Send size={24} /></a>
              <a href="#" aria-label="Facebook" className={`transition-colors ${
                isDarkMode ? 'hover:text-white' : 'hover:text-gray-800'
              }`}><Facebook size={24} /></a>
              <a href="#" aria-label="Email" className={`transition-colors ${
                isDarkMode ? 'hover:text-white' : 'hover:text-gray-800'
              }`}><Mail size={24} /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;