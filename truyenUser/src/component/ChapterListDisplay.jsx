
import React, { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Loader2 ,Download } from 'lucide-react'; // Icon loading
import { refreshUser } from '../redux/userSlice';
import { getChapterContentById } from '../redux/chapterSlice'; 

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
    const { currentNovel } = useSelector((state) => state.novels);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const CHAPTER_PRICE = 3;
  const [downloadingChapterId, setDownloadingChapterId] = useState(null); 
  const handleDownload = async (chapter) => {
    if (!chapter || !chapter.idChapter) return;

    setDownloadingChapterId(chapter.idChapter); // Bật trạng thái loading
    
    try {
      // 1. Dispatch action để lấy nội dung chi tiết của chương
      const chapterContentResult = await dispatch(getChapterContentById({ 
          novelId: novelId, 
          chapterId: chapter.idChapter 
      })).unwrap();

      const content = chapterContentResult.contentChapter;
      if (!content) {
        throw new Error("Nội dung chương rỗng.");
      }

      // 2. Dọn dẹp và chuẩn bị nội dung file .txt
      const chapterText = content
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/ /g, " ")
        .replace(/<[^>]*>?/gm, '');

      const fileContent = [
        `Truyện: ${currentNovel?.nameNovel || 'Không rõ tên truyện'}`,
        `Chương: ${chapter.titleChapter}`,
        "====================================",
        "\n",
        chapterText,
        "\n\n",
        "------------------------------------",
        `Tải về từ [Tên Website Của Bạn]`
      ].join('\n');

      // 3. Tạo tên file và kích hoạt tải về
      const safeFileName = `${currentNovel?.nameNovel} - ${chapter.titleChapter}.txt`.replace(/[\\/:*?"<>|]/g, '-');
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Đã bắt đầu tải về chương!");

    } catch (err) {
      toast.error(`Lỗi khi tải chương: ${err.message || err}`);
    } finally {
      setDownloadingChapterId(null); // Tắt trạng thái loading
    }
  };
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

   const handleConfirmPurchase = async () => {
    if (!currentUser || !pendingTransaction) return;
    
    const confirmationData = {
      idUser: currentUser.idUser,
      listIdChapter: pendingTransaction.idChapters,
    };
    
    try {
      // BƯỚC 1: Chờ xác nhận giao dịch thành công
      const result = await dispatch(confirmTransactions(confirmationData)).unwrap();
      toast.success(result.message || "Mua chương thành công! Đang cập nhật dữ liệu...");

      // BƯỚC 2: Chờ refresh dữ liệu người dùng thành công
      await dispatch(refreshUser()).unwrap();
      toast.success("Đã lưu chương!");

      // BƯỚC 3: Sau khi mọi thứ đã xong, mới điều hướng
      const purchasedChapterId = pendingTransaction.idChapters[0];
      navigate(`/novel/${novelId}/chapter/${purchasedChapterId}`);

    } catch (error) {
      toast.error(`Giao dịch thất bại: ${error.message || error}`);
    } finally {
      // Luôn đóng dialog và reset state dù thành công hay thất bại
      setShowConfirmDialog(false);
      dispatch(resetTransactionState());
    }
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
          const isPurchased = currentUser?.chapterBought?.includes(chapter.idChapter);
          // Kiểm tra xem có đang tải chương này không
          const isDownloading = downloadingChapterId === chapter.idChapter;

          return (
            <li key={chapter.idChapter} className="flex items-center justify-between border-b border-gray-700 py-1.5">
              <div className="flex items-center flex-grow min-w-0">
                <span className="w-20 md:w-24 flex-shrink-0 text-left mr-3 pl-2 text-gray-400">{chapterNumberDisplay}</span>
                {isPurchased ? (
                  <Link to={`/novel/${novelId}/chapter/${chapter.idChapter}`} className="flex-1 text-gray-200 hover:text-sky-400 truncate" title={chapterTitle}>
                    {chapterTitle}
                  </Link>
                ) : (
                  <span className="flex-1 text-gray-300 truncate" title={chapterTitle}>{chapterTitle}</span>
                )}
              </div>

              {/* NÚT HÀNH ĐỘNG: MUA hoặc TẢI VỀ */}
              <div className="ml-3 flex-shrink-0">
                {isPurchased ? (
                  <button
                    onClick={() => handleDownload(chapter)}
                    disabled={isDownloading}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                    title={`Tải về chương ${chapterTitle}`}
                  >
                    {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchaseClick(chapter)}
                    disabled={createStatus === 'loading' || confirmStatus === 'loading'}
                    className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                    title={`Mua chương ${chapterTitle}`}
                  >
                    {CHAPTER_PRICE} xu
                  </button>
                )}
              </div>
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