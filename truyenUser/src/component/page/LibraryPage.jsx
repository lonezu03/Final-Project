// src/pages/LibraryPage.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, Trash2, BookHeart, ShoppingCart, Calendar, Coins } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Footer from "../Footer"; // Điều chỉnh đường dẫn

// Import action và selector cần thiết
import { LyberiNovels } from '../../redux/novelSlice';
import { getTransactions } from '../../redux/transactionSlice';
import { followNovel } from '../../redux/userSlice';
import NovelCard from '../NovelCard'; // Điều chỉnh đường dẫn

const LibraryCardWrapper = ({ novel, onUnfollow }) => (
    <div className="relative group">
        <NovelCard novel={novel} />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
                onClick={() => onUnfollow(novel.idNovel)}
                className="p-2 bg-red-600/80 backdrop-blur-sm text-white rounded-full hover:bg-red-700"
                title="Bỏ theo dõi"
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

const LibraryPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('followed');

    const { currentUser } = useSelector((state) => state.user);
    // Lấy dữ liệu từ state.novels như file slice đã định nghĩa
    const { 
        followedNovels, 
        transactions,
        novels: allNovels,
        loading, 
        transactionLoading,
        error,
        transactionError
    } = useSelector((state) => state.novels);

    useEffect(() => {
        if (!currentUser) {
            toast.info("Vui lòng đăng nhập để xem thư viện.");
            navigate('/login');
            return;
        }
        // Luôn tải lại danh sách truyện theo dõi khi vào trang
        dispatch(LyberiNovels({ idUser: currentUser.idUser }));
        // Tải danh sách giao dịch (truyện đã mua)
        dispatch(getTransactions(currentUser.idUser));
    }, [dispatch, currentUser, navigate]);

    // =====================================================================
    // LOGIC CHO TAB "TRUYỆN ĐÃ MUA" - SỬ DỤNG API MỚI
    // =====================================================================
    const purchasedItems = useMemo(() => {
        // Điều kiện guard, chỉ tính toán khi cần
        if (activeTab !== 'purchased' || !transactions || transactions.length === 0) {
            return [];
        }

        const groups = new Map();
        
        // Lặp qua tất cả transactions
        transactions.forEach(transaction => {
            const { chapter } = transaction;
            if (!chapter) return;

            const novelId = chapter.idNovel;
            if (!groups.has(novelId)) {
                groups.set(novelId, {
                    novelId: novelId,
                    novelTitle: chapter.descriptionNovel || 'Truyện không tên',
                    coverImage: chapter.imageNovel,
                    statusNovel: chapter.statusNovel,
                    chapters: []
                });
            }

            // Thêm thông tin giao dịch vào chapter
            const chapterWithTransaction = {
                ...chapter,
                dateBuy: transaction.chapter.dateBuy,
                user: transaction.user // Thông tin user mua (nếu cần)
            };

            groups.get(novelId).chapters.push(chapterWithTransaction);
        });

        // Sắp xếp chapters theo indexChapter
        groups.forEach(group => {
            group.chapters.sort((a, b) => (a.indexChapter || 0) - (b.indexChapter || 0));
        });

        return Array.from(groups.values());
    }, [transactions, activeTab]);

    const handleUnfollow = (idNovel) => {
        if (window.confirm('Bạn có chắc muốn bỏ theo dõi truyện này không?')) {
            if (!currentUser) return;
            dispatch(followNovel({ idUser: currentUser.idUser, idNovel }))
                .unwrap()
                .then(() => {
                    toast.success("Đã bỏ theo dõi thành công.");
                    dispatch(LyberiNovels({ idUser: currentUser.idUser }));
                })
                .catch((err) => {
                    toast.error(`Lỗi: ${err.message || err}`);
                });
        }
    };

    // Format date helper function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    if (loading || (activeTab === 'purchased' && transactionLoading)) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
                <Loader2 className="animate-spin mr-3" size={32} />
                {activeTab === 'purchased' ? 'Đang tải giao dịch...' : 'Đang tải thư viện...'}
            </div>
        );
    }
    
    // Biến này kiểm tra xem lỗi có phải là do chưa theo dõi hay không
    const isEmptyFollowListError = error === 'Bạn chưa theo dõi truyện nào.';

    // =====================================================================
    // HÀM RENDER CHO TAB "THEO DÕI"
    // =====================================================================
    const renderFollowedTab = () => {
        // Trường hợp có lỗi thực sự (không phải lỗi "trống")
        if (error && !isEmptyFollowListError) {
             return (
                <div className="text-center py-20 bg-gray-800 rounded-lg">
                    <BookX size={64} className="mx-auto text-gray-600" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-300">Có lỗi xảy ra</h2>
                    <p className="mt-2 text-red-500">{error}</p>
                </div>
            );
        }

        // Trường hợp có truyện để hiển thị
        if (followedNovels.length > 0 && !isEmptyFollowListError) {
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {followedNovels.map((novel) => (
                        <LibraryCardWrapper key={novel.idNovel} novel={novel} onUnfollow={handleUnfollow} />
                    ))}
                </div>
            );
        }
        
        // Trường hợp không có truyện nào (hoặc có lỗi "trống")
        return (
            <div className="text-center py-20 bg-gray-800 rounded-lg">
                <BookX size={64} className="mx-auto text-gray-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-300">Tủ truyện trống</h2>
                <p className="mt-2 text-gray-500">Bạn chưa theo dõi truyện nào cả.</p>
                <Link to="/" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors">
                    Khám phá truyện mới
                </Link>
            </div>
        );
    };

    // =====================================================================
    // HÀM RENDER CHO TAB "TRUYỆN ĐÃ MUA" - CẬP NHẬT MỚI
    // =====================================================================
    const renderPurchasedTab = () => {
        // Hiển thị lỗi nếu có
        if (transactionError) {
            return (
                <div className="text-center py-20 bg-gray-800 rounded-lg">
                    <BookX size={64} className="mx-auto text-red-600" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-300">Có lỗi xảy ra</h2>
                    <p className="mt-2 text-red-500">{transactionError}</p>
                    <button 
                        onClick={() => dispatch(getTransactions(currentUser.idUser))}
                        className="mt-4 bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            );
        }

        if (purchasedItems.length > 0) {
            return (
                <div className="space-y-8">
                    {purchasedItems.map((novelGroup) => (
                        <div key={novelGroup.novelId} className="bg-gray-800 rounded-lg p-6">
                            {/* Header truyện */}
                            <div className="flex items-center mb-6">
                                <img 
                                    src={novelGroup.coverImage || "https://via.placeholder.com/48x64.png?text=N"} 
                                    alt={novelGroup.novelTitle} 
                                    className="w-12 h-16 object-cover rounded mr-4 shadow-md"
                                />
                                <div className="flex-1">
                                    <h2 className="text-2xl font-semibold text-gray-200 hover:text-sky-400 transition-colors mb-1">
                                        <Link to={`/novel/${novelGroup.novelId}`}>
                                            {novelGroup.novelTitle}
                                        </Link>
                                    </h2>
                                    <div className="flex items-center text-sm text-gray-400">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            novelGroup.statusNovel === 'COMPLETED' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {novelGroup.statusNovel === 'COMPLETED' ? 'Hoàn thành' : 'Đang cập nhật'}
                                        </span>
                                        <span className="ml-4 flex items-center">
                                            <Coins size={14} className="mr-1" />
                                            {novelGroup.chapters.length} chương đã mua
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách chương */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {novelGroup.chapters.map(chapter => (
                                    <div key={chapter.idChapter} 
                                         className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors group">
                                        <Link 
                                            to={`/novel/${novelGroup.novelId}/chapter/${chapter.idChapter}`} 
                                            className="block"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-gray-300 group-hover:text-white font-medium truncate mr-2">
                                                    Chương {chapter.indexChapter}: {chapter.titleChapter || "Chưa có tiêu đề"}
                                                </h3>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Calendar size={12} className="mr-1" />
                                                <span>Mua: {formatDate(chapter.dateBuy)}</span>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Nếu không có item nào
        return (
             <div className="text-center py-20 bg-gray-800 rounded-lg">
                <ShoppingCart size={64} className="mx-auto text-gray-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-300">Chưa mua chương nào</h2>
                <p className="mt-2 text-gray-500">Các chương bạn mua sẽ xuất hiện ở đây.</p>
                <Link to="/" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors">
                    Khám phá truyện mới
                </Link>
            </div>
        );
    };

    // Tính toán số lượng cho tabs
    const purchasedChapterCount = transactions ? transactions.length : 0;

    return (
        <div className="min-h-screen bg-gray-900 dark text-white p-4 sm:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto flex-grow w-full">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">Thư viện của tôi</h1>
                
                <div className="flex border-b border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('followed')}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'followed' 
                                ? 'border-b-2 border-sky-400 text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <BookHeart size={16} className="mr-2" />
                        Đang theo dõi ({isEmptyFollowListError ? 0 : followedNovels.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('purchased')}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'purchased' 
                                ? 'border-b-2 border-sky-400 text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <ShoppingCart size={16} className="mr-2" />
                        Đã mua ({purchasedChapterCount})
                        {transactionLoading && (
                            <Loader2 size={14} className="ml-2 animate-spin" />
                        )}
                    </button>
                </div>
                
                <div>
                    {activeTab === 'followed' ? renderFollowedTab() : renderPurchasedTab()}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default LibraryPage;