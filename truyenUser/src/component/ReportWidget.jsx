import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ReportWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [isClicked, setIsClicked] = useState(false);

  const handleReportClick = () => {
    setIsClicked(true);
    
    // Reset animation state sau 1 giây
    setTimeout(() => setIsClicked(false), 1000);
    
    // Nếu đã ở trang support, chỉ cuộn đến form
    if (location.pathname === '/user/support') {
      scrollToSupportForm();
    } else {
      // Điều hướng đến trang support và sau đó cuộn đến form
      navigate('/user/support');
      // Delay để đảm bảo trang đã render xong
      setTimeout(() => {
        scrollToSupportForm();
      }, 300);
    }
  };

  const scrollToSupportForm = () => {
    // Tìm element có id hoặc class của form support
    const supportForm = document.getElementById('support-form') || 
                      document.querySelector('.support-form') ||
                      document.querySelector('[data-section="support-form"]');
    
    if (supportForm) {
      // Cuộn mượt đến form với offset để tránh bị che bởi header
      const yOffset = -120; // Offset 120px từ top
      const y = supportForm.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
      
      // Highlight form với animation
      supportForm.style.transition = 'all 0.5s ease';
      supportForm.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
      supportForm.style.transform = 'scale(1.02)';
      supportForm.style.borderColor = '#ef4444';
      
      // Remove highlight sau 3 giây
      setTimeout(() => {
        supportForm.style.boxShadow = '';
        supportForm.style.transform = '';
        supportForm.style.borderColor = '';
      }, 3000);
    } else {
      // Fallback: cuộn đến giữa trang
      window.scrollTo({
        top: window.innerHeight * 0.6,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Tooltip */}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
      }`}>
        Báo cáo vấn đề
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
      
      <button
        onClick={handleReportClick}
        className={`p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl group ${
          isClicked 
            ? 'scale-95 animate-pulse' 
            : 'animate-bounce hover:animate-none'
        } ${
          isDarkMode 
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
        }`}
        aria-label="Báo cáo vấn đề"
        title="Báo cáo vấn đề hoặc gửi phản hồi"
      >
        {isClicked ? (
          <CheckCircle size={24} className="animate-spin" />
        ) : (
          <AlertTriangle size={24} className="group-hover:animate-pulse" />
        )}
      </button>
    </div>
  );
};

export default ReportWidget;
