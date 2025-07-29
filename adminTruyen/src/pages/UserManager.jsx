import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getalluser, grantManagerRole, clearGrantRoleStatus } from '../redux/userSlice';
import { useTheme } from '../context/ThemeContext';
import { Users, Search, UserPlus, Shield, Calendar, Mail, User, Settings } from 'lucide-react';

const UserManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { 
    allUsers, 
    loading, 
    error, 
    grantRoleLoading, 
    grantRoleError,
    grantRoleSuccess,
    currentUser 
  } = useSelector((state) => state.user);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Lấy danh sách tất cả user khi component mount
  useEffect(() => {
    dispatch(getalluser());
  }, [dispatch]);

  // Xử lý tìm kiếm user
  const filteredUsers = allUsers.filter(user => 
    user.userNameUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.emailUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.idUser?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Phân trang
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset page khi search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Hàm chuyển trang
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Hàm tạo số trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Xử lý cấp quyền manager
  const handleGrantRole = async (userId) => {
    if (!userId) {
      alert('Vui lòng chọn người dùng để cấp quyền!');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn cấp quyền manager cho người dùng này?`)) {
      dispatch(grantManagerRole(userId));
    }
  };

  // Clear thông báo sau 5 giây
  useEffect(() => {
    if (grantRoleSuccess || grantRoleError) {
      const timer = setTimeout(() => {
        dispatch(clearGrantRoleStatus());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [grantRoleSuccess, grantRoleError, dispatch]);

  // Kiểm tra xem user có phải là manager không (dựa vào role hoặc logic khác)
  const isManager = (user) => {
    // Giả sử có trường role hoặc isManager trong user object
    // Bạn có thể điều chỉnh logic này theo cấu trúc dữ liệu thực tế
    return user.role === 'MANAGER' || user.isManager === true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Đang tải danh sách người dùng...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Quản Lý Người Dùng
                </h1>
                <p className="text-slate-600 dark:text-slate-400">Quản lý tài khoản và phân quyền người dùng</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/role-permission')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-indigo-500/25"
              >
                <Settings size={16} />
                Quản lý quyền chi tiết
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {grantRoleSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-green-700 dark:text-green-300 font-medium">✅ {grantRoleSuccess}</span>
            </div>
          </div>
        )}

        {(grantRoleError || error) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <User className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-red-700 dark:text-red-300 font-medium">❌ {grantRoleError || error}</span>
            </div>
          </div>
        )}

        {/* Search and Controls */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500"
              />
              <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Hiển thị:
              </label>
              <select
                value={usersPerPage}
                onChange={(e) => {
                  setUsersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-slate-600 dark:text-slate-400">/ trang</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-700/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Avatar</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thông tin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Coin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {paginatedUsers.map((user) => (
                  <tr key={user.idUser} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden ring-2 ring-slate-200 dark:ring-slate-600">
                        {user.avatarUser ? (
                          <img
                            src={user.avatarUser}
                            alt={user.userNameUser}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {user.userNameUser?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {user.userNameUser || 'N/A'}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Mail size={14} />
                          {user.emailUser || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">ID: {user.idUser}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {user.coin !== undefined ? user.coin.toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                        isManager(user)
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {isManager(user) ? <Shield size={12} /> : <User size={12} />}
                        {isManager(user) ? 'Manager' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isManager(user) ? (
                        <button
                          onClick={() => handleGrantRole(user.idUser)}
                          disabled={grantRoleLoading}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                            grantRoleLoading
                              ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
                          }`}
                        >
                          {grantRoleLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <Shield size={16} />
                              Cấp quyền Manager
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Shield size={16} />
                          Đã là Manager
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {searchTerm ? 'Không tìm thấy người dùng nào phù hợp.' : 'Chưa có người dùng nào.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} của {filteredUsers.length} kết quả
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                  }`}
                >
                  Trước
                </button>

                {/* Page Numbers */}
                {getPageNumbers()[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300 transition-all duration-200"
                    >
                      1
                    </button>
                    {getPageNumbers()[0] > 2 && (
                      <span className="px-2 py-2 text-slate-500 dark:text-slate-400">...</span>
                    )}
                  </>
                )}

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                  <>
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                      <span className="px-2 py-2 text-slate-500 dark:text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300 transition-all duration-200"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng số người dùng</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{allUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Số Manager</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {allUsers.filter(user => isManager(user)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Người dùng thường</h3>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {allUsers.filter(user => !isManager(user)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Hiển thị trang</h3>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {currentPage} / {totalPages || 1}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManager;