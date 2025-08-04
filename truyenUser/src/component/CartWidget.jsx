// src/component/CartWidget.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, X, Loader2, Trash2 } from 'lucide-react';
import { createTransaction, confirmTransactions, resetTransactionState, setShowConfirmDialog } from '../redux/transactionSlice';
import { refreshUser } from '../redux/userSlice';
import { useTheme } from '../context/ThemeContext';

// Utility functions cho giỏ hàng (giống ChapterListDisplay)
const getCartFromStorage = () => {
  const cart = sessionStorage.getItem('chapterCart');
  return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart) => {
  sessionStorage.setItem('chapterCart', JSON.stringify(cart));
};

const removeFromCart = (chapterId) => {
  const cart = getCartFromStorage();
  const newCart = cart.filter(item => item.chapterId !== chapterId);
  saveCartToStorage(newCart);
  return newCart;
};

const clearCart = () => {
  sessionStorage.removeItem('chapterCart');
};

const CartWidget = ({ novelTitle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const { currentUser } = useSelector((state) => state.user);
  const { createStatus, confirmStatus, pendingTransaction, createError, showConfirmDialog: globalShowConfirmDialog } = useSelector((state) => state.transaction);
  
  const [cart, setCart] = useState(getCartFromStorage());
  const [showCart, setShowCart] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCartTransaction, setIsCartTransaction] = useState(false); // Flag để track transaction từ cart

  // Cập nhật cart từ storage
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(getCartFromStorage());
    };
    
    // Lắng nghe thay đổi từ sessionStorage
    const interval = setInterval(() => {
      const currentCart = getCartFromStorage();
      if (JSON.stringify(currentCart) !== JSON.stringify(cart)) {
        setCart(currentCart);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cart]);

  // Effect để xử lý kết quả từ createTransaction - sử dụng global dialog state
  useEffect(() => {
    // Sử dụng global dialog state và check nếu transaction từ cart
    if (globalShowConfirmDialog && pendingTransaction && isCartTransaction) {
      setShowConfirmDialog(true);
    }
    if (createStatus === 'failed' && createError) {
      toast.error(`Lỗi tạo giao dịch: ${createError}`);
      dispatch(resetTransactionState());
      setIsCartTransaction(false); // Reset flag
    }
  }, [createStatus, pendingTransaction, createError, dispatch, isCartTransaction, globalShowConfirmDialog]);

  const handleRemoveFromCart = (chapterId) => {
    const newCart = removeFromCart(chapterId);
    setCart(newCart);
    toast.success("Đã xóa chương khỏi giỏ hàng");
  };

  const handleClearCart = () => {
    clearCart();
    setCart([]);
    toast.success("Đã xóa tất cả chương khỏi giỏ hàng");
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

    // Tạo chapterAndPrice array từ cart để hỗ trợ nhiều truyện
    const chapterAndPrice = cart.map(item => ({
      idChapter: item.chapterId,
      coin: item.coinPrice
    }));

    const transactionData = {
      idUser: currentUser.idUser,
      chapterAndPrice: chapterAndPrice,
      dateEndRent: null,
      typeTransaction: 'BUY'
    };
    
    console.log('🛒 [CartWidget] Tạo giao dịch giỏ hàng với data:', transactionData);
    setIsCartTransaction(true); // Đánh dấu transaction từ cart
    dispatch(createTransaction(transactionData));
  };

  const handleConfirmPurchase = async () => {
    if (!currentUser || !pendingTransaction) return;
    
    // Lấy danh sách chapter IDs từ chapterAndPrice
    const listIdChapter = pendingTransaction.chapterAndPrice.map(item => item.idChapter);
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: listIdChapter,
    };
    
    console.log('Xác nhận giao dịch giỏ hàng:', confirmationData);
    
    try {
      await dispatch(confirmTransactions(confirmationData)).unwrap();
      toast.success("Mua chương thành công!");

      await dispatch(refreshUser()).unwrap();
      
      // Xóa tất cả chương đã mua khỏi giỏ hàng
      clearCart();
      setCart([]);
      
      toast.success("Cập nhật dữ liệu thành công!");

    } catch (error) {
      console.error('Lỗi xác nhận giao dịch:', error);
      toast.error(`Giao dịch thất bại: ${error.message || error}`);
    } finally {
      setShowConfirmDialog(false);
      setShowCart(false);
      setIsCartTransaction(false); // Reset flag
      dispatch(setShowConfirmDialog(false)); // Đóng global dialog
      dispatch(resetTransactionState());
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setIsCartTransaction(false); // Reset flag
    dispatch(setShowConfirmDialog(false)); // Đóng global dialog
    dispatch(resetTransactionState());
  };

  const totalItems = cart.length;
  const totalCost = cart.reduce((sum, item) => sum + item.coinPrice, 0);
  
  // Đếm số truyện khác nhau trong giỏ hàng
  const uniqueNovels = [...new Set(cart.map(item => item.novelId))];
  const novelCount = uniqueNovels.length;

  if (totalItems === 0) {
    return (
      <div className={`p-4 rounded-lg shadow-lg mb-6 transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 border border-gray-600' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 flex items-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          <ShoppingCart className="mr-2" size={20} />
          Giỏ Hàng Truyện
        </h3>
        <p className={`text-sm text-center py-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Chưa có chương nào trong giỏ hàng
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`p-4 rounded-lg shadow-lg mb-6 transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 border border-gray-600' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 flex items-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          <ShoppingCart className="mr-2" size={20} />
          Giỏ Hàng ({totalItems})
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <span className="font-medium">Số truyện:</span> {novelCount}
          </div>
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <span className="font-medium">Số chương:</span> {totalItems}
          </div>
          <div className={`text-sm font-semibold ${
            isDarkMode ? 'text-orange-400' : 'text-orange-600'
          }`}>
            <span>Tổng tiền:</span> {totalCost} xu
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowCart(true)}
            className={`w-full px-3 py-2 text-sm rounded transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Xem chi tiết
          </button>
          <button
            onClick={handlePurchaseCart}
            disabled={createStatus === 'loading' || confirmStatus === 'loading'}
            className={`w-full px-3 py-2 text-sm rounded transition-colors disabled:opacity-50 flex items-center justify-center ${
              isDarkMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {createStatus === 'loading' ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <ShoppingCart className="mr-2" size={16} />
            )}
            Mua tất cả
          </button>
        </div>
      </div>

      {/* Chi tiết giỏ hàng Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className={`rounded-lg shadow-xl p-6 w-11/12 max-w-md max-h-[80vh] overflow-hidden flex flex-col transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200' 
              : 'bg-white text-gray-800'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <ShoppingCart className="mr-2" size={20} />
                Chi Tiết Giỏ Hàng
              </h3>
              <button 
                onClick={() => setShowCart(false)} 
                className={`transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.chapterId} className={`flex justify-between items-center p-2 rounded transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border border-gray-600' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>{item.chapterTitle}</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {item.novelTitle || 'Chưa rõ truyện'} • {item.coinPrice} xu
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.chapterId)}
                      className={`ml-2 transition-colors ${
                        isDarkMode 
                          ? 'text-red-400 hover:text-red-300' 
                          : 'text-red-500 hover:text-red-700'
                      }`}
                      title="Xóa khỏi giỏ hàng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border-t pt-4 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>Tổng cộng:</span>
                <span className={`font-bold ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>{totalCost} xu</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleClearCart}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                    isDarkMode 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={handlePurchaseCart}
                  disabled={createStatus === 'loading'}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors disabled:opacity-50 flex items-center justify-center ${
                    isDarkMode 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {createStatus === 'loading' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Mua ngay'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog xác nhận mua - Chỉ hiển thị khi transaction từ cart */}
      {showConfirmDialog && pendingTransaction && isCartTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className={`rounded-lg shadow-xl p-6 w-11/12 max-w-md transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200' 
              : 'bg-white text-gray-800'
          }`}>
            <h3 className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Xác Nhận Mua Giỏ Hàng</h3>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Bạn sắp dùng <span className={`font-bold ${
                isDarkMode ? 'text-orange-400' : 'text-orange-500'
              }`}>{pendingTransaction.chapterAndPrice.reduce((sum, item) => sum + item.coin, 0)} xu</span> để mua {pendingTransaction.chapterAndPrice.length} chương từ {[...new Set(pendingTransaction.chapterAndPrice.map(item => cart.find(c => c.chapterId === item.idChapter)?.novelId).filter(Boolean))].length} truyện.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={handleCancelConfirm} 
                disabled={confirmStatus === 'loading'}
                className={`px-5 py-2 rounded-md transition-colors disabled:opacity-50 ${
                  isDarkMode 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmPurchase} 
                disabled={confirmStatus === 'loading'}
                className={`px-5 py-2 rounded-md text-white flex items-center transition-colors ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800' 
                    : 'bg-green-500 hover:bg-green-600 disabled:bg-green-700'
                }`}
              >
                {confirmStatus === 'loading' && <Loader2 className="animate-spin mr-2" size={16}/>}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartWidget;
