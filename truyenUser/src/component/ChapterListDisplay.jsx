
import React, { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Loader2 ,Download, ShoppingCart, Plus } from 'lucide-react'; // Thêm icon giỏ hàng
import { refreshUser } from '../redux/userSlice';
import { getChapterContentById } from '../redux/chapterSlice'; 

// Import các action từ transactionSlice và userSlice
import { createTransaction, confirmTransactions, resetTransactionState } from '../redux/transactionSlice';
import { logoutUser, loginUserWithPassword } from '../redux/userSlice'; // Giả sử bạn có thông tin để login lại

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

// Component Dialog xác nhận cuối cùng cho giỏ hàng
const CartConfirmDialog = ({ cartItems, onConfirm, onCancel, loading }) => {
    if (!cartItems || cartItems.length === 0) return null;
    const totalCost = cartItems.reduce((sum, item) => sum + item.coinPrice, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md text-gray-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <ShoppingCart className="mr-2" size={20} />
                    Xác Nhận Mua Giỏ Hàng
                </h3>
                <p className="mb-2">Bạn sắp dùng xu để mua {cartItems.length} chương:</p>
                <div className="max-h-32 overflow-y-auto bg-gray-100 p-2 rounded border mb-4">
                    <ul className="text-sm">
                        {cartItems.map(item => (
                            <li key={item.chapterId} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                                <span className="truncate flex-1 mr-2">{item.chapterTitle}</span>
                                <span className="font-medium text-orange-600">{item.coinPrice} xu</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="mb-6 text-lg">Tổng cộng: <span className="font-bold text-orange-500">{totalCost} xu</span></p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} disabled={loading} className="px-5 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                        Hủy
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="px-5 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center disabled:bg-green-700">
                        {loading && <Loader2 className="animate-spin mr-2" size={16}/>}
                        Xác nhận mua
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component Dialog xác nhận cuối cùng cho mua lẻ
const FinalConfirmDialog = ({ transactionDetails, onConfirm, onCancel, loading }) => {
    if (!transactionDetails) return null;
    const { chapters, totalCost } = transactionDetails;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md text-gray-800">
                <h3 className="text-xl font-semibold mb-4">Xác Nhận Thanh Toán</h3>
                <p className="mb-2">Bạn sắp dùng xu để mua {chapters.length} chương:</p>
                <div className="max-h-24 overflow-y-auto bg-gray-100 p-2 rounded border mb-4">
                    <ul className="text-sm list-disc list-inside">
                        {chapters.map(ch => <li key={ch.id} className="truncate">{ch.title}</li>)}
                    </ul>
                </div>
                <p className="mb-6 text-lg">Tổng cộng: <span className="font-bold text-orange-500">{totalCost} xu</span></p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} disabled={loading} className="px-5 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                        Hủy
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="px-5 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center disabled:bg-green-700">
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

  // Lấy state mới từ Redux
  const { currentUser } = useSelector((state) => state.user);
  const { createStatus, confirmStatus, pendingTransaction, createError } = useSelector((state) => state.transaction);
    const { currentNovel } = useSelector((state) => state.novels);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [cart, setCart] = useState(getCartFromStorage());
  const [downloadingChapterId, setDownloadingChapterId] = useState(null); 
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
      setShowConfirmDialog(true);
    }
    if (createStatus === 'failed' && createError) {
      toast.error(`Lỗi tạo giao dịch: ${createError}`);
      dispatch(resetTransactionState());
    }
  }, [createStatus, pendingTransaction, createError, dispatch]);

  // Cập nhật cart từ storage
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(getCartFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleChapterClick = (chapter) => {
    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapter.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để đọc chương này.");
      return;
    }
    
    // Logic click bình thường cho user đã đăng nhập
    navigate(`/novel/${novelId}/chapter/${chapter.idChapter}`);
  };

  const handleAddToCart = (chapter) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return;
    }

    // Kiểm tra nếu chapter yêu cầu đăng nhập
    if (chapter.isLoginRequired) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return;
    }

    const isPurchased = currentUser?.chapterBought?.includes(chapter.idChapter);
    if (isPurchased) {
      toast.info("Bạn đã sở hữu chương này.");
      return;
    }

    const success = addToCart(chapter, novelId);
    if (success) {
      setCart(getCartFromStorage());
      toast.success(`Đã thêm "${chapter.titleChapter}" vào giỏ hàng!`);
    } else {
      toast.info("Chương này đã có trong giỏ hàng.");
    }
  };

  const handlePurchaseCart = () => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để mua chương.");
      navigate('/login');
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

    const coinPrice = chapterToBuy.coinPrice || 0;
    if ((currentUser.coin || 0) < coinPrice) {
      toast.error("Số xu không đủ. Vui lòng nạp thêm!");
      navigate('/deposit');
      return;
    }
    
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
    dispatch(resetTransactionState());
  };

  return (
    <>
      {/* Header với thông tin giỏ hàng */}
      {cart.length > 0 && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg border border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-blue-200">
              <ShoppingCart className="mr-2" size={18} />
              <span className="text-sm">Giỏ hàng: {cart.length} chương</span>
              <span className="ml-2 text-orange-300 font-medium">
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
        {chapters.map((chapter, index) => {
          const chapterNumberDisplay = `Chương ${chapter.chapterNumber || (currentPage - 1) * chaptersPerPage + index + 1}`;
          const chapterTitle = chapter.titleChapter || "Chưa có tiêu đề";
          const isPurchased = currentUser?.chapterBought?.includes(chapter.idChapter);
          // Kiểm tra xem có đang tải chương này không
          const isDownloading = downloadingChapterId === chapter.idChapter;
          const coinPrice = chapter.coinPrice || 0; // Lấy giá từ API
          const isInCart = cart.some(item => item.chapterId === chapter.idChapter);
          // Kiểm tra xem chapter có yêu cầu đăng nhập không
          const requiresLogin = chapter.isLoginRequired || false;

          return (
            <li key={chapter.idChapter || `temp_${index}`} className="flex items-center justify-between border-b border-gray-700 py-1.5">
              <div className="flex items-center flex-grow min-w-0">
                <span className="w-20 md:w-24 flex-shrink-0 text-left mr-3 pl-2 text-gray-400">{chapterNumberDisplay}</span>
                {isPurchased ? (
                  <Link to={`/novel/${novelId}/chapter/${chapter.idChapter}`} className="flex-1 text-gray-200 hover:text-sky-400 truncate" title={chapterTitle}>
                    {chapterTitle}
                  </Link>
                ) : requiresLogin ? (
                  <button 
                    onClick={() => handleChapterClick(chapter)}
                    className="flex-1 text-gray-300 hover:text-yellow-400 truncate text-left cursor-pointer" 
                    title={`${chapterTitle} - Vui lòng đăng nhập để đọc`}
                  >
                    {chapterTitle} 🔒
                  </button>
                ) : (
                  <span className="flex-1 text-gray-300 truncate" title={chapterTitle}>{chapterTitle}</span>
                )}
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
                ) : isPurchased ? (
                  <button
                    onClick={() => handleDownload(chapter)}
                    disabled={isDownloading}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                    title={`Tải về chương ${chapterTitle}`}
                  >
                    {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                ) : (
                  <>
                    {/* Nút thêm vào giỏ hàng */}
                    <button
                      onClick={() => handleAddToCart(chapter)}
                      disabled={isInCart || createStatus === 'loading' || confirmStatus === 'loading'}
                      className={`px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 flex items-center ${
                        isInCart 
                          ? 'bg-blue-600 text-white cursor-not-allowed' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                      title={isInCart ? "Đã có trong giỏ" : "Thêm vào giỏ hàng"}
                    >
                      {isInCart ? <ShoppingCart size={14} /> : <Plus size={14} />}
                    </button>

                    {/* Nút mua ngay */}
                    <button
                      onClick={() => handlePurchaseClick(chapter)}
                      disabled={createStatus === 'loading' || confirmStatus === 'loading'}
                      className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                      title={`Mua ngay chương ${chapterTitle}`}
                    >
                      {coinPrice} xu
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
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
            />
          )}
        </>
      )}
    </>
  );
};

export default ChapterListDisplay;