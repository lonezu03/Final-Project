import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CircleCheck, CircleX, Loader2, Home } from 'lucide-react';
import apiClient from '../services/api'; // Giả sử bạn có apiClient để gọi API xác thực

const PaymentCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  // State để quản lý trạng thái của trang: 'verifying', 'success', 'failed'
  const [status, setStatus] = useState('verifying'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionInfo, setTransactionInfo] = useState(null);

  useEffect(() => {
    // Lấy các query parameters từ URL mà cổng thanh toán trả về
    const queryParams = new URLSearchParams(location.search);
    
    // Lấy các tham số cần thiết từ URL
    const idHistoryDeposit = queryParams.get('idHistoryDeposit');
    const amount = queryParams.get('amount');
    const statusParam = queryParams.get('status');
    const appTransId = queryParams.get('apptransid');
    // Lấy tất cả các tham số khác nếu cần
    const allParams = Object.fromEntries(queryParams.entries());

    const verifyPayment = async () => {
      // Kiểm tra xem có phải là một callback hợp lệ không
      if (!idHistoryDeposit || !statusParam) {
        setErrorMessage('Dữ liệu callback không hợp lệ. Giao dịch có thể đã bị hủy.');
        setStatus('failed');
        return;
      }
      
      try {
        // Gửi toàn bộ query string hoặc một object chứa các tham số về backend để xác thực
        console.log('Đang gửi dữ liệu xác thực về backend:', allParams);
        
        // Giả sử bạn có endpoint POST /payment/verify-callback
        const response = await apiClient.post('/payment/verify-callback', allParams);
        
        // Backend trả về kết quả xác thực
        if (response.data && response.data.status === 'success') {
          // Giao dịch thành công ở phía backend
          setStatus('success');
          setTransactionInfo({
            amount: response.data.amount, // Lấy số tiền từ response của backend cho an toàn
            transactionId: response.data.transactionId,
          });
          // Cập nhật lại thông tin người dùng (ví dụ: số dư)
          if(currentUser?.idUser) {
            dispatch(getCurrentUser(currentUser.idUser)); // Giả sử bạn có action này
          }
        } else {
          // Giao dịch thất bại ở phía backend
          setErrorMessage(response.data?.message || 'Xác thực giao dịch thất bại tại máy chủ.');
          setStatus('failed');
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Lỗi hệ thống. Không thể xác thực giao dịch.');
        setStatus('failed');
      }
    };
    
    verifyPayment();
  }, [location, dispatch, currentUser]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center text-gray-300">
            <Loader2 size={64} className="mx-auto animate-spin text-sky-400 mb-6" />
            <h1 className="text-2xl font-bold">Đang xác thực giao dịch...</h1>
            <p className="mt-2 text-gray-400">Vui lòng không đóng hoặc tải lại trang này.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center text-white">
            <CircleCheck size={80} className="mx-auto text-green-400 mb-6" />
            <h1 className="text-3xl font-bold">Thanh toán thành công!</h1>
            <p className="mt-2 text-lg text-gray-300">Cảm ơn bạn đã nạp tiền vào hệ thống.</p>
            {transactionInfo && (
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg text-left max-w-sm mx-auto">
                <p className="flex justify-between">
                  <span className="text-gray-400">Số tiền:</span> 
                  <span className="font-semibold text-yellow-400">
                    {(transactionInfo.amount / 100).toLocaleString('vi-VN')} VNĐ
                  </span>
                </p>
                <p className="flex justify-between mt-2">
                  <span className="text-gray-400">Mã giao dịch:</span> 
                  <span className="font-semibold">{transactionInfo.transactionId}</span>
                </p>
              </div>
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="text-center text-white">
            <CircleX size={80} className="mx-auto text-red-500 mb-6" />
            <h1 className="text-3xl font-bold">Thanh toán thất bại</h1>
            <p className="mt-2 text-lg text-gray-300">Đã có lỗi xảy ra trong quá trình xử lý.</p>
            <p className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-md text-sm">
              Lý do: {errorMessage || 'Không xác định.'}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8 sm:p-12">
        {renderContent()}
        <div className="mt-10 text-center">
          <Link 
            to={status === 'success' ? '/profile/wallet' : '/pricing'} 
            className="inline-flex items-center bg-sky-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Home size={20} className="mr-2" />
            {status === 'success' ? 'Về trang cá nhân' : 'Thử lại'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
