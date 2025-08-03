// src/components/NovelReviews.jsx

import React, { useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaStar, FaUserCircle, FaTrash } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { deleteReview } from '../redux/userSlice';
import { getAllReviews } from '../redux/novelSlice';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Hàm helper để render sao
const renderStars = (rating, isDarkMode) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
        <div className="flex text-yellow-400">
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
            {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className={`${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />)}
        </div>
    );
};

// Hàm helper để format ngày từ mảng [year, month, day, hour, minute, second]
const formatDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 5) return '';
    try {
        // [year, month, day, hour, minute, ...]
        const [year, month, day, hour, minute] = dateArray;
        const dateObj = new Date(year, month - 1, day, hour, minute);
        return dateObj.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
};

const ReviewItem = ({ review, currentUser, onDelete, isDarkMode }) => (
    <div className={`p-4 rounded-lg border transition-colors ${
        isDarkMode 
            ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-gray-600' 
            : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
        <div className="flex items-center mb-3">
            {review.avatarUser ? (
                <img src={review.avatarUser} alt={review.userName} className="w-10 h-10 rounded-full mr-3 object-cover" />
            ) : (
                <FaUserCircle size={40} className={`mr-3 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
            )}
            <div className="flex-grow">
                <p className={`font-semibold ${
                    isDarkMode ? 'text-sky-400' : 'text-sky-600'
                }`}>{review.userName || 'Người dùng ẩn danh'}</p>
                <div className={`flex items-center text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                    {renderStars(review.rating, isDarkMode)}
                    <span className="ml-2">({review.rating.toFixed(1)})</span>
                    <span className="mx-2">·</span>
                    <span>{formatDate(review.reviewTime)}</span>
                </div>
            </div>
            {/* Nút xóa - chỉ hiện nếu là review của user hiện tại */}
            {currentUser && review.id.idUser === currentUser.idUser && (
                <button
                    onClick={() => onDelete(review.id.idUser, review.id.idNovel)}
                    className={`ml-2 p-2 rounded-full transition-colors ${
                        isDarkMode 
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title="Xóa đánh giá"
                >
                    <FaTrash size={14} />
                </button>
            )}
        </div>
        <div className={`space-y-3 text-sm prose prose-sm max-w-none ${
            isDarkMode 
                ? 'prose-invert text-gray-300' 
                : 'prose-gray text-gray-700'
        }`}>
            {review.reviewMC && <p><strong>Nhân vật chính:</strong> {review.reviewMC}</p>}
            {review.reviewSC && <p><strong>Nhân vật phụ:</strong> {review.reviewSC}</p>}
            {review.reviewWorld && <p><strong>Bối cảnh thế giới:</strong> {review.reviewWorld}</p>}
            {review.reviewPersonal && <p><strong>Cảm nhận cá nhân:</strong> {review.reviewPersonal}</p>}
        </div>
    </div>
);

const NovelReviews = () => {
    const dispatch = useDispatch();
    const { novelId } = useParams();
    const { isDarkMode } = useTheme();
    
    // Debounce ref để tránh gọi API liên tục
    const refreshTimeoutRef = useRef(null);
    
    // Lấy dữ liệu reviews từ novelSlice
    const { reviews, loadingReviews, errorReviews } = useSelector((state) => state.novels);
    const { currentUser, loading: userLoading } = useSelector((state) => state.user);

    // Debounced refresh function
    const debouncedRefreshReviews = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [NovelReviews] Refreshing reviews after delete');
            dispatch(getAllReviews(novelId));
        }, 1000); // 1 giây delay
    }, [dispatch, novelId]);

    const handleDeleteReview = async (idUser, idNovel) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            try {
                await dispatch(deleteReview({ idUser, idNovel })).unwrap();
                toast.success('Xóa đánh giá thành công!');
                // Sử dụng debounced refresh để tránh spam API
                debouncedRefreshReviews();
            } catch (error) {
                toast.error(`Lỗi khi xóa đánh giá: ${error}`);
            }
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    if (loadingReviews) {
        return (
            <div className="text-center py-8">
                <Loader2 className={`animate-spin inline-block ${
                    isDarkMode ? 'text-sky-400' : 'text-sky-500'
                }`} size={32} />
                <p className={`mt-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Đang tải đánh giá...</p>
            </div>
        );
    }

    if (errorReviews) {
        return <p className="text-center text-red-500 py-8">Lỗi khi tải đánh giá: {errorReviews}</p>;
    }

    return (
        <div className="mt-10">
            <h2 className={`text-xl font-semibold mb-4 border-l-4 pl-3 ${
                isDarkMode 
                    ? 'border-sky-400 text-white' 
                    : 'border-sky-500 text-gray-800'
            }`}>
                Đánh giá từ độc giả ({reviews.length})
            </h2>
            {userLoading && (
                <div className="text-center py-2">
                    <Loader2 className={`animate-spin inline-block ${
                        isDarkMode ? 'text-sky-400' : 'text-sky-500'
                    }`} size={20} />
                    <span className={`ml-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Đang xử lý...</span>
                </div>
            )}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review, index) => (
                        <ReviewItem 
                            key={review.id ? `${review.id.idUser}-${review.id.idNovel}` : index} 
                            review={review} 
                            currentUser={currentUser}
                            onDelete={handleDeleteReview}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </div>
            ) : (
                <div className={`text-center py-8 rounded-lg ${
                    isDarkMode 
                        ? 'bg-gradient-to-br from-slate-800 to-gray-800' 
                        : 'bg-gradient-to-br from-white to-gray-50'
                }`}>
                    <p className={`${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Chưa có đánh giá nào cho truyện này.</p>
                </div>
            )}
        </div>
    );
};

export default NovelReviews;