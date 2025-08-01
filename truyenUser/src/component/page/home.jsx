import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { getAllNovels, LyberiNovels } from '../../redux/novelSlice';
import { getAllCategories } from '../../redux/categorySlice';
import { getAllHistoryByUser } from '../../redux/userSlice';
import { setNovelsLoading, isNovelsLoading, isNovelsLoaded } from '../../utils/apiCache';
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
    const categories = useSelector((state) => state.categories.categories);
    const currentUser = useSelector((state) => state.user.currentUser);
    const novelsLoading = useSelector((state) => state.novels.loading);
    const categoriesLoading = useSelector((state) => state.categories.loading);
    
    // Kiểm tra xem có cần hiển thị loading không
    const isLoadingCriticalData = (novelsLoading && (!novels || novels.length === 0)) ||
                                  (categoriesLoading && (!categories || categories.length === 0));
    
    // Dùng ref để đảm bảo chỉ fetch 1 lần nếu dữ liệu đã có
    const fetchedNovels = useRef(false);
    const fetchedCategories = useRef(false);
    const fetchedLibrary = useRef(null); // Track theo userId
    const fetchedHistory = useRef(null); // Track theo userId
    const isInitialMount = useRef(true);
    const retryCount = useRef({ novels: 0, categories: 0, library: 0, history: 0 });
    const MAX_RETRIES = 2;

    // Chỉ fetch novels 1 lần nếu chưa có
    useEffect(() => {
        // Ưu tiên chức năng: luôn đảm bảo có dữ liệu novels
        const shouldFetchNovels = !fetchedNovels.current && 
                                  (!novels || novels.length === 0) && 
                                  !novelsLoading;
        
        if (shouldFetchNovels) {
            console.log('🔄 [Home] Fetching all novels...');
            fetchedNovels.current = true; // Đặt flag trước để tránh gọi lại
            dispatch(getAllNovels())
                .unwrap()
                .then(() => {
                    retryCount.current.novels = 0; // Reset retry count on success
                    console.log('✅ [Home] Novels loaded successfully');
                })
                .catch((error) => {
                    fetchedNovels.current = false; // Reset flag nếu lỗi
                    console.error('❌ [Home] Failed to load novels:', error);
                    
                    // Retry logic với exponential backoff
                    if (retryCount.current.novels < MAX_RETRIES) {
                        retryCount.current.novels++;
                        const retryDelay = Math.pow(2, retryCount.current.novels) * 1000;
                        console.log(`🔄 [Home] Retrying novels fetch in ${retryDelay}ms (attempt ${retryCount.current.novels})`);
                        
                        setTimeout(() => {
                            fetchedNovels.current = false; // Reset để trigger retry
                        }, retryDelay);
                    }
                });
        } else if (novels && novels.length > 0 && !fetchedNovels.current) {
            // Nếu đã có data từ cache/store, chỉ cần đánh dấu đã fetch
            console.log('✅ [Home] Novels already available in store');
            fetchedNovels.current = true;
        }
    }, [dispatch, novels, novelsLoading]); // Thêm novelsLoading vào dependencies

    // Chỉ fetch categories 1 lần nếu chưa có
    useEffect(() => {
        // Ưu tiên chức năng: đảm bảo categories được load khi cần
        const shouldFetchCategories = !fetchedCategories.current && 
                                     (!categories || categories.length === 0) &&
                                     !categoriesLoading;
        
        if (shouldFetchCategories) {
            console.log('🔄 [Home] Fetching all categories...');
            fetchedCategories.current = true; // Đặt flag trước để tránh gọi lại
            dispatch(getAllCategories())
                .unwrap()
                .then(() => {
                    retryCount.current.categories = 0;
                    console.log('✅ [Home] Categories loaded successfully');
                })
                .catch((error) => {
                    fetchedCategories.current = false; // Reset flag nếu lỗi
                    console.error('❌ [Home] Failed to load categories:', error);
                    
                    // Retry với delay
                    if (retryCount.current.categories < MAX_RETRIES) {
                        retryCount.current.categories++;
                        const retryDelay = Math.pow(2, retryCount.current.categories) * 1000;
                        console.log(`🔄 [Home] Retrying categories fetch in ${retryDelay}ms`);
                        
                        setTimeout(() => {
                            fetchedCategories.current = false;
                        }, retryDelay);
                    }
                });
        } else if (categories && categories.length > 0 && !fetchedCategories.current) {
            // Nếu đã có data từ store, chỉ cần đánh dấu
            console.log('✅ [Home] Categories already available in store');
            fetchedCategories.current = true;
        }
    }, [dispatch, categories, categoriesLoading]); // Thêm categoriesLoading vào dependencies

    // Chỉ fetch library khi user đổi và chưa fetch cho user đó
    useEffect(() => {
        // Ưu tiên chức năng: đảm bảo library được load cho user đăng nhập
        if (currentUser?.idUser) {
            const shouldFetchLibrary = fetchedLibrary.current !== currentUser.idUser;
            
            if (shouldFetchLibrary) {
                console.log('🔄 [Home] Fetching user library for user:', currentUser.idUser);
                dispatch(LyberiNovels({ idUser: currentUser.idUser }))
                    .unwrap()
                    .then(() => {
                        fetchedLibrary.current = currentUser.idUser;
                        console.log('✅ [Home] Library loaded successfully');
                    })
                    .catch((error) => {
                        console.error('❌ [Home] Failed to load library:', error);
                        // Không reset flag để có thể retry
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

    // Chỉ fetch history khi user đổi và chưa fetch cho user đó
    useEffect(() => {
        // Ưu tiên chức năng: đảm bảo history được load cho user khi cần
        if (currentUser?.idUser) {
            const shouldFetchHistory = fetchedHistory.current !== currentUser.idUser;
            
            if (shouldFetchHistory) {
                console.log('🔄 [Home] Fetching user history for user:', currentUser.idUser);
                dispatch(getAllHistoryByUser(currentUser.idUser))
                    .unwrap()
                    .then(() => {
                        fetchedHistory.current = currentUser.idUser;
                        console.log('✅ [Home] History loaded successfully');
                    })
                    .catch((error) => {
                        console.error('❌ [Home] Failed to load history:', error);
                        // Không reset flag để có thể retry sau
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

    // Effect để reset flags khi component unmount
    useEffect(() => {
        return () => {
            // Cleanup khi component unmount
            console.log('🧹 [Home] Component unmounting, cleaning up...');
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