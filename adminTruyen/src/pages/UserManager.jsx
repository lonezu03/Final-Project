import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getalluser, grantManagerRole, clearGrantRoleStatus } from '../redux/userSlice';

const UserManager = () => {
  const dispatch = useDispatch();
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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý người dùng</h1>

      {/* Thông báo */}
      {grantRoleSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          ✅ {grantRoleSuccess}
        </div>
      )}

      {grantRoleError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          ❌ {grantRoleError}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          ❌ {error}
        </div>
      )}

      {/* Tìm kiếm và cài đặt phân trang */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="usersPerPage" className="text-sm text-gray-600">
            Hiển thị:
          </label>
          <select
            id="usersPerPage"
            value={usersPerPage}
            onChange={(e) => {
              setUsersPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">/ trang</span>
        </div>
      </div>

      {/* Bảng danh sách user */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.idUser} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {user.avatarUser ? (
                        <img
                          src={user.avatarUser}
                          alt={user.userNameUser}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {user.userNameUser?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {user.userNameUser || 'N/A'}
                      </div>
                      <div className="text-gray-500">{user.emailUser || 'N/A'}</div>
                      <div className="text-xs text-gray-400">ID: {user.idUser}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.coin !== undefined ? user.coin.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isManager(user)
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isManager(user) ? 'Manager' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!isManager(user) && (
                      <button
                        onClick={() => handleGrantRole(user.idUser)}
                        disabled={grantRoleLoading}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                          grantRoleLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                      >
                        {grantRoleLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Đang xử lý...
                          </>
                        ) : (
                          'Cấp quyền Manager'
                        )}
                      </button>
                    )}
                    {isManager(user) && (
                      <span className="text-green-600 font-medium">✓ Đã là Manager</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy người dùng nào phù hợp.' : 'Chưa có người dùng nào.'}
          </div>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} của {filteredUsers.length} kết quả
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Nút Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Trước
            </button>

            {/* Số trang đầu và dấu ... */}
            {getPageNumbers()[0] > 1 && (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-500 hover:bg-gray-50 border border-gray-300"
                >
                  1
                </button>
                {getPageNumbers()[0] > 2 && (
                  <span className="px-2 py-2 text-gray-500">...</span>
                )}
              </>
            )}

            {/* Các số trang */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Dấu ... và số trang cuối */}
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                  <span className="px-2 py-2 text-gray-500">...</span>
                )}
                <button
                  onClick={() => goToPage(totalPages)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-500 hover:bg-gray-50 border border-gray-300"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Nút Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Thống kê */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Tổng số người dùng</h3>
          <p className="text-2xl font-semibold text-gray-900">{allUsers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Số Manager</h3>
          <p className="text-2xl font-semibold text-purple-600">
            {allUsers.filter(user => isManager(user)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Người dùng thường</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {allUsers.filter(user => !isManager(user)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Hiển thị trang</h3>
          <p className="text-2xl font-semibold text-indigo-600">
            {currentPage} / {totalPages || 1}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManager;