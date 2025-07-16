// src/pages/PaymentCallbackPage.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleCheck, Home } from 'lucide-react';
import { refreshUser } from '../redux/userSlice'; // Sửa import
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

const PaymentCallbackPage = () => {
  const location = useLocation();

  // Lấy các thông tin từ URL để hiển thị lại cho người dùng
  const queryParams = new URLSearchParams(location.search);
  const amount = queryParams.get('amount') || '0'; // Lấy số tiền
  const transactionId = queryParams.get('vnp_TxnRef') || queryParams.get('apptransid') || 'Không có'; // Lấy mã giao dịch

  const dispatch = useDispatch();

  // useEffect(() => {
  //   dispatch(refreshUser());
  // }, [dispatch]);
  return (
    // --- Giao diện nền sáng ---
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
        
        {/* Icon và Tiêu đề */}
        <CircleCheck size={80} className="mx-auto text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-800">Thanh toán thành công!</h1>
        <p className="mt-2 text-lg text-gray-600">Cảm ơn bạn đã nạp tiền vào hệ thống.</p>
        <p className="mt-1 text-sm text-gray-500">Số dư sẽ được cập nhật sau vài phút.</p>

        {/* Khung thông tin giao dịch */}
        {/* <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left max-w-sm mx-auto space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Số tiền:</span> 
            <span className="font-semibold text-gray-800">
              {parseInt(amount).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mã giao dịch:</span> 
            <span className="font-semibold text-gray-800 break-all">{transactionId}</span>
          </div>
        </div> */}

        {/* Nút hành động */}
        <div className="mt-10">
          <Link 
            to="/" // Chuyển hướng về trang chủ
            className="inline-flex items-center bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Home size={20} className="mr-2" />
            Quay về Trang Chủ
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentCallbackPage;