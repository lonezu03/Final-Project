// src/components/NovelReviews.jsx

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaStar, FaUserCircle, FaTrash } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { deleteReview } from '../redux/userSlice';
import { getAllReviews } from '../redux/novelSlice';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

// Hàm helper để render sao
const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
        <div className="flex text-yellow-400">
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
            {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className="text-gray-600" />)}
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

const ReviewItem = ({ review, currentUser, onDelete }) => (
    <div className="bg-[#2d3038] p-4 rounded-lg border border-gray-700">
        <div className="flex items-center mb-3">
            {review.avatarUser ? (
                <img src={review.avatarUser} alt={review.userName} className="w-10 h-10 rounded-full mr-3 object-cover" />
            ) : (
                <FaUserCircle size={40} className="mr-3 text-gray-500" />
            )}
            <div className="flex-grow">
                <p className="font-semibold text-sky-400">{review.userName || 'Người dùng ẩn danh'}</p>
                <div className="flex items-center text-xs text-gray-400">
                    {renderStars(review.rating)}
                    <span className="ml-2">({review.rating.toFixed(1)})</span>
                    <span className="mx-2">·</span>
                    <span>{formatDate(review.reviewTime)}</span>
                </div>
            </div>
            {/* Nút xóa - chỉ hiện nếu là review của user hiện tại */}
            {currentUser && review.id.idUser === currentUser.idUser && (
                <button
                    onClick={() => onDelete(review.id.idUser, review.id.idNovel)}
                    className="ml-2 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                    title="Xóa đánh giá"
                >
                    <FaTrash size={14} />
                </button>
            )}
        </div>
        <div className="space-y-3 text-sm text-gray-300 prose prose-sm prose-invert max-w-none">
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
    
    // Lấy dữ liệu reviews từ novelSlice
    const { reviews, loadingReviews, errorReviews } = useSelector((state) => state.novels);
    const { currentUser, loading: userLoading } = useSelector((state) => state.user);

    const handleDeleteReview = async (idUser, idNovel) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            try {
                await dispatch(deleteReview({ idUser, idNovel })).unwrap();
                toast.success('Xóa đánh giá thành công!');
                // Reload reviews để cập nhật giao diện
                dispatch(getAllReviews(novelId));
            } catch (error) {
                toast.error(`Lỗi khi xóa đánh giá: ${error}`);
            }
        }
    };

    if (loadingReviews) {
        return (
            <div className="text-center py-8">
                <Loader2 className="animate-spin inline-block text-sky-400" size={32} />
                <p className="mt-2 text-gray-400">Đang tải đánh giá...</p>
            </div>
        );
    }

    if (errorReviews) {
        return <p className="text-center text-red-500 py-8">Lỗi khi tải đánh giá: {errorReviews}</p>;
    }

    return (
        <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4 border-l-4 border-sky-500 pl-3 text-gray-200">
                Đánh giá từ độc giả ({reviews.length})
            </h2>
            {userLoading && (
                <div className="text-center py-2">
                    <Loader2 className="animate-spin inline-block text-sky-400" size={20} />
                    <span className="ml-2 text-gray-400">Đang xử lý...</span>
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
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-[#2d3038] rounded-lg">
                    <p className="text-gray-500">Chưa có đánh giá nào cho truyện này.</p>
                </div>
            )}
        </div>
    );
};

export default NovelReviews;