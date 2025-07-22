// src/components/NovelReviews.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

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

// Hàm helper để format ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const ReviewItem = ({ review }) => (
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
                    <span>{formatDate(review.createdAt)}</span>
                </div>
            </div>
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
    // Lấy dữ liệu reviews từ novelSlice
    const { reviews, loadingReviews, errorReviews } = useSelector((state) => state.novels);

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
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <ReviewItem key={review.idReview} review={review} />
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