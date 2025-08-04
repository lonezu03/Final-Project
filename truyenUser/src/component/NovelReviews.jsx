// src/components/NovelReviews.jsx

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaStar, FaUserCircle, FaTrash, FaChevronLeft, FaChevronRight, FaExpand, FaCompress } from 'react-icons/fa';
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

const ReviewItem = ({ review, currentUser, onDelete, isDarkMode }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const reviewRef = useRef(null);

    useEffect(() => {
        // Kiểm tra xem review có quá dài không
        if (reviewRef.current) {
            const element = reviewRef.current;
            setShowExpandButton(element.scrollHeight > element.clientHeight);
        }
    }, [review]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`relative p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
            isDarkMode 
                ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-gray-600 hover:border-gray-500' 
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
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
            <div className="relative">
                <div 
                    ref={reviewRef}
                    className={`space-y-3 text-sm prose prose-sm max-w-none transition-all duration-300 ${
                        isDarkMode 
                            ? 'prose-invert text-gray-300' 
                            : 'prose-gray text-gray-700'
                    } ${!isExpanded ? 'max-h-32 overflow-hidden' : ''}`}
                >
                    {review.reviewMC && <p><strong>Nhân vật chính:</strong> {review.reviewMC}</p>}
                    {review.reviewSC && <p><strong>Nhân vật phụ:</strong> {review.reviewSC}</p>}
                    {review.reviewWorld && <p><strong>Bối cảnh thế giới:</strong> {review.reviewWorld}</p>}
                    {review.reviewPersonal && <p><strong>Cảm nhận cá nhân:</strong> {review.reviewPersonal}</p>}
                </div>
                
                {/* Gradient overlay cho collapsed state */}
                {!isExpanded && showExpandButton && (
                    <div className={`absolute bottom-0 left-0 right-0 h-8 pointer-events-none ${
                        isDarkMode 
                            ? 'bg-gradient-to-t from-slate-800 to-transparent' 
                            : 'bg-gradient-to-t from-white to-transparent'
                    }`}></div>
                )}
            </div>
            
            {/* Expand/Collapse button */}
            {showExpandButton && (
                <div className="mt-3 text-center">
                    <button
                        onClick={toggleExpanded}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isDarkMode 
                                ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-900/20' 
                                : 'text-sky-600 hover:text-sky-500 hover:bg-sky-50'
                        }`}
                    >
                        {isExpanded ? (
                            <>
                                <FaCompress className="mr-1" size={10} />
                                Thu gọn
                            </>
                        ) : (
                            <>
                                <FaExpand className="mr-1" size={10} />
                                Xem thêm
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

// Component Pagination
const Pagination = ({ currentPage, totalPages, onPageChange, isDarkMode }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        
        return pages;
    };

    return (
        <div className="flex items-center justify-center space-x-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                        ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                        : (isDarkMode 
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100')
                }`}
            >
                <FaChevronLeft className="mr-1" size={12} />
                Trước
            </button>
            
            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={page === '...'}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                            ? (isDarkMode 
                                ? 'bg-sky-600 text-white' 
                                : 'bg-sky-500 text-white')
                            : page === '...'
                                ? (isDarkMode ? 'text-gray-600 cursor-default' : 'text-gray-400 cursor-default')
                                : (isDarkMode 
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100')
                    }`}
                >
                    {page}
                </button>
            ))}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                        ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                        : (isDarkMode 
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100')
                }`}
            >
                Sau
                <FaChevronRight className="ml-1" size={12} />
            </button>
        </div>
    );
};

// Component Skeleton Loading cho Reviews
const ReviewSkeleton = ({ isDarkMode }) => (
    <div className={`p-4 rounded-lg border animate-pulse ${
        isDarkMode 
            ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-gray-600' 
            : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
        <div className="flex items-center mb-3">
            <div className={`w-10 h-10 rounded-full mr-3 bg-gradient-to-r ${
                isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
                backgroundSize: '400% 400%',
                animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
            <div className="flex-grow">
                <div className={`h-4 w-32 rounded mb-2 bg-gradient-to-r ${
                    isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                }`} style={{ 
                    backgroundSize: '400% 400%',
                    animation: 'shimmer 2s ease-in-out infinite'
                }}></div>
                <div className={`h-3 w-48 rounded bg-gradient-to-r ${
                    isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
                }`} style={{ 
                    backgroundSize: '400% 400%',
                    animation: 'shimmer 2s ease-in-out infinite'
                }}></div>
            </div>
        </div>
        <div className="space-y-2">
            <div className={`h-4 w-full rounded bg-gradient-to-r ${
                isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
                backgroundSize: '400% 400%',
                animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
            <div className={`h-4 w-5/6 rounded bg-gradient-to-r ${
                isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
                backgroundSize: '400% 400%',
                animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
            <div className={`h-4 w-4/6 rounded bg-gradient-to-r ${
                isDarkMode ? 'from-gray-700 via-gray-600 to-gray-700' : 'from-gray-300 via-gray-200 to-gray-300'
            }`} style={{ 
                backgroundSize: '400% 400%',
                animation: 'shimmer 2s ease-in-out infinite'
            }}></div>
        </div>
        
        {/* CSS Animation */}
        <style jsx>{`
            @keyframes shimmer {
                0% { background-position: -400% 0; }
                100% { background-position: 400% 0; }
            }
        `}</style>
    </div>
);

const NovelReviews = () => {
    const dispatch = useDispatch();
    const { novelId } = useParams();
    const { isDarkMode } = useTheme();
    
    // States cho pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(5); // 5 reviews per page
    
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

    // Pagination calculations
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll to top of reviews section
        setTimeout(() => {
            const reviewsSection = document.querySelector('[data-reviews-section]');
            if (reviewsSection) {
                reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleDeleteReview = async (idUser, idNovel) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            try {
                await dispatch(deleteReview({ idUser, idNovel })).unwrap();
                toast.success('Xóa đánh giá thành công!');
                
                // Điều chỉnh currentPage nếu cần thiết
                const newTotalReviews = reviews.length - 1;
                const newTotalPages = Math.ceil(newTotalReviews / reviewsPerPage);
                
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                }
                
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

    // Reset currentPage when reviews change (new reviews loaded)
    useEffect(() => {
        if (reviews.length > 0 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [reviews.length, currentPage, totalPages]);

    if (loadingReviews) {
        return (
            <div className="mt-10" data-reviews-section>
                <h2 className={`text-xl font-semibold mb-4 border-l-4 pl-3 ${
                    isDarkMode 
                        ? 'border-sky-400 text-white' 
                        : 'border-sky-500 text-gray-800'
                }`}>
                    Đánh giá từ độc giả
                </h2>
                <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                        <ReviewSkeleton key={index} isDarkMode={isDarkMode} />
                    ))}
                </div>
            </div>
        );
    }

    if (errorReviews) {
        return (
            <div className="mt-10" data-reviews-section>
                <h2 className={`text-xl font-semibold mb-4 border-l-4 pl-3 ${
                    isDarkMode 
                        ? 'border-sky-400 text-white' 
                        : 'border-sky-500 text-gray-800'
                }`}>
                    Đánh giá từ độc giả
                </h2>
                <p className="text-center text-red-500 py-8">Lỗi khi tải đánh giá: {errorReviews}</p>
            </div>
        );
    }

    return (
        <div className="mt-10" data-reviews-section>
            <h2 className={`text-xl font-semibold mb-4 border-l-4 pl-3 ${
                isDarkMode 
                    ? 'border-sky-400 text-white' 
                    : 'border-sky-500 text-gray-800'
            }`}>
                Đánh giá từ độc giả ({reviews.length})
                {totalPages > 1 && (
                    <span className={`text-sm font-normal ml-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        - Trang {currentPage}/{totalPages}
                    </span>
                )}
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
                <>
                    <div className="space-y-4">
                        {currentReviews.map((review, index) => (
                            <ReviewItem 
                                key={review.id ? `${review.id.idUser}-${review.id.idNovel}` : index} 
                                review={review} 
                                currentUser={currentUser}
                                onDelete={handleDeleteReview}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isDarkMode={isDarkMode}
                    />
                </>
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