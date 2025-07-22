// src/pages/LibraryPage.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookX, Trash2, BookHeart, ShoppingCart } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Footer from "../Footer"; // Điều chỉnh đường dẫn

// Import action và selector cần thiết
import { LyberiNovels } from '../../redux/novelSlice';
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
        novels: allNovels,
        loading, 
        error 
    } = useSelector((state) => state.novels);

    useEffect(() => {
        if (!currentUser) {
            toast.info("Vui lòng đăng nhập để xem thư viện.");
            navigate('/login');
            return;
        }
        // Luôn tải lại danh sách truyện theo dõi khi vào trang
        dispatch(LyberiNovels({ idUser: currentUser.idUser }));
    }, [dispatch, currentUser, navigate]);

    // =====================================================================
    // LOGIC CHO TAB "TRUYỆN ĐÃ MUA" (KHÔNG THAY ĐỔI)
    // =====================================================================
    const purchasedItems = useMemo(() => {
        // Điều kiện guard, chỉ tính toán khi cần
        if (activeTab !== 'purchased' || !currentUser?.chapterBought || allNovels.length === 0) {
            return [];
        }

        const purchasedChapterIds = new Set(currentUser.chapterBought);
        const groups = new Map();
        console.log(allNovels)
        // Lặp qua tất cả truyện đã được fetch
        allNovels.forEach(novel => {
            if (novel.chapters && novel.chapters.length > 0) {
                // Lọc ra các chương đã mua trong truyện này
                const boughtChaptersInNovel = novel.chapters.filter(chapter => 
                    purchasedChapterIds.has(chapter.idChapter)
                );

                if (boughtChaptersInNovel.length > 0) {
                    groups.set(novel.idNovel, {
                        novelId: novel.idNovel,
                        novelTitle: novel.nameNovel,
                        coverImage: novel.imageNovel,
                        chapters: boughtChaptersInNovel.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0)),
                    });
                }
            }
        });

        return Array.from(groups.values());
    }, [currentUser, allNovels, activeTab]);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
                <Loader2 className="animate-spin mr-3" size={32} />
                Đang tải thư viện...
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
    // HÀM RENDER CHO TAB "TRUYỆN ĐÃ MUA"
    // =====================================================================
    const renderPurchasedTab = () => {
        if (purchasedItems.length > 0) {
            return (
                <div className="space-y-8">
                    {purchasedItems.map((novelGroup) => (
                        <div key={novelGroup.novelId}>
                            <div className="flex items-center mb-4">
                                <img 
                                    src={novelGroup.coverImage || "https://via.placeholder.com/48x64.png?text=N"} 
                                    alt={novelGroup.novelTitle} 
                                    className="w-12 h-16 object-cover rounded mr-4"
                                />
                                <h2 className="text-2xl font-semibold text-gray-200 hover:text-sky-400">
                                    <Link to={`/novel/${novelGroup.novelId}`}>{novelGroup.novelTitle}</Link>
                                </h2>
                            </div>
                            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {novelGroup.chapters.map(chapter => (
                                    <li key={chapter.idChapter} className="bg-gray-800 rounded p-3 hover:bg-gray-700 transition-colors">
                                        <Link to={`/novel/${novelGroup.novelId}/chapter/${chapter.idChapter}`} className="text-gray-300 hover:text-white truncate block" title={chapter.titleChapter}>
                                            Chương {chapter.chapterNumber}: {chapter.titleChapter || "Chưa có tiêu đề"}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            );
        }

        // Nếu không có item nào
        return (
             <div className="text-center py-20 bg-gray-800 rounded-lg">
                <BookX size={64} className="mx-auto text-gray-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-300">Chưa mua chương nào</h2>
                <p className="mt-2 text-gray-500">Các chương bạn mua sẽ xuất hiện ở đây.</p>
                <Link to="/" className="mt-6 inline-block bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition-colors">
                    Khám phá truyện mới
                </Link>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 dark text-white p-4 sm:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto flex-grow w-full">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">Thư viện của tôi</h1>
                <div className="flex border-b border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('followed')}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'followed' ? 'border-b-2 border-sky-400 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BookHeart size={16} className="mr-2" />
                        Đang theo dõi ({isEmptyFollowListError ? 0 : followedNovels.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('purchased')}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'purchased' ? 'border-b-2 border-sky-400 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ShoppingCart size={16} className="mr-2" />
                        Đã mua ({[...new Set(currentUser?.chapterBought || [])].length})
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