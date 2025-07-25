import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getAllHistoryDeposit
} from '../redux/userSlice';

const TransactionManager = () => {
  const dispatch = useDispatch();
  const allHistoryDeposit = useSelector((state) => state.user.allHistoryDeposit) || [];
  const loading = useSelector((state) => state.user.loading);
  const error = useSelector((state) => state.user.error);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('SUCCESS');
  const [typeFilter, setTypeFilter] = useState('ALL'); // Bộ lọc loại giao dịch

  // Fetch history deposit when component mounts
  useEffect(() => {
    dispatch(getAllHistoryDeposit());
  }, [dispatch]);

  // Filter history deposits based on search term, type, and remove FAILED
  const filteredTransactions = allHistoryDeposit
    .filter(deposit => deposit.statusDeposit !== 'FAILED')
    .filter(deposit => {
      if (typeFilter === 'ALL') return true;
      return deposit.typeDeposit === typeFilter;
    })
    .filter(deposit => 
      deposit.userNameUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.emailUser?.toLowerCase().includes(searchTerm.toLowerCase())
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
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tất cả loại giao dịch</option>
            <option value="BUY_COIN">Nạp tiền</option>
            <option value="BUY_CHAPTER">Mua chương</option>
          </select>
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
              {paginatedTransactions.map((deposit) => (
                <tr key={deposit.idHistoryDeposit} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {deposit.avatarUser ? (
                          <img
                            src={deposit.avatarUser}
                            alt={deposit.userNameUser}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {deposit.userNameUser?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {deposit.userNameUser}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deposit.emailUser}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {deposit.typeDeposit || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {deposit.detail || 'Không có chi tiết'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {deposit.amountDeposit?.toLocaleString('vi-VN') || '0'} VNĐ
                    </div>
                    <div className="text-sm text-gray-500">
                      {deposit.coinDeposit?.toLocaleString() || '0'} Coin
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${deposit.statusDeposit === 'SUCCESS' ? 'bg-green-100 text-green-800' : 
                        deposit.statusDeposit === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {deposit.statusDeposit || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deposit.dateCreate ? formatDate(deposit.dateCreate) : 'N/A'}
                  </td>
                </tr>
              ))}
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

      {/* Statistics chia theo loại giao dịch */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nạp tiền */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-blue-600 mb-2">Nạp tiền </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Tổng số</div>
              <div className="text-2xl font-semibold text-gray-900">
                {allHistoryDeposit.filter(d => d.statusDeposit !== 'FAILED' && d.typeDeposit === 'BUY_COIN').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Thành công</div>
              <div className="text-2xl font-semibold text-green-600">
                {allHistoryDeposit.filter(d => d.statusDeposit === 'SUCCESS' && d.typeDeposit === 'BUY_COIN').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Đang xử lý</div>
              <div className="text-2xl font-semibold text-yellow-600">
                {allHistoryDeposit.filter(d => d.statusDeposit === 'PENDING' && d.typeDeposit === 'BUY_COIN').length}
              </div>
            </div>
          </div>
        </div>
        {/* Mua chương */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-purple-600 mb-2">Mua chương </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Tổng số</div>
              <div className="text-2xl font-semibold text-gray-900">
                {allHistoryDeposit.filter(d => d.statusDeposit !== 'FAILED' && d.typeDeposit === 'BUY_CHAPTER').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Thành công</div>
              <div className="text-2xl font-semibold text-green-600">
                {allHistoryDeposit.filter(d => d.statusDeposit === 'SUCCESS' && d.typeDeposit === 'BUY_CHAPTER').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Đang xử lý</div>
              <div className="text-2xl font-semibold text-yellow-600">
                {allHistoryDeposit.filter(d => d.statusDeposit === 'PENDING' && d.typeDeposit === 'BUY_CHAPTER').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;