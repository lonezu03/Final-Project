
import React, { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react'; // Icon loading

// Import các action từ transactionSlice và userSlice
import { createTransaction, confirmTransactions, resetTransactionState } from '../redux/transactionSlice';
import { logoutUser, loginUserWithPassword } from '../redux/userSlice'; // Giả sử bạn có thông tin để login lại

// Component Dialog xác nhận cuối cùng
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
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const CHAPTER_PRICE = 3;

  // Effect để xử lý kết quả từ `createTransaction`
  useEffect(() => {
    if (createStatus === 'succeeded' && pendingTransaction) {
      setShowConfirmDialog(true);
    }
    if (createStatus === 'failed' && createError) {
      toast.error(`Lỗi: ${createError}`);
      dispatch(resetTransactionState());
    }
  }, [createStatus, pendingTransaction, createError, dispatch]);

  const handlePurchaseClick = (chapterToBuy) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để mua chương.");
      navigate('/login');
      return;
    }
     if ((currentUser.coin || 0) < CHAPTER_PRICE) {
      toast.error("Số xu không đủ. Vui lòng nạp thêm!");
      navigate('/deposit');
      return;
    }
    
    const transactionData = {
      idUser: currentUser.idUser,
      idChapters: [chapterToBuy.idChapter],
      amountCoin: CHAPTER_PRICE,
      typeTransaction: 'BUY',
      dateEndRent: null,
    };
    
    dispatch(createTransaction(transactionData));
  };

  const handleConfirmPurchase = () => {
    if (!currentUser || !pendingTransaction) return;
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: pendingTransaction.idChapters,
    };
    
    dispatch(confirmTransactions(confirmationData))
      .unwrap()
      .then((result) => {
        toast.success(result.message || "Mua chương thành công!");
        
        // Lấy ra chapterId vừa mua
        const purchasedChapterId = pendingTransaction.idChapters[0];
        
        // Đóng dialog và reset state
        setShowConfirmDialog(false);
        dispatch(resetTransactionState());

        // Điều hướng thẳng vào chương vừa mua
        navigate(`/novel/${novelId}/chapter/${purchasedChapterId}`);
      })
      .catch((err) => {
        toast.error(`Xác nhận thất bại: ${err}`);
      });
  };
  
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    dispatch(resetTransactionState());
  };

  return (
    <>
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
          
          const isPurchased = currentUser?.purchasedChapterIds?.includes(chapter.idChapter);

          return (
            <li key={chapter.idChapter} className="flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center flex-grow min-w-0">
                <span className="w-20 md:w-24 flex-shrink-0 text-left py-2.5 border-r border-gray-700 mr-3 pl-2 text-gray-400">{chapterNumberDisplay}</span>
                {isPurchased ? (
                  <Link to={`/novel/${novelId}/chapter/${chapter.idChapter}`} className="py-2.5 flex-1 text-gray-200 hover:text-sky-400 truncate" title={chapterTitle}>
                    {chapterTitle}
                  </Link>
                ) : (
                  <span className="py-2.5 flex-1 text-gray-300 truncate" title={chapterTitle}>{chapterTitle}</span>
                )}
              </div>

              {!isPurchased && (
                <button
                  onClick={() => handlePurchaseClick(chapter)}
                  disabled={createStatus === 'loading' || confirmStatus === 'loading'}
                  className="ml-3 px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex-shrink-0 my-1 disabled:opacity-50"
                  title={`Mua chương ${chapterTitle}`}
                >
                  {CHAPTER_PRICE} xu
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {showConfirmDialog && pendingTransaction && (
        <FinalConfirmDialog
          transactionDetails={{
              chapters: pendingTransaction.idChapters.map(id => ({ id, title: chapters.find(c => c.idChapter === id)?.titleChapter || `Chương ID: ${id}` })),
              totalCost: pendingTransaction.amountCoin,
          }}
          onConfirm={handleConfirmPurchase}
          onCancel={handleCancelConfirm}
          loading={confirmStatus === 'loading'}
        />
      )}
    </>
  );
};

export default ChapterListDisplay;