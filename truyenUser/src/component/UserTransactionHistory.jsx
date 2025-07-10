// src/components/UserTransactionHistory/UserTransactionHistory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCalendarAlt, FaFilter, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import Footer from "./Footer";
import Pagination from './paginationHistorydeposit'; // <<--- THÊM: Import component Pagination


// --- Helper Functions ---

const convertApiTimeToDate = (timeArray) => {
  if (!Array.isArray(timeArray) || timeArray.length < 3) return null;
  return new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3] || 0, timeArray[4] || 0, timeArray[5] || 0);
};

const formatDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Không rõ';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatCurrency = (amount, currency) => {
  const options = currency === 'VND' ? { style: 'currency', currency: 'VND' } : {};
  return new Intl.NumberFormat('vi-VN', options).format(amount) + (currency !== 'VND' ? ` ${currency}` : '');
};

const getTransactionInfo = (txn) => {
    switch (txn.typeDeposit?.toUpperCase()) {
        case 'BUY_COIN':
            return {
                typeText: 'Nạp tiền',
                amount: txn.amountDeposit || 0,
                currency: 'VND',
                isPositive: true,
            };
        case 'BUY_CHAPTER':
            return {
                typeText: 'Mua chương',
                amount: txn.coinDeposit || 0,
                currency: 'Coins',
                isPositive: false,
            };
        // Thêm các case khác nếu có (ví dụ: RÚT TIỀN, NÂNG CẤP VIP...)
        default:
            return {
                typeText: 'Không xác định',
                amount: txn.amountDeposit || txn.coinDeposit || 0,
                currency: '',
                isPositive: true,
            };
    }
};

const getStatusStyles = (status) => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return { icon: <FaCheckCircle className="text-green-500 mr-1.5" />, text: 'Thành công' };
    case 'FAILED':
      return { icon: <FaTimesCircle className="text-red-500 mr-1.5" />, text: 'Thất bại' };
    case 'PENDING':
      return { icon: <FaHourglassHalf className="text-yellow-500 mr-1.5 animate-spin" />, text: 'Đang xử lý' };
    default:
      return { icon: <FaInfoCircle className="text-gray-500 mr-1.5" />, text: 'Không rõ' };
  }
};


// --- Component Chính ---
const UserTransactionHistory = () => {

  const { currentUser, loading } = useSelector((state) => state.user);
  const [filterType, setFilterType] = useState('all');
 const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 15; // Số giao dịch trên mỗi trang
   const filteredTransactions = useMemo(() => {
    if (!currentUser || !Array.isArray(currentUser.historyDeposit)) return [];

    let transactions = currentUser.historyDeposit
        .map(txn => {
            const date = convertApiTimeToDate(txn.dateCreate || txn.dateUpdate);
            // Bỏ qua các giao dịch không có ngày tháng hợp lệ
            if (!date) return null;
            return {
                ...txn, // Giữ lại tất cả dữ liệu gốc
                jsDate: date, // Thêm trường date đã được chuyển đổi
            };
        })
        .filter(txn => txn !== null) // Loại bỏ các giao dịch không hợp lệ
        .sort((a, b) => b.jsDate.getTime() - a.jsDate.getTime()); // Sắp xếp mới nhất lên đầu

    // Lọc theo loại
    if (filterType === 'nap') {
      return transactions.filter(t => t.typeDeposit === 'BUY_COIN');
    }
    if (filterType === 'tieu') {
      return transactions.filter(t => t.typeDeposit === 'BUY_CHAPTER');
    }
    
    return transactions;

  }, [currentUser, filterType]);
  // --- THÊM: Logic phân trang ---
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển trang
  };

  // Reset về trang 1 khi bộ lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  // Xử lý và lọc dữ liệu bằng useMemo
 


  if (loading && !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin mr-3" size={32} />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
        <div className="text-center py-20 bg-gray-800 rounded-lg">
            <p>Vui lòng <Link to="/login" className="text-sky-400 hover:underline">đăng nhập</Link> để xem lịch sử.</p>
        </div>
    )
  }
return (
    // --- SỬA: Thay đổi background và layout chính ---
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-3 sm:mb-0">
              Lịch sử giao dịch
            </h1>
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
              >
                <option value="all">Tất cả</option>
                <option value="nap">Nạp Linh Thạch</option>
                <option value="tieu">Tiêu thụ Linh Thạch</option>
                <option value="rut">Rút tiền</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            {filteredTransactions.length} giao dịch được tìm thấy.
          </p>

          {currentTransactions.length === 0 && !loading ? (
            <div className="text-center py-16 text-gray-500">
              <BookX size={56} className="mx-auto text-gray-400" />
              <p className="mt-4 text-lg">Không có giao dịch nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Mô tả</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTransactions.map((txn) => {
                    const info = getTransactionInfo(txn);
                    const statusStyle = getStatusStyles(txn.statusDeposit);
                    const amountColor = info.isPositive ? 'text-green-600' : 'text-red-600';

                    return (
                      <tr key={txn.idHistoryDeposit} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          <FaCalendarAlt className="mr-2" />
                          {formatDate(txn.jsDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{info.typeText}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell max-w-sm truncate" title={txn.detail}>{txn.detail}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${amountColor}`}>
                          {(info.isPositive ? '+' : '-') + formatCurrency(info.amount, info.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bgClass}`}>
                            {statusStyle.icon}
                            {statusStyle.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="mt-6">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default UserTransactionHistory;