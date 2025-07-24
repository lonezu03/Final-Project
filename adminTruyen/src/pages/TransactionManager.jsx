import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getAllTransactions,
  selectTransactions,
  selectTransactionLoading,
  selectTransactionError
} from '../redux/transactionSlice';

const TransactionManager = () => {
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const loading = useSelector(selectTransactionLoading);
  const error = useSelector(selectTransactionError);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('SUCCESS');

  // Fetch transactions when component mounts or status filter changes
  useEffect(() => {
    dispatch(getAllTransactions('SUCCESS'));
  }, [dispatch]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => 
    transaction.user.userNameUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.user.emailUser?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset page when searching or changing status
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Status options for filter
  // const statusOptions = ['ALL', 'PENDING', 'SUCCESS', 'FAILED'];

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Đang tải danh sách giao dịch...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý giao dịch</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          ❌ {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-4">
          <select
            value={transactionsPerPage}
            onChange={(e) => {
              setTransactionsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[5, 10, 20, 50].map(num => (
              <option key={num} value={num}>{num} / trang</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin giao dịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.map((transaction) => {
                const deposit = transaction.user.historyDeposit && transaction.user.historyDeposit.length > 0
                  ? transaction.user.historyDeposit[0]
                  : null;
                return (
                  <tr key={transaction.user.idUser} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                          {transaction.user.avatarUser ? (
                            <img
                              src={transaction.user.avatarUser}
                              alt={transaction.user.userNameUser}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {transaction.user.userNameUser?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.user.userNameUser}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.user.emailUser}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {deposit?.typeDeposit || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {deposit?.detail || 'Không có chi tiết'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {deposit?.amountDeposit?.toLocaleString('vi-VN') || '0'} VNĐ
                      </div>
                      <div className="text-sm text-gray-500">
                        {deposit?.coinDeposit?.toLocaleString() || '0'} Coin
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${deposit?.statusDeposit === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {deposit?.statusDeposit || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit?.dateCreate ? formatDate(deposit.dateCreate) : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy giao dịch nào phù hợp.' : 'Chưa có giao dịch nào.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} của {filteredTransactions.length} giao dịch
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(curr => Math.max(1, curr - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(curr => Math.min(totalPages, curr + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-md text-sm ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Tổng số giao dịch</h3>
          <p className="text-2xl font-semibold text-gray-900">{transactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Giao dịch thành công</h3>
          <p className="text-2xl font-semibold text-green-600">
            {transactions.filter(t => Array.isArray(t.user.historyDeposit) && t.user.historyDeposit.length > 0 && t.user.historyDeposit[0]?.statusDeposit === 'SUCCESS').length}
          </p>
        </div>
        {/* <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Đang xử lý</h3>
          <p className="text-2xl font-semibold text-yellow-600">
            {transactions.filter(t => t.user.historyDeposit[0]?.statusDeposit === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Giao dịch thất bại</h3>
          <p className="text-2xl font-semibold text-red-600">
            {transactions.filter(t => t.user.historyDeposit[0]?.statusDeposit === 'FAILED').length}
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default TransactionManager;