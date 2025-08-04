// src/components/ReviewDialog.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReviewNovel } from '../redux/userSlice';
import { getAllReviews } from '../redux/novelSlice';
import { FaStar, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';

const StarRating = ({ rating, setRating, isDarkMode }) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => {}} // Có thể thêm hiệu ứng hover nếu muốn
            onMouseLeave={() => {}}
          >
            <FaStar
              className="cursor-pointer transition-colors"
              color={ratingValue <= rating ? "#ffc107" : (isDarkMode ? "#4b5563" : "#e4e5e9")}
              size={30}
            />
          </button>
        );
      })}
    </div>
  );
};

const ReviewDialog = ({ novelId, novelTitle, onClose }) => {
  const dispatch = useDispatch();
  const { currentUser, loading } = useSelector(state => state.user);
  const { isDarkMode } = useTheme();

  const [rating, setRating] = useState(0);
  const [reviewMC, setReviewMC] = useState('');
  const [reviewSC, setReviewSC] = useState('');
  const [reviewWorld, setReviewWorld] = useState('');
  const [reviewPersonal, setReviewPersonal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng cho ít nhất 1 sao!");
      return;
    }
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đánh giá.");
      return;
    }

    // Ràng buộc độ dài các trường review không quá 500 ký tự
    if (
      reviewMC.length > 500 ||
      reviewSC.length > 500 ||
      reviewWorld.length > 500 ||
      reviewPersonal.length > 500
    ) {
      toast.error("Mỗi trường đánh giá không được vượt quá 500 ký tự.");
      return;
    }

    const payload = {
      idUser: currentUser.idUser,
      idNovel: novelId,
      rating,
      reviewMC,
      reviewSC,
      reviewWorld,
      reviewPersonal
    };
    
    dispatch(createReviewNovel(payload))
      .unwrap()
      .then(() => {
        toast.success("Cảm ơn bạn đã gửi đánh giá!");
        // Reload reviews để cập nhật giao diện
        dispatch(getAllReviews(novelId));
        onClose();
      })
      .catch((error) => {
        toast.error(`Gửi đánh giá thất bại: ${error}`);
      });
  };

  const renderTextArea = (label, value, setValue, placeholder) => (
    <div>
      <label className={`block text-sm font-medium mb-1 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full p-2 border rounded-md transition-colors focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
          isDarkMode 
            ? 'bg-slate-700 border-slate-600 text-gray-200' 
            : 'bg-white border-gray-300 text-gray-800'
        }`}
        rows="3"
        placeholder={placeholder}
      ></textarea>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 border border-gray-600' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Đánh giá truyện: {novelTitle}</h2>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:bg-slate-700 hover:text-white' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-lg font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Đánh giá chung của bạn?</label>
            <StarRating rating={rating} setRating={setRating} isDarkMode={isDarkMode} />
          </div>

          {renderTextArea("Tính cách nhân vật chính", reviewMC, setReviewMC, "VD: Main thông minh, quyết đoán, có não...")}
          {renderTextArea("Tính cách nhân vật phụ", reviewSC, setReviewSC, "VD: Dàn phụ được xây dựng tốt, có chiều sâu...")}
          {renderTextArea("Bối cảnh thế giới", reviewWorld, setReviewWorld, "VD: Thế giới rộng lớn, hệ thống tu luyện mới lạ...")}
          {renderTextArea("Ý kiến cá nhân", reviewPersonal, setReviewPersonal, "VD: Cốt truyện lôi cuốn, tình tiết bất ngờ, rất đáng đọc!")}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`font-bold py-2 px-6 rounded transition-colors disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'bg-sky-600 hover:bg-sky-700 text-white disabled:bg-sky-800' 
                  : 'bg-sky-500 hover:bg-sky-600 text-white disabled:bg-sky-300'
              }`}
            >
              {loading ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewDialog;