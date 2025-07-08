// src/pages/DepositPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import DepositModal from '../DepositModal';
import { createPaymentTransaction, resetPaymentState } from '../../redux/paymentSlice';

const DepositPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector((state) => state.user);
  const { creationStatus, creationError, paymentUrl } = useSelector((state) => state.payment);

  const handleConfirmDeposit = (amount) => {
    if (!currentUser) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate('/login');
      return;
    }
    
    const payload = {
      idUser: currentUser.idUser,
      amount: amount,
      voucher: 0,
      orderInfo: `Nap ${amount.toLocaleString('vi-VN')} VND vao tai khoan ${currentUser.emailUser}`,
    };

    console.log("Dispatching createPaymentTransaction with payload:", payload);
    dispatch(createPaymentTransaction(payload));
  };
  
  useEffect(() => {
    if (creationStatus === 'succeeded' && paymentUrl) {
      toast.info("Đang chuyển hướng đến cổng thanh toán...");
      window.location.href = paymentUrl;
      dispatch(resetPaymentState());
    }

    if (creationStatus === 'failed' && creationError) {
      toast.error(`Không thể tạo giao dịch: ${creationError}`);
      dispatch(resetPaymentState());
    }
  }, [creationStatus, paymentUrl, creationError, dispatch]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate(-1); 
  };
  
  return (
    <div>
      <DepositModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onConfirm={handleConfirmDeposit}
        loading={creationStatus === 'loading'}
      />
    </div>
  );
};

export default DepositPage;