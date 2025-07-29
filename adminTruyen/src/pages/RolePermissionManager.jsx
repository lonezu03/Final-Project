// src/pages/RolePermissionManager.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff,
  Search,
  Check,
  X,
  UserCog
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  getAllRoles,
  getAllPermissions,
  addPermissionToRole,
  removePermissionFromRole,
  whiteListPermission,
  unWhiteListPermission,
  clearActionMessages
} from '../redux/rolePermissionSlice';

const RolePermissionManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    roles,
    permissions,
    loading,
    error,
    actionLoading,
    actionError,
    actionSuccess
  } = useSelector((state) => state.rolePermission);

  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'whitelisted', 'non-whitelisted'

  // Load data khi component mount
  useEffect(() => {
    dispatch(getAllRoles());
    dispatch(getAllPermissions());
  }, [dispatch]);

  // Clear messages sau 5 giây
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        dispatch(clearActionMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError, dispatch]);

  // Lọc permissions theo search và filter
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.endPoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'whitelisted') return matchesSearch && permission.whiteList;
    if (filterType === 'non-whitelisted') return matchesSearch && !permission.whiteList;
    return matchesSearch;
  });

  // Kiểm tra role có permission không
  const hasPermission = (roleId, permissionId) => {
    const role = roles.find(r => r.idRoleUser === roleId);
    return role?.permissionRespones?.some(p => p.idPermission === permissionId) || false;
  };

  // Thêm permission cho role
  const handleAddPermission = async (roleId, permissionId) => {
    if (window.confirm('Bạn có chắc chắn muốn thêm quyền này cho role?')) {
      await dispatch(addPermissionToRole({ idRole: roleId, idPermission: permissionId }));
      dispatch(getAllRoles()); // Refresh data
    }
  };

  // Xóa permission khỏi role
  const handleRemovePermission = async (roleId, permissionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quyền này khỏi role?')) {
      await dispatch(removePermissionFromRole({ idRole: roleId, idPermission: permissionId }));
      dispatch(getAllRoles()); // Refresh data
    }
  };

  // Toggle whitelist permission
  const handleToggleWhitelist = async (permission) => {
    const action = permission.whiteList ? unWhiteListPermission : whiteListPermission;
    const message = permission.whiteList 
      ? 'Bạn có chắc chắn muốn bỏ whitelist permission này?' 
      : 'Bạn có chắc chắn muốn whitelist permission này?';
    
    if (window.confirm(message)) {
      await dispatch(action(permission.idPermission));
      dispatch(getAllPermissions()); // Refresh data
    }
  };

  // Lấy màu cho method
  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Quản Lý Role & Permission
                </h1>
                <p className="text-slate-600 dark:text-slate-400">Quản lý quyền truy cập hệ thống</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/user-manager')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                <UserCog size={16} />
                Quản lý người dùng
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {actionSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">✅ {actionSuccess}</span>
            </div>
          </div>
        )}

        {(actionError || error) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 font-medium">❌ {actionError || error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Roles Panel */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Roles</h2>
            </div>
            
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.idRoleUser}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedRole?.idRoleUser === role.idRoleUser
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                      : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  } border`}
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">{role.role}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {role.permissionRespones?.length || 0} permissions
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Permissions</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="whitelisted">Whitelisted</option>
                  <option value="non-whitelisted">Non-whitelisted</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            {/* Permissions List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPermissions.map((permission) => (
                <div
                  key={permission.idPermission}
                  className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(permission.method)}`}>
                          {permission.method}
                        </span>
                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                          {permission.endPoint}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Type: {permission.type}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Whitelist Toggle */}
                      <button
                        onClick={() => handleToggleWhitelist(permission)}
                        disabled={actionLoading}
                        className={`p-1 rounded ${
                          permission.whiteList
                            ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={permission.whiteList ? 'Whitelisted' : 'Not whitelisted'}
                      >
                        {permission.whiteList ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      {/* Role Permission Actions */}
                      {selectedRole && (
                        <div className="flex items-center gap-1">
                          {hasPermission(selectedRole.idRoleUser, permission.idPermission) ? (
                            <button
                              onClick={() => handleRemovePermission(selectedRole.idRoleUser, permission.idPermission)}
                              disabled={actionLoading}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              title="Xóa quyền"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddPermission(selectedRole.idRoleUser, permission.idPermission)}
                              disabled={actionLoading}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                              title="Thêm quyền"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedRole && (
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                  Đang quản lý: {selectedRole.role}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  Click nút + để thêm quyền, - để xóa quyền khỏi role này.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Roles</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{roles.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Permissions</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{permissions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Whitelisted</h3>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {permissions.filter(p => p.whiteList).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Role được chọn</h3>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedRole?.role || 'Chưa chọn'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RolePermissionManager;
