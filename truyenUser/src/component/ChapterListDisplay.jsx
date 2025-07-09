
import React, { useState } from 'react';
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

  // Lấy state cần thiết từ Redux
  const { currentUser } = useSelector((state) => state.user);
  const { status, error, lastTransaction } = useSelector((state) => state.transaction);
  
  // State cục bộ để quản lý dialog xác nhận
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  const CHAPTER_PRICE = 3; // Giá mỗi chương

  // Hàm xử lý khi người dùng click nút mua
  const handlePurchaseClick = (chapterToBuy) => {
    if (!currentUser) {
      toast.info("Vui lòng đăng nhập để mua chương.");
      navigate('/login');
      return;
    }
    
    // Dispatch action createTransaction
    const transactionData = {
      idUser: currentUser.idUser,
      idChapters: [chapterToBuy.idChapter],
      amountCoin: CHAPTER_PRICE,
      typeTransaction: 'BUY',
      dateEndRent: null,
    };
    
    dispatch(createTransaction(transactionData))
      .unwrap()
      .then((result) => {
        // Khi createTransaction thành công (pending trên server)
        // Lưu thông tin để hiển thị trên dialog xác nhận
        setTransactionDetails({
            chapters: [{ id: chapterToBuy.idChapter, title: chapterToBuy.titleChapter }],
            totalCost: CHAPTER_PRICE,
        });
        setShowConfirmDialog(true);
      })
      .catch((err) => {
        toast.error(`Lỗi tạo giao dịch: ${err}`);
      });
  };

  // Hàm xử lý khi người dùng xác nhận mua trên dialog
  const handleConfirmPurchase = () => {
    if (!currentUser || !transactionDetails) return;
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: transactionDetails.chapters.map(ch => ch.id),
    };
    
    dispatch(confirmTransactions(confirmationData))
      .unwrap()
      .then(async () => {
        toast.success("Mua chương thành công! Đang làm mới phiên đăng nhập...");
        setShowConfirmDialog(false);
        setTransactionDetails(null);
        
        // YÊU CẦU: Đăng xuất và đăng nhập lại
        const userCredentials = {
            emailUser: localStorage.getItem('userEmail'), // Cần lưu email/pass an toàn hơn
            passwordUser: localStorage.getItem('userPassword'), 
        };

        if(userCredentials.emailUser && userCredentials.passwordUser) {
            dispatch(logoutUser());
            // Đợi một chút để đảm bảo state đã được xóa
            await new Promise(resolve => setTimeout(resolve, 50)); 
            dispatch(loginUserWithPassword(userCredentials));
        } else {
            // Nếu không có thông tin đăng nhập, chỉ đăng xuất và yêu cầu đăng nhập lại
            dispatch(logoutUser());
            navigate('/login');
        }
      })
      .catch((err) => {
        toast.error(`Xác nhận thất bại: ${err}`);
      });
  };
  
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setTransactionDetails(null);
    dispatch(resetTransactionState()); // Reset trạng thái transaction
  };

  // ... (Phần render JSX bên dưới không thay đổi nhiều)

  return (
    <>
      {/* Màn hình loading che phủ khi đang tạo giao dịch */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-[9998]">
            <Loader2 className="animate-spin text-white" size={48} />
            <p className="text-white mt-4">Đang tạo giao dịch...</p>
        </div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm">
        {chapters.map((chapter, index) => {
          const chapterNumberDisplay = `Chương ${chapter.chapterNumber || (currentPage - 1) * chaptersPerPage + index + 1}`;
          const chapterTitle = chapter.titleChapter || "Chưa có tiêu đề";
          
          // Logic kiểm tra đã mua hay chưa bây giờ phải dựa vào currentUser.purchasedChapterIds (từ API login)
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
                  disabled={status === 'loading'}
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

      {/* Dialog xác nhận cuối cùng */}
      {showConfirmDialog && (
        <FinalConfirmDialog
          transactionDetails={transactionDetails}
          onConfirm={handleConfirmPurchase}
          onCancel={handleCancelConfirm}
          loading={status === 'loading'}
        />
      )}
    </>
  );
};

export default ChapterListDisplay;