
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Loader2 ,Download, ShoppingCart, Plus, Clock } from 'lucide-react'; // Thêm Clock icon
import { getChapterContentById } from '../redux/chapterSlice'; 
import { useTheme } from '../context/ThemeContext'; // Import useTheme 

// Import các action từ transactionSlice và userSlice
import { createTransaction, confirmTransactions, resetTransactionState } from '../redux/transactionSlice';
import { logoutUser, loginUserWithPassword, refreshUser } from '../redux/userSlice';

// Utility functions cho giỏ hàng
const getCartFromStorage = () => {
  const cart = sessionStorage.getItem('chapterCart');
  return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart) => {
  sessionStorage.setItem('chapterCart', JSON.stringify(cart));
};

const addToCart = (chapter, novelId) => {
  const cart = getCartFromStorage();
  const exists = cart.find(item => item.chapterId === chapter.idChapter);
  if (!exists) {
    cart.push({
      chapterId: chapter.idChapter,
      chapterTitle: chapter.titleChapter,
      coinPrice: chapter.coinPrice || 0,
      novelId: novelId
    });
    saveCartToStorage(cart);
    return true;
  }
  return false;
};

const removeFromCart = (chapterId) => {
  const cart = getCartFromStorage();
  const newCart = cart.filter(item => item.chapterId !== chapterId);
  saveCartToStorage(newCart);
  return newCart;
};

// Component Dialog thuê chương
const RentDialog = ({ chapter, onConfirm, onCancel, loading, isDarkMode }) => {
  const [selectedDays, setSelectedDays] = useState(chapter?.dayRentAmount || 1);
  const [customDays, setCustomDays] = useState('');
  const [useCustomDays, setUseCustomDays] = useState(false);
  
  if (!chapter) return null;
  
  const baseRentPrice = chapter.cointRentPrice || 1;
  const baseDays = chapter.dayRentAmount || 1;
  
  // Tính giá thuê dựa trên số ngày
  const calculateRentPrice = (days) => {
    return Math.ceil((days / baseDays) * baseRentPrice);
  };
  
  const finalDays = useCustomDays ? parseInt(customDays) || 1 : selectedDays;
  const totalPrice = calculateRentPrice(finalDays);
  
  // Tính ngày hết hạn với timezone +7 giờ (Việt Nam)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + finalDays);
  // Cộng 7 giờ để chuyển sang timezone Việt Nam
  const vietnamEndDate = new Date(endDate.getTime() + (7 * 60 * 60 * 1000));
  const endDateString = vietnamEndDate.toLocaleDateString('vi-VN', {
    timeZone: 'UTC', // Hiển thị theo UTC vì đã adjust rồi
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const handleConfirm = () => {
    onConfirm(finalDays, totalPrice);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
      <div className={`rounded-lg shadow-xl p-6 w-11/12 max-w-md transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200' 
          : 'bg-white text-gray-800'
      }`}>
        <h3 className={`text-xl font-semibold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          🕐 Thuê Chương
        </h3>
        
        <div className={`mb-4 p-3 rounded-lg ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
        }`}>
          <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {chapter.titleChapter}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Gói cơ bản: {baseDays} ngày - {baseRentPrice} xu
          </p>
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Chọn thời gian thuê:
          </label>
          
          {/* Tùy chọn có sẵn */}
          <div className="space-y-2 mb-3">
            {[baseDays, baseDays * 2, baseDays * 3, baseDays * 7].map(days => (
              <label key={days} className="flex items-center">
                <input
                  type="radio"
                  name="rentDays"
                  value={days}
                  checked={!useCustomDays && selectedDays === days}
                  onChange={(e) => {
                    setSelectedDays(parseInt(e.target.value));
                    setUseCustomDays(false);
                  }}
                  className="mr-2"
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {days} ngày - {calculateRentPrice(days)} xu
                </span>
              </label>
            ))}
            
            {/* Tùy chọn tùy chỉnh */}
            <label className="flex items-center">
              <input
                type="radio"
                name="rentDays"
                checked={useCustomDays}
                onChange={() => setUseCustomDays(true)}
                className="mr-2"
              />
              <span className={`text-sm mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tùy chỉnh:
              </span>
              <input
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => {
                  setCustomDays(e.target.value);
                  setUseCustomDays(true);
                }}
                className={`w-20 px-2 py-1 text-sm rounded border ${
                  isDarkMode 
                    ? 'bg-slate-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Ngày"
              />
              <span className={`text-sm ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ngày - {useCustomDays ? calculateRentPrice(parseInt(customDays) || 1) : 0} xu
              </span>
            </label>
          </div>
        </div>

        <div className={`mb-4 p-3 rounded-lg border-2 border-dashed ${
          isDarkMode ? 'border-orange-500 bg-orange-900/20' : 'border-orange-400 bg-orange-50'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
              Tổng cộng:
            </span>
            <span className={`font-bold text-lg ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              {totalPrice} xu
            </span>
          </div>
          <div className={`text-sm mt-1 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
            Thời hạn: {finalDays} ngày (đến {endDateString})
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={onCancel} 
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
              isDarkMode 
                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Hủy
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading || finalDays < 1}
            className={`flex-1 px-4 py-2 rounded-md text-white flex items-center justify-center transition-colors ${
              isDarkMode 
                ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800' 
                : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700'
            }`}
          >
            {loading && <Loader2 className="animate-spin mr-2" size={16}/>}
            Thuê ngay
          </button>
        </div>
      </div>
    </div>
  );
};

// Component Dialog xác nhận cuối cùng cho giỏ hàng
const CartConfirmDialog = ({ cartItems, onConfirm, onCancel, loading, isDarkMode }) => {
    if (!cartItems || cartItems.length === 0) return null;
    const totalCost = cartItems.reduce((sum, item) => sum + item.coinPrice, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
            <div className={`rounded-lg shadow-xl p-6 w-11/12 max-w-md transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200' 
                : 'bg-white text-gray-800'
            }`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                    <ShoppingCart className="mr-2" size={20} />
                    Xác Nhận Mua Giỏ Hàng
                </h3>
                <p className="mb-2">Bạn sắp dùng xu để mua {cartItems.length} chương:</p>
                <div className={`max-h-32 overflow-y-auto p-2 rounded border mb-4 ${
                  isDarkMode ? 'bg-slate-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                }`}>
                    <ul className="text-sm">
                        {cartItems.map(item => (
                            <li key={item.chapterId} className={`flex justify-between items-center py-1 border-b last:border-b-0 ${
                              isDarkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}>
                                <span className="truncate flex-1 mr-2">{item.chapterTitle}</span>
                                <span className="font-medium text-orange-600">{item.coinPrice} xu</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="mb-6 text-lg">Tổng cộng: <span className="font-bold text-orange-500">{totalCost} xu</span></p>
                <div className="flex justify-end space-x-3">
                    <button 
                      onClick={onCancel} 
                      disabled={loading} 
                      className={`px-5 py-2 rounded-md transition-colors disabled:opacity-50 ${
                        isDarkMode 
                          ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                          : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                        Hủy
                    </button>
                    <button 
                      onClick={onConfirm} 
                      disabled={loading} 
                      className="px-5 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center disabled:bg-green-700"
                    >
                        {loading && <Loader2 className="animate-spin mr-2" size={16}/>}
                        Xác nhận mua
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component Dialog xác nhận cuối cùng cho mua lẻ
const FinalConfirmDialog = ({ transactionDetails, onConfirm, onCancel, loading, isDarkMode }) => {
    if (!transactionDetails) return null;
    const { chapters, totalCost } = transactionDetails;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
            <div className={`rounded-lg shadow-xl p-6 w-11/12 max-w-md transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200' 
                : 'bg-white text-gray-800'
            }`}>
                <h3 className={`text-xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>Xác Nhận Thanh Toán</h3>
                <p className="mb-2">Bạn sắp dùng xu để mua {chapters.length} chương:</p>
                <div className={`max-h-24 overflow-y-auto p-2 rounded border mb-4 ${
                  isDarkMode ? 'bg-slate-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                }`}>
                    <ul className="text-sm list-disc list-inside">
                        {chapters.map(ch => <li key={ch.id} className="truncate">{ch.title}</li>)}
                    </ul>
                </div>
                <p className="mb-6 text-lg">Tổng cộng: <span className="font-bold text-orange-500">{totalCost} xu</span></p>
                <div className="flex justify-end space-x-3">
                    <button 
                      onClick={onCancel} 
                      disabled={loading} 
                      className={`px-5 py-2 rounded-md transition-colors disabled:opacity-50 ${
                        isDarkMode 
                          ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                          : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                        Hủy
                    </button>
                    <button 
                      onClick={onConfirm} 
                      disabled={loading} 
                      className="px-5 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center disabled:bg-green-700"
                    >
                        {loading && <Loader2 className="animate-spin mr-2" size={16}/>}
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};
 const ChapterListDisplay = ({ chapters, novelId, currentPage = 1, chaptersPerPage = 50 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Sử dụng theme context

  console.log('🔍 [ChapterListDisplay] Props received:', { 
    chapters: chapters?.length || 0, 
    novelId, 
    currentPage, 
    chaptersPerPage 
  });
  console.log('📋 [ChapterListDisplay] Chapters data:', chapters);

  // Debug logging
  console.log('🔍 [ChapterListDisplay] Received props:', {
    chaptersCount: chapters?.length,
    novelId,
    currentPage,
    chaptersPerPage,
    firstChapter: chapters?.[0]
  });

  // Early return nếu không có chapters để hiển thị
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    console.warn('⚠️ [ChapterListDisplay] No chapters to display');
    return (
      <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Không có chương nào để hiển thị.
      </div>
    );
  }

  // Lấy state mới từ Redux
  const { currentUser } = useSelector((state) => state.user);
  const { createStatus, confirmStatus, pendingTransaction, createError, allTransactions } = useSelector((state) => state.transaction);
  const { currentNovel } = useSelector((state) => state.novels);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [showRentDialog, setShowRentDialog] = useState(false); // State cho dialog thuê
  const [chapterToRent, setChapterToRent] = useState(null); // Chapter đang muốn thuê
  const [cart, setCart] = useState(getCartFromStorage());
  const [downloadingChapterId, setDownloadingChapterId] = useState(null);
  const [isRentTransaction, setIsRentTransaction] = useState(false); // Flag để phân biệt transaction thuê vs mua 
  const handleDownload = async (chapter) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để tải về chương.");
      return;
    }

    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapter.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để tải về chương.");
      return;
    }

    if (!chapter || !chapter.idChapter) return;

    setDownloadingChapterId(chapter.idChapter);
    
    try {
      // 1. Lấy nội dung chương
      const chapterContentResult = await dispatch(getChapterContentById({ 
          novelId: novelId, 
          chapterId: chapter.idChapter 
      })).unwrap();

      const contentHtml = chapterContentResult.contentChapter;
      if (!contentHtml) {
        throw new Error("Nội dung chương rỗng.");
      }

      // 2. Tạo Template HTML với CSS được nhúng (inline)
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${currentNovel?.nameNovel} - ${chapter.titleChapter}</title>
          <style>
            /* Nhúng các quy tắc CSS quan trọng vào đây */
            body {
              font-family: 'Tahoma', sans-serif;
              line-height: 1.8;
              font-size: 20px;
              background-color: #f0f0f0; /* Màu nền xám nhạt */
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 800px;
              margin: 20px auto;
              padding: 20px 40px;
              background-color: #ffffff; /* Nền trắng cho nội dung */
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
              font-size: 1.8em;
              color: #1a1a1a;
              border-bottom: 2px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              font-size: 1.4em;
              color: #2a2a2a;
              margin-bottom: 25px;
            }
            p {
              margin-bottom: 1.2em;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                font-size: 0.8em;
                color: #888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${currentNovel?.nameNovel || 'Không rõ tên truyện'}</h1>
            <h2>${chapter.titleChapter}</h2>
            <div class="content">
              ${contentHtml}
            </div>
            <div class="footer">
                <p>Tải về từ https://webtruyen-git-fontend-phan-thanh-vus-projects.vercel.app/</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // 3. Tạo tên file và kích hoạt tải về
      const safeFileName = `${currentNovel?.nameNovel} - ${chapter.titleChapter}.html`.replace(/[\\/:*?"<>|]/g, '-');
      const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Đã bắt đầu tải về file HTML!");

    } catch (err) {
      toast.error(`Lỗi khi tải chương: ${err.message || err}`);
    } finally {
      setDownloadingChapterId(null);
    }
  };
  // Effect để xử lý kết quả từ `createTransaction`
  useEffect(() => {
    if (createStatus === 'succeeded' && pendingTransaction) {
      // Chỉ hiển thị dialog xác nhận cho transaction mua, không phải thuê
      if (!isRentTransaction) {
        setShowConfirmDialog(true);
      }
    }
    if (createStatus === 'failed' && createError) {
      toast.error(`Lỗi tạo giao dịch: ${createError}`);
      dispatch(resetTransactionState());
      setIsRentTransaction(false); // Reset flag
    }
  }, [createStatus, pendingTransaction, createError, dispatch, isRentTransaction]);

  // Effect riêng để xử lý transaction thuê thành công
  useEffect(() => {
    if (createStatus === 'succeeded' && pendingTransaction && isRentTransaction) {
      // Tự động confirm transaction thuê luôn
      handleConfirmRentTransaction();
    }
  }, [createStatus, pendingTransaction, isRentTransaction]);

  const handleConfirmRentTransaction = async () => {
    if (!currentUser || !pendingTransaction) return;
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: pendingTransaction.idChapters,
    };
    
    console.log('Xác nhận giao dịch thuê với data:', confirmationData);
    
    try {
      // Xác nhận giao dịch thuê
      const result = await dispatch(confirmTransactions(confirmationData)).unwrap();
      toast.success("Thuê chương thành công! Đang cập nhật dữ liệu...");

      // Refresh dữ liệu người dùng
      await dispatch(refreshUser()).unwrap();
      
      // Không cần gọi getAllTransactions nữa vì đã được gọi ở Home
      // và refreshUser sẽ cập nhật user data
      
      toast.success("Đã thuê chương thành công!");

      // Điều hướng đến chương đã thuê
      if (pendingTransaction.idChapters.length === 1) {
        const rentedChapterId = pendingTransaction.idChapters[0];
        navigate(`/novel/${novelId}/chapter/${rentedChapterId}`);
      }

    } catch (error) {
      console.error('Lỗi xác nhận giao dịch thuê:', error);
      toast.error(`Giao dịch thuê thất bại: ${error.message || error}`);
    } finally {
      // Reset state
      setIsRentTransaction(false);
      dispatch(resetTransactionState());
    }
  };

  // Cập nhật cart từ storage
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(getCartFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper function để kiểm tra chapter có được mua không (memoized)
  const isChapterPurchased = useCallback((chapterId) => {
    // Kiểm tra trong currentUser.chapterBought (primary source)
    const inUserData = currentUser?.chapterBought?.includes(chapterId);
    
    // Kiểm tra trong allTransactions.purchasedChapters (secondary source)
    const inTransactionData = allTransactions?.purchasedChapters?.includes(chapterId);
    
    // Trả về true nếu có ít nhất 1 source confirm đã mua
    return inUserData || inTransactionData;
  }, [currentUser?.chapterBought, allTransactions?.purchasedChapters]);

  // Helper function để kiểm tra chapter có được thuê không và còn hạn không (memoized)
  const getChapterRentInfo = useCallback((chapterId) => {
    if (!allTransactions?.rentedNovels) return null;
    
    for (const novel of Object.values(allTransactions.rentedNovels)) {
      const rentedChapter = novel.chapterBoughtRespone?.find(ch => ch.idChapter === chapterId);
      if (rentedChapter && rentedChapter.rentExpiration) {
        const expirationDate = new Date(rentedChapter.rentExpiration);
        const now = new Date();
        const isExpired = now > expirationDate;
        
        return {
          isRented: true,
          expirationDate,
          isExpired,
          daysLeft: isExpired ? 0 : Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
        };
      }
    }
    return null;
  }, [allTransactions?.rentedNovels]);

  const handleChapterClick = (chapter) => {
    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapter.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để đọc chương này.");
      return;
    }
    
    // Kiểm tra nếu chapter miễn phí (coinPrice = 0)
    if ((chapter.coinPrice || 0) === 0) {
      navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
      return;
    }
    
    // Kiểm tra nếu đã mua chapter
    const isPurchased = isChapterPurchased(chapter.idChapter);
    if (isPurchased) {
      navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
      return;
    }
    
    // Kiểm tra nếu đã thuê chapter và còn hạn
    const rentInfo = getChapterRentInfo(chapter.idChapter);
    if (rentInfo?.isRented && !rentInfo?.isExpired) {
      navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
      return;
    }
    
    // Nếu chưa mua và chưa thuê thì thông báo
    toast.info("Bạn cần mua hoặc thuê chương này để đọc.");
  };

  const handleAddToCart = useCallback((chapter) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return;
    }

    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapter.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return;
    }

    // Kiểm tra nếu chapter miễn phí
    if ((chapter.coinPrice || 0) === 0) {
      toast.info("Chương này miễn phí, bạn có thể đọc trực tiếp.");
      navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
      return;
    }

    const isPurchased = isChapterPurchased(chapter.idChapter);
    if (isPurchased) {
      toast.info("Bạn đã sở hữu chương này.");
      return;
    }

    // Kiểm tra nếu đã thuê và còn hạn
    const rentInfo = getChapterRentInfo(chapter.idChapter);
    if (rentInfo?.isRented && !rentInfo?.isExpired) {
      toast.info("Bạn đã thuê chương này và còn hạn sử dụng.");
      return;
    }

    const success = addToCart(chapter, novelId);
    if (success) {
      setCart(getCartFromStorage());
      toast.success(`Đã thêm "${chapter.titleChapter}" vào giỏ hàng!`);
    } else {
      toast.info("Chương này đã có trong giỏ hàng.");
    }
  }, [currentUser, navigate, novelId, isChapterPurchased, getChapterRentInfo]);

  const handlePurchaseCart = () => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để mua chương.");
      navigate('/');
      return;
    }

    if (cart.length === 0) {
      toast.info("Giỏ hàng trống.");
      return;
    }

    const totalCost = cart.reduce((sum, item) => sum + item.coinPrice, 0);
    if ((currentUser.coin || 0) < totalCost) {
      toast.error("Số xu không đủ. Vui lòng nạp thêm!");
      navigate('/deposit');
      return;
    }

    setIsRentTransaction(false); // Đây là transaction mua
    const transactionData = {
      idUser: currentUser.idUser,
      idChapters: cart.map(item => item.chapterId),
      amountCoin: totalCost,
      typeTransaction: 'BUY',
      dateEndRent: null,
    };
    
    console.log('Tạo giao dịch với data:', transactionData);
    dispatch(createTransaction(transactionData));
  };

  const handlePurchaseClick = (chapterToBuy) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để mua chương.");
      return;
    }

    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapterToBuy.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để mua chương.");
      return;
    }

    // Kiểm tra nếu chapter miễn phí
    const coinPrice = chapterToBuy.coinPrice || 0;
    if (coinPrice === 0) {
      toast.info("Chương này miễn phí, bạn có thể đọc trực tiếp.");
      navigate(`/novel/${novelId}/chapter/${chapterToBuy.idChapter}`);
      return;
    }

    // Kiểm tra nếu đã mua
    const isPurchased = isChapterPurchased(chapterToBuy.idChapter);
    if (isPurchased) {
      toast.info("Bạn đã sở hữu chương này.");
      navigate(`/novel/${novelId}/chapter/${chapterToBuy.idChapter}`);
      return;
    }

    // Kiểm tra nếu đã thuê và còn hạn
    const rentInfo = getChapterRentInfo(chapterToBuy.idChapter);
    if (rentInfo?.isRented && !rentInfo?.isExpired) {
      toast.info("Bạn đã thuê chương này và còn hạn sử dụng.");
      navigate(`/novel/${novelId}/chapter/${chapterToBuy.idChapter}`);
      return;
    }

    if ((currentUser.coin || 0) < coinPrice) {
      toast.error("Số xu không đủ. Vui lòng nạp thêm!");
      navigate('/deposit');
      return;
    }
    
    setIsRentTransaction(false); // Đây là transaction mua
    const transactionData = {
      idUser: currentUser.idUser,
      idChapters: [chapterToBuy.idChapter],
      amountCoin: coinPrice,
      typeTransaction: 'BUY',
      dateEndRent: null,
    };
    
    console.log('Tạo giao dịch đơn lẻ với data:', transactionData);
    dispatch(createTransaction(transactionData));
  };

   const handleConfirmPurchase = async () => {
    if (!currentUser || !pendingTransaction) return;
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: pendingTransaction.idChapters,
    };
    
    console.log('Xác nhận giao dịch với data:', confirmationData);
    
    try {
      // BƯỚC 1: Chờ xác nhận giao dịch thành công
      const result = await dispatch(confirmTransactions(confirmationData)).unwrap();
      toast.success("Mua chương thành công! Đang cập nhật dữ liệu...");

      // BƯỚC 2: Chờ refresh dữ liệu người dùng thành công
      await dispatch(refreshUser()).unwrap();
      
      // Không cần gọi getAllTransactions nữa vì đã được gọi ở Home
      // và refreshUser sẽ cập nhật user data với chương đã mua
      
      // BƯỚC 3: Xóa các chương đã mua khỏi giỏ hàng
      const purchasedChapterIds = pendingTransaction.idChapters;
      purchasedChapterIds.forEach(chapterId => {
        removeFromCart(chapterId);
      });
      setCart(getCartFromStorage());
      
      toast.success("Đã lưu chương!");

      // BƯỚC 4: Sau khi mọi thứ đã xong, mới điều hướng (nếu chỉ mua 1 chương)
      if (pendingTransaction.idChapters.length === 1) {
        const purchasedChapterId = pendingTransaction.idChapters[0];
        navigate(`/novel/${novelId}/chapter/${purchasedChapterId}`);
      }

    } catch (error) {
      console.error('Lỗi xác nhận giao dịch:', error);
      toast.error(`Giao dịch thất bại: ${error.message || error}`);
    } finally {
      // Luôn đóng dialog và reset state dù thành công hay thất bại
      setShowConfirmDialog(false);
      setShowCartDialog(false);
      dispatch(resetTransactionState());
    }
  };
  
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setShowCartDialog(false);
    setIsRentTransaction(false); // Reset flag
    dispatch(resetTransactionState());
  };

  // Hàm xử lý thuê chương
  const handleRentClick = (chapter) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để thuê chương.");
      return;
    }

    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapter.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để thuê chương.");
      return;
    }

    // Kiểm tra nếu chapter miễn phí
    if ((chapter.coinPrice || 0) === 0) {
      toast.info("Chương này miễn phí, bạn có thể đọc trực tiếp.");
      navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
      return;
    }

    const isPurchased = isChapterPurchased(chapter.idChapter);
    if (isPurchased) {
      toast.info("Bạn đã sở hữu chương này, không cần thuê.");
      return;
    }

    // Kiểm tra nếu đã thuê và còn hạn
    const rentInfo = getChapterRentInfo(chapter.idChapter);
    if (rentInfo?.isRented && !rentInfo?.isExpired) {
      toast.info("Bạn đã thuê chương này và còn hạn sử dụng.");
      navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
      return;
    }

    // Kiểm tra xem chương có hỗ trợ thuê không
    if (!chapter.cointRentPrice || !chapter.dayRentAmount) {
      toast.info("Chương này không hỗ trợ thuê.");
      return;
    }

    setChapterToRent(chapter);
    setShowRentDialog(true);
  };

  const handleConfirmRent = (days, totalPrice) => {
    if (!currentUser || !chapterToRent) return;

    if ((currentUser.coin || 0) < totalPrice) {
      toast.error("Số xu không đủ. Vui lòng nạp thêm!");
      navigate('/deposit');
      return;
    }

    // Tính ngày hết hạn
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    setIsRentTransaction(true); // Đây là transaction thuê
    const transactionData = {
      idUser: currentUser.idUser,
      idChapters: [chapterToRent.idChapter],
      amountCoin: totalPrice,
      typeTransaction: 'RENT',
      dateEndRent: endDate.toISOString(),
    };
    
    console.log('Tạo giao dịch thuê với data:', transactionData);
    dispatch(createTransaction(transactionData));
    setShowRentDialog(false);
    setChapterToRent(null);
  };

  const handleCancelRent = () => {
    setShowRentDialog(false);
    setChapterToRent(null);
  };

  return (
    <>
      {/* Header với thông tin giỏ hàng */}
      {cart.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-blue-900 border-blue-700' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
              <ShoppingCart className="mr-2" size={18} />
              <span className="text-sm">Giỏ hàng: {cart.length} chương</span>
              <span className={`ml-2 font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                ({cart.reduce((sum, item) => sum + item.coinPrice, 0)} xu)
              </span>
            </div>
            <button
              onClick={handlePurchaseCart}
              disabled={createStatus === 'loading' || confirmStatus === 'loading'}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {createStatus === 'loading' ? (
                <Loader2 className="animate-spin mr-1" size={14} />
              ) : (
                <ShoppingCart className="mr-1" size={14} />
              )}
              Mua tất cả
            </button>
          </div>
        </div>
      )}

      {/* Màn hình loading che phủ khi đang TẠO giao dịch */}
      {(createStatus === 'loading') && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-[9998]">
            <Loader2 className="animate-spin text-white" size={48} />
            <p className="text-white mt-4">Đang tạo giao dịch...</p>
        </div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm">
        {useMemo(() => chapters.map((chapter, index) => {
          // Tính số chương hiển thị dựa trên indexChapter (giống ReadingPage)
          const displayChapterNumber = chapter.indexChapter !== null && chapter.indexChapter !== undefined 
            ? Number(chapter.indexChapter) 
            : ((currentPage - 1) * chaptersPerPage + index + 1); // Fallback
          const chapterNumberDisplay = `Chương ${displayChapterNumber}`;
          const chapterTitle = chapter.titleChapter || "Chưa có tiêu đề";
          const isPurchased = isChapterPurchased(chapter.idChapter);
          // Kiểm tra xem có đang tải chương này không
          const isDownloading = downloadingChapterId === chapter.idChapter;
          const coinPrice = chapter.coinPrice || 0; // Lấy giá từ API
          const coinRentPrice = chapter.cointRentPrice || 0; // Giá thuê từ API
          const dayRentAmount = chapter.dayRentAmount || 0; // Số ngày thuê từ API
          const isInCart = cart.some(item => item.chapterId === chapter.idChapter);
          // Kiểm tra xem chapter có yêu cầu đăng nhập không
          const requiresLogin = chapter.isLoginRequired || false;
          // Kiểm tra xem chapter có hỗ trợ thuê không
          const canRent = coinRentPrice > 0 && dayRentAmount > 0;
          // Kiểm tra thông tin thuê chapter
          const rentInfo = getChapterRentInfo(chapter.idChapter);
          const isRented = rentInfo?.isRented && !rentInfo?.isExpired;
          // Kiểm tra chapter miễn phí
          const isFree = coinPrice === 0;
          // Kiểm tra có thể đọc không (đã mua, đã thuê, hoặc miễn phí)
          const canRead = isPurchased || isRented || isFree;
          
          return (
            <li key={chapter.idChapter || `temp_${index}`} className={`flex items-center justify-between border-b py-1.5 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center flex-grow min-w-0">
                <span className={`w-20 md:w-24 flex-shrink-0 text-left mr-3 pl-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{chapterNumberDisplay}</span>
                <div className="flex-1 min-w-0">
                  {canRead && !requiresLogin ? (
                    <Link to={`/novel/${novelId}/chapter/${chapter.idChapter}`} className={`hover:text-sky-400 truncate ${
                      isPurchased 
                        ? isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        : isRented 
                        ? isDarkMode ? 'text-purple-300' : 'text-purple-600'
                        : isDarkMode ? 'text-green-300' : 'text-green-600' // Miễn phí
                    }`} title={chapterTitle}>
                      {chapterTitle} {isRented ? '🕐' : isFree ? '' : ''}
                    </Link>
                  ) : requiresLogin ? (
                    <button 
                      onClick={() => handleChapterClick(chapter)}
                      className={`hover:text-yellow-400 truncate text-left cursor-pointer ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`} 
                      title={`${chapterTitle} - Vui lòng đăng nhập để đọc`}
                    >
                      {chapterTitle} 🔒
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleChapterClick(chapter)}
                      className={`hover:text-orange-400 truncate text-left cursor-pointer ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`} 
                      title={`${chapterTitle} - Cần mua hoặc thuê để đọc`}
                    >
                      {chapterTitle} 
                    </button>
                  )}
                  
                  {/* Hiển thị thông tin thuê nếu có */}
                  {rentInfo && !rentInfo.isExpired && (
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      Còn {rentInfo.daysLeft} ngày ({rentInfo.expirationDate.toLocaleDateString('vi-VN')})
                    </div>
                  )}
                  {rentInfo && rentInfo.isExpired && (
                    <div className="text-xs text-red-400 mt-1">
                      Hết hạn thuê ({rentInfo.expirationDate.toLocaleDateString('vi-VN')})
                    </div>
                  )}
                </div>
              </div>

              {/* NÚT HÀNH ĐỘNG: MUA, THÊM VÀO GIỎ, hoặc TẢI VỀ */}
              <div className="ml-3 flex-shrink-0 flex items-center space-x-2">
                {requiresLogin ? (
                  <button
                    onClick={() => handleChapterClick(chapter)}
                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                    title="Đăng nhập để đọc"
                  >
                    Đăng nhập
                  </button>
                ) : canRead ? (
                  // Đã mua, đã thuê, hoặc miễn phí - cho phép tải về
                  <>
                    <button
                      onClick={() => handleDownload(chapter)}
                      disabled={isDownloading}
                      className={`px-3 py-1 text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center ${
                        isFree
                          ? isDarkMode 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-500 text-white'
                          : isRented 
                          ? isDarkMode 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-500 text-white'
                          : 'bg-green-600 text-white'
                      }`}
                      title={`Tải về chương ${chapterTitle}`}
                    >
                      {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    </button>
                    {isFree && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700'
                      }`}>
                        Miễn phí
                      </span>
                    )}
                  </>
                ) : (
                  // Chưa mua, chưa thuê và không miễn phí - hiển thị các tùy chọn mua/thuê
                  <>
                    {/* Nút thêm vào giỏ hàng */}
                    <button
                      onClick={() => handleAddToCart(chapter)}
                      disabled={isInCart || createStatus === 'loading' || confirmStatus === 'loading'}
                      className={`px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 flex items-center ${
                        isInCart 
                          ? isDarkMode
                            ? 'bg-blue-600 text-white cursor-not-allowed'
                            : 'bg-blue-500 text-white cursor-not-allowed'
                          : isDarkMode
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-blue-400 text-white hover:bg-blue-500'
                      }`}
                      title={isInCart ? "Đã có trong giỏ" : "Thêm vào giỏ hàng"}
                    >
                      {isInCart ? <ShoppingCart size={14} /> : <Plus size={14} />}
                    </button>

                    {/* Nút thuê chapter nếu hỗ trợ */}
                    {canRent && (
                      <button 
                        onClick={() => handleRentClick(chapter)}
                        disabled={createStatus === 'loading' || confirmStatus === 'loading'}
                        className={`px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 flex items-center ${
                          isDarkMode 
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : 'bg-purple-400 text-white hover:bg-purple-500'
                        }`}
                        title={`Thuê ${dayRentAmount} ngày - ${coinRentPrice} coin`}
                      >
                        <Clock size={14} />
                      </button>
                    )}

                    {/* Nút mua ngay */}
                    <button
                      onClick={() => handlePurchaseClick(chapter)}
                      disabled={createStatus === 'loading' || confirmStatus === 'loading'}
                      className={`px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50 ${
                        isDarkMode 
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-orange-400 text-white hover:bg-orange-500'
                      }`}
                      title={`Mua ngay chương ${chapterTitle}`}
                    >
                      {coinPrice} xu
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        }), [chapters, currentPage, chaptersPerPage, isChapterPurchased, getChapterRentInfo, downloadingChapterId, cart, createStatus, confirmStatus, isDarkMode, currentNovel?.nameNovel])}
      </ul>

      {showConfirmDialog && pendingTransaction && (
        <>
          {pendingTransaction.idChapters.length > 1 ? (
            <CartConfirmDialog
              cartItems={pendingTransaction.idChapters.map(id => {
                const chapter = chapters.find(c => c.idChapter === id);
                return {
                  chapterId: id,
                  chapterTitle: chapter?.titleChapter || `Chương ID: ${id}`,
                  coinPrice: chapter?.coinPrice || 0
                };
              })}
              onConfirm={handleConfirmPurchase}
              onCancel={handleCancelConfirm}
              loading={confirmStatus === 'loading'}
              isDarkMode={isDarkMode}
            />
          ) : (
            <FinalConfirmDialog
              transactionDetails={{
                  chapters: pendingTransaction.idChapters.map(id => ({ 
                    id, 
                    title: chapters.find(c => c.idChapter === id)?.titleChapter || `Chương ID: ${id}` 
                  })),
                  totalCost: pendingTransaction.amountCoin,
              }}
              onConfirm={handleConfirmPurchase}
              onCancel={handleCancelConfirm}
              loading={confirmStatus === 'loading'}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      )}

      {/* Rent Dialog */}
      {showRentDialog && chapterToRent && (
        <RentDialog 
          chapter={chapterToRent}
          onConfirm={handleConfirmRent}
          onCancel={handleCancelRent}
          loading={createStatus === 'loading'}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

export default ChapterListDisplay;