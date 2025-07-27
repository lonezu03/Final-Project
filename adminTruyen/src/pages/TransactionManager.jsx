import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllHistoryDeposit } from '../redux/userSlice';
import { useTheme } from '../context/ThemeContext';
import { CreditCard, Search, Filter, Calendar, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

const TransactionManager = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300 flex justify-center items-center">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-8">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Đang tải danh sách giao dịch...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Quản Lý Giao Dịch
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Theo dõi và quản lý các giao dịch của người dùng</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-red-700 dark:text-red-300 font-medium">❌ {error}</span>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500"
              />
              <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
            </div>
            <div className="flex items-center gap-4">
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
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
                className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
              >
                {[5, 10, 20, 50].map(num => (
                  <option key={num} value={num}>{num} / trang</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-700/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thông tin giao dịch</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Số tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {paginatedTransactions.map((deposit) => (
                  <tr key={deposit.idHistoryDeposit} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center overflow-hidden ring-2 ring-slate-200 dark:ring-slate-600">
                          {deposit.avatarUser ? (
                            <img
                              src={deposit.avatarUser}
                              alt={deposit.userNameUser}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {deposit.userNameUser?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {deposit.userNameUser}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {deposit.emailUser}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          deposit.typeDeposit === 'BUY_COIN' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {deposit.typeDeposit === 'BUY_COIN' ? <DollarSign size={12} /> : <CreditCard size={12} />}
                          {deposit.typeDeposit || 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {deposit.detail || 'Không có chi tiết'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {deposit.amountDeposit?.toLocaleString('vi-VN') || '0'} VNĐ
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {deposit.coinDeposit?.toLocaleString() || '0'} Coin
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${
                        deposit.statusDeposit === 'SUCCESS' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : deposit.statusDeposit === 'PENDING' 
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          deposit.statusDeposit === 'SUCCESS' ? 'bg-green-500' 
                          : deposit.statusDeposit === 'PENDING' ? 'bg-yellow-500' 
                          : 'bg-red-500'
                        }`}></div>
                        {deposit.statusDeposit || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {deposit.dateCreate ? formatDate(deposit.dateCreate) : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedTransactions.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {searchTerm ? 'Không tìm thấy giao dịch nào phù hợp.' : 'Chưa có giao dịch nào.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} của {filteredTransactions.length} giao dịch
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(curr => Math.max(1, curr - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 1 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(curr => Math.min(totalPages, curr + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === totalPages 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                  }`}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buy Coin Statistics */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Nạp tiền</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">Tổng số</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {allHistoryDeposit.filter(d => d.statusDeposit !== 'FAILED' && d.typeDeposit === 'BUY_COIN').length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">Thành công</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allHistoryDeposit.filter(d => d.statusDeposit === 'SUCCESS' && d.typeDeposit === 'BUY_COIN').length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">Đang xử lý</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {allHistoryDeposit.filter(d => d.statusDeposit === 'PENDING' && d.typeDeposit === 'BUY_COIN').length}
                </div>
              </div>
            </div>
          </div>

          {/* Buy Chapter Statistics */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">Mua chương</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">Tổng số</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {allHistoryDeposit.filter(d => d.statusDeposit !== 'FAILED' && d.typeDeposit === 'BUY_CHAPTER').length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">Thành công</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allHistoryDeposit.filter(d => d.statusDeposit === 'SUCCESS' && d.typeDeposit === 'BUY_CHAPTER').length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400">Đang xử lý</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {allHistoryDeposit.filter(d => d.statusDeposit === 'PENDING' && d.typeDeposit === 'BUY_CHAPTER').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;