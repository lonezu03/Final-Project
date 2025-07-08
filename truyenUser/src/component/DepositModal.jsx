// src/components/DepositModal.jsx

import React, { useState } from 'react';
import { X, CreditCard, Gamepad2, ChevronRight, PartyPopper, ArrowLeft } from 'lucide-react';

// --- Sub-components ---

const BulletPoint = ({ children }) => (
  <li className="flex items-start">
    <ChevronRight className="text-orange-500 mr-2 mt-1 flex-shrink-0" size={16} />
    {children}
  </li>
);

// Mảng các gói nạp tiền
const depositOptions = [
  { amount: 10000, label: '10,000' },
  { amount: 20000, label: '20,000' },
  { amount: 50000, label: '50,000' },
  { amount: 100000, label: '100,000' },
  { amount: 200000, label: '200,000' },
  { amount: 500000, label: '500,000' },
];

// --- Main Component ---

const DepositModal = ({ isOpen, onClose, onConfirm, loading }) => {
  // State để quản lý bước hiện tại: 'method' (chọn phương thức) hoặc 'amount' (chọn số tiền)
  const [step, setStep] = useState('method');
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!isOpen) return null;
  
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setStep('amount'); // Chuyển sang bước chọn số tiền
  };

  const handleBack = () => {
    setStep('method'); // Quay lại bước chọn phương thức
    setSelectedMethod(null);
  };
  
  const handleClose = () => {
    setStep('method'); // Reset về bước đầu khi đóng
    setSelectedMethod(null);
    onClose();
  };

  // --- Render cho Bước 1: Chọn Phương thức ---
  const renderMethodStep = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Chọn Phương Thức Nạp Tiền</h2>
      <div className="bg-amber-50 p-4 rounded-md mb-6 text-sm text-gray-700">
        {/* ... Phần lưu ý giữ nguyên ... */}
        <p className="font-semibold mb-2">Vui lòng đọc kỹ nội dung bên dưới trước khi mua:</p>
        <ul className="space-y-1 list-none">
          <BulletPoint>Là đơn vị tiền ảo chỉ lưu hành trong hệ thống</BulletPoint>
          {/* ... các bullet point khác */}
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Phương thức 1: ZaloPay/Thẻ ngân hàng */}
        <button
          className="bg-amber-50 hover:bg-amber-100 border border-gray-300 p-6 rounded-lg text-center transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
          onClick={() => handleMethodSelect('ZALOPAY')} // Giả sử đây là ZaloPay
        >
          {/* Icons ví dụ */}
          <div className="flex items-center justify-center space-x-3 mb-3">
             <img src="https://seeklogo.com/images/Z/zalo-pay-logo-B61CE1F3E3-seeklogo.com.png" alt="ZaloPay" className="h-9"/>
             <CreditCard className="text-blue-800" size={36} />
          </div>
          <p className="font-semibold text-gray-800">Thanh toán qua ZaloPay, Thẻ Ngân Hàng</p>
          <p className="text-xs text-gray-600 mt-1">An toàn, nhanh chóng, tiện lợi</p>
        </button>

        {/* Phương thức 2: Thẻ cào */}
        <button
          className="bg-amber-50 hover:bg-amber-100 border border-gray-300 p-6 rounded-lg text-center transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
          onClick={() => handleMethodSelect('CARD')} // Tạm thời, sau này có thể dẫn đến trang khác
        >
          {/* Icons ví dụ */}
          <div className="flex items-center justify-center space-x-2 mb-3 h-[36px]">
            <Gamepad2 className="text-green-600" size={36} />
          </div>
          <p className="font-semibold text-gray-800">Thanh toán qua thẻ cào điện thoại, thẻ game</p>
          <p className="text-xs text-gray-600 mt-1">Nhiều mệnh giá, dễ dàng thực hiện</p>
        </button>
      </div>
    </>
  );

  // --- Render cho Bước 2: Chọn Số tiền ---
  const renderAmountStep = () => (
    <>
      <div className="flex items-center mb-6">
        <button onClick={handleBack} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 mr-3">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Chọn Mệnh Giá Nạp</h2>
      </div>
       <p className="text-gray-500 mb-6">
          Bạn đã chọn phương thức: 
          <span className="font-semibold text-gray-700">
            {selectedMethod === 'ZALOPAY' ? ' ZaloPay/Thẻ Ngân Hàng' : ' Thẻ cào/Thẻ Game'}
          </span>.
        </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {depositOptions.map((option) => (
          <button
            key={option.amount}
            onClick={() => onConfirm(option.amount)}
            disabled={loading}
            className="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg text-center font-semibold text-lg hover:bg-sky-600 dark:hover:bg-sky-600 text-gray-800 dark:text-white transition-colors disabled:bg-slate-900 disabled:text-gray-500 disabled:cursor-wait"
          >
            {option.label}
            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">VNĐ</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative transition-all duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          aria-label="Đóng"
        >
          <X size={24} />
        </button>

        {step === 'method' ? renderMethodStep() : renderAmountStep()}

        <div className="bg-yellow-500 text-white p-3 rounded-md text-center text-sm font-medium flex items-center justify-center mt-6">
          <PartyPopper className="mr-2" size={20} />
          Lưu ý không đổi ngược lại thành Kẹo được
        </div>
      </div>
    </div>
  );
};

export default DepositModal;