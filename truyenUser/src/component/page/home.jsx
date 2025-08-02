import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { getAllNovels, LyberiNovels } from '../../redux/novelSlice';
import { getAllHistoryByUser } from '../../redux/userSlice';
import { getAllTransactions } from '../../redux/transactionSlice'; // Thêm import
import TopStories from '../TopStories';
import Footer from '../Footer';
import Stories from '../Stories';
import StorySlider from '../StorySlider';
import RecommendedStories from '../RecommendedStories';

const Home = () => {
    const { isDarkMode } = useTheme(); // Sử dụng theme context
    const dispatch = useDispatch();
    
    // Selectors với loading states
    const novels = useSelector((state) => state.novels.novels);
    const currentUser = useSelector((state) => state.user.currentUser);
    const novelsLoading = useSelector((state) => state.novels.loading);
    
    // Kiểm tra xem có cần hiển thị loading không - chỉ loading novels
    const isLoadingCriticalData = (novelsLoading && (!novels || novels.length === 0));
    
    // Dùng ref để đảm bảo chỉ fetch 1 lần nếu dữ liệu đã có
    const fetchedNovels = useRef(false);
    const fetchedLibrary = useRef(null); // Track theo userId
    const fetchedHistory = useRef(null); // Track theo userId
    const isInitialMount = useRef(true);
    const retryCount = useRef({ novels: 0, library: 0, history: 0 });
    const MAX_RETRIES = 2;

    // Debug: Force fetch novels để kiểm tra - Loại bỏ mọi điều kiện cache
    useEffect(() => {
        console.log('🔍 [Home] Debug novels state:', {
            novels: novels?.length || 0,
            novelsLoading,
            fetchedNovels: fetchedNovels.current
        });
        
        // Force clear cache và fetch mỗi lần
        localStorage.removeItem('novels_cache_timestamp');
        
        // Simplified logic: Always fetch if no novels data
        if ((!novels || novels.length === 0) && !novelsLoading && !fetchedNovels.current) {
            console.log('🔄 [Home] Force fetching novels - no conditions check...');
            fetchedNovels.current = true;
            dispatch(getAllNovels())
                .unwrap()
                .then((result) => {
                    console.log('✅ [Home] Novels loaded successfully:', result?.length || 'unknown count');
                })
                .catch((error) => {
                    fetchedNovels.current = false;
                    console.error('❌ [Home] Failed to load novels:', error);
                });
        } else {
            console.log('⏸️ [Home] Skipping novels fetch:', {
                hasNovels: novels?.length > 0,
                isLoading: novelsLoading,
                alreadyFetched: fetchedNovels.current
            });
        }
    }, [dispatch, novels, novelsLoading]);

    // Tối ưu: Chỉ fetch library khi user đổi và chưa fetch cho user đó
    useEffect(() => {
        if (currentUser?.idUser) {
            const shouldFetchLibrary = fetchedLibrary.current !== currentUser.idUser;
            
            if (shouldFetchLibrary) {
                console.log('🔄 [Home] Fetching user library for user:', currentUser.idUser);
                fetchedLibrary.current = currentUser.idUser; // Set trước để tránh duplicate calls
                dispatch(LyberiNovels({ idUser: currentUser.idUser }))
                    .unwrap()
                    .then(() => {
                        console.log('✅ [Home] Library loaded successfully');
                    })
                    .catch((error) => {
                        console.error('❌ [Home] Failed to load library:', error);
                        fetchedLibrary.current = null; // Reset để có thể retry
                    });
            } else {
                console.log('✅ [Home] Library already loaded for user:', currentUser.idUser);
            }
        } else {
            // Reset khi user logout
            if (fetchedLibrary.current !== null) {
                console.log('🔄 [Home] User logged out, resetting library flag');
                fetchedLibrary.current = null;
            }
        }
    }, [dispatch, currentUser?.idUser]); // Chỉ theo dõi idUser

    // Tối ưu: Chỉ fetch history khi user đổi và chưa fetch cho user đó  
    useEffect(() => {
        if (currentUser?.idUser) {
            const shouldFetchHistory = fetchedHistory.current !== currentUser.idUser;
            
            if (shouldFetchHistory) {
                console.log('🔄 [Home] Fetching user history for user:', currentUser.idUser);
                fetchedHistory.current = currentUser.idUser; // Set trước để tránh duplicate calls
                dispatch(getAllHistoryByUser(currentUser.idUser))
                    .unwrap()
                    .then(() => {
                        console.log('✅ [Home] History loaded successfully');
                    })
                    .catch((error) => {
                        console.error('❌ [Home] Failed to load history:', error);
                        fetchedHistory.current = null; // Reset để có thể retry
                    });
            } else {
                console.log('✅ [Home] History already loaded for user:', currentUser.idUser);
            }
        } else {
            // Reset khi user logout
            if (fetchedHistory.current !== null) {
                console.log('🔄 [Home] User logged out, resetting history flag');
                fetchedHistory.current = null;
            }
        }
    }, [dispatch, currentUser?.idUser]); // Chỉ theo dõi idUser

    // Tối ưu: Fetch transactions data khi user đăng nhập để tránh phải gọi ở DetailPage
    const fetchedTransactions = useRef(null);
    useEffect(() => {
        if (currentUser?.idUser) {
            if (fetchedTransactions.current !== currentUser.idUser) {
                console.log('🔄 [Home] Fetching transactions data for user:', currentUser.idUser);
                fetchedTransactions.current = currentUser.idUser; // Set trước để tránh duplicate calls
                dispatch(getAllTransactions({ statusDeposit: 'SUCCESS' }))
                    .unwrap()
                    .then(() => {
                        console.log('✅ [Home] Transactions loaded successfully');
                    })
                    .catch((error) => {
                        console.error('❌ [Home] Failed to load transactions:', error);
                        fetchedTransactions.current = null; // Reset để có thể retry
                    });
            } else {
                console.log('✅ [Home] Transactions already loaded for user:', currentUser.idUser);
            }
        } else {
            // Reset khi user logout
            if (fetchedTransactions.current !== null) {
                console.log('🔄 [Home] User logged out, resetting transactions flag');
                fetchedTransactions.current = null;
            }
        }
    }, [dispatch, currentUser?.idUser]);

    // Effect để reset flags khi component unmount - chỉ khi thực sự cần
    useEffect(() => {
        return () => {
            // Chỉ cleanup khi thực sự navigate away, không phải Hot Reload
            const isHotReload = process.env.NODE_ENV === 'development' && 
                              window.performance?.getEntriesByType?.('navigation')?.[0]?.type !== 'navigate';
            
            if (!isHotReload) {
                console.log('🧹 [Home] Component unmounting, cleaning up...');
                fetchedNovels.current = false;
                fetchedLibrary.current = null;
                fetchedHistory.current = null; 
                fetchedTransactions.current = null;
            } else {
                console.log('🔄 [Home] Hot reload detected, keeping flags...');
            }
        };
    }, []);

    return (
        <>
            {/* Hiển thị loading state nếu đang tải dữ liệu quan trọng */}
            {isLoadingCriticalData && (
                <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm ${
                    isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'
                } shadow-md`}>
                    <span>🔄 Đang tải dữ liệu...</span>
                </div>
            )}
            
            <div className={`min-h-screen transition-colors duration-300 ${
                isDarkMode 
                    ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white' 
                    : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
            }`}>
                <div className="space-y-8 pb-8">
                    <StorySlider />
                    <TopStories />
                    {/* <RecommendedStoriesTest /> */}
                    <RecommendedStories />
                    <Stories />
                </div>
                <Footer />
                {/* Other components can be added here */}
            </div>
        </>
    );
};

export default Home;