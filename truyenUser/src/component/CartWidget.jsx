// src/component/CartWidget.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, X, Loader2, Trash2 } from 'lucide-react';
import { createTransaction, confirmTransactions, resetTransactionState } from '../redux/transactionSlice';
import { refreshUser } from '../redux/userSlice';

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
  
  const { currentUser } = useSelector((state) => state.user);
  const { createStatus, confirmStatus, pendingTransaction, createError } = useSelector((state) => state.transaction);
  
  const [cart, setCart] = useState(getCartFromStorage());
  const [showCart, setShowCart] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // Effect để xử lý kết quả từ createTransaction
  useEffect(() => {
    if (createStatus === 'succeeded' && pendingTransaction) {
      setShowConfirmDialog(true);
    }
    if (createStatus === 'failed' && createError) {
      toast.error(`Lỗi tạo giao dịch: ${createError}`);
      dispatch(resetTransactionState());
    }
  }, [createStatus, pendingTransaction, createError, dispatch]);

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

    const transactionData = {
      idUser: currentUser.idUser,
      idChapters: cart.map(item => item.chapterId),
      amountCoin: totalCost,
      typeTransaction: 'BUY',
      dateEndRent: null,
    };
    
    console.log('Tạo giao dịch giỏ hàng với data:', transactionData);
    dispatch(createTransaction(transactionData));
  };

  const handleConfirmPurchase = async () => {
    if (!currentUser || !pendingTransaction) return;
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: pendingTransaction.idChapters,
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
      dispatch(resetTransactionState());
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    dispatch(resetTransactionState());
  };

  const totalItems = cart.length;
  const totalCost = cart.reduce((sum, item) => sum + item.coinPrice, 0);

  if (totalItems === 0) {
    return (
      <div className="bg-[#2d3038] p-4 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
          <ShoppingCart className="mr-2" size={20} />
          Giỏ Hàng Truyện
        </h3>
        <p className="text-gray-400 text-sm text-center py-4">
          Chưa có chương nào trong giỏ hàng
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#2d3038] p-4 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
          <ShoppingCart className="mr-2" size={20} />
          Giỏ Hàng ({totalItems})
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="text-sm text-gray-300">
            <span className="font-medium">Truyện:</span> {novelTitle}
          </div>
          <div className="text-sm text-gray-300">
            <span className="font-medium">Số chương:</span> {totalItems}
          </div>
          <div className="text-sm text-orange-400 font-semibold">
            <span>Tổng tiền:</span> {totalCost} xu
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowCart(true)}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Xem chi tiết
          </button>
          <button
            onClick={handlePurchaseCart}
            disabled={createStatus === 'loading' || confirmStatus === 'loading'}
            className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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
          <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md text-gray-800 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <ShoppingCart className="mr-2" size={20} />
                Chi Tiết Giỏ Hàng
              </h3>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.chapterId} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.chapterTitle}</div>
                      <div className="text-xs text-gray-500">{item.coinPrice} xu</div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.chapterId)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      title="Xóa khỏi giỏ hàng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="font-bold text-orange-600">{totalCost} xu</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleClearCart}
                  className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={handlePurchaseCart}
                  disabled={createStatus === 'loading'}
                  className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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

      {/* Dialog xác nhận mua */}
      {showConfirmDialog && pendingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md text-gray-800">
            <h3 className="text-xl font-semibold mb-4">Xác Nhận Mua Giỏ Hàng</h3>
            <p className="mb-4">
              Bạn sắp dùng <span className="font-bold text-orange-500">{pendingTransaction.amountCoin} xu</span> để mua {pendingTransaction.idChapters.length} chương.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={handleCancelConfirm} 
                disabled={confirmStatus === 'loading'}
                className="px-5 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmPurchase} 
                disabled={confirmStatus === 'loading'}
                className="px-5 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center disabled:bg-green-700"
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
