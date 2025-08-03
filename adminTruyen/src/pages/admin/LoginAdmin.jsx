import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUserWithPassword, clearUserError, refreshUserSession } from '../../redux/userSlice';
import { Eye, EyeOff, Lock, Mail, BookOpen, Shield } from 'lucide-react';
import '../../styles/loginAdmin.css'; 

const LoginAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

const { loading, error: reduxError, currentUser } = useSelector((state) => state.user) || {};
  // SCENARIO 1: Xử lý khi người dùng đã đăng nhập từ trước và vào lại trang login
  useEffect(() => {
    // Tải thông tin người dùng từ localStorage ngay khi component được tải
    // để đảm bảo currentUser được cập nhật nếu F5 trang
    dispatch(refreshUserSession());
  }, [dispatch]);

  useEffect(() => {
    // useEffect này sẽ phản ứng với currentUser (dù là vừa tải từ storage hay vừa đăng nhập xong)
    if (currentUser) {
        navigate('/admin', { replace: true });
    }
  }, [currentUser, navigate]);

  // Xóa lỗi cũ khi người dùng bắt đầu nhập lại
  useEffect(() => {
    if (reduxError || localError) {
        dispatch(clearUserError());
        setLocalError('');
    }
  }, [email, password, dispatch]);
  
  // SCENARIO 2: Xử lý ngay sau khi nhấn nút đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    const credentials = {
      email: email, 
      password: password,
    };

    try {
      // Đợi cho đến khi đăng nhập hoàn tất
      const user = await dispatch(loginUserWithPassword(credentials)).unwrap();

      // Kiểm tra quyền truy cập
      if (user?.role !== "ADMIN") {
        setLocalError('Tài khoản không có quyền truy cập trang quản trị.');
        return;
      }

      // Nếu đúng quyền, chuyển hướng
      navigate('/admin', { replace: true });

    } catch (rejectedValue) {
      console.error('Login failed:', rejectedValue);
    }
  };

  // Phần JSX với thiết kế mới
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Login Container */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 float-animation">
              <Shield size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Panel</h1>
              <p className="text-blue-200 text-sm font-medium">Đăng nhập để quản lý hệ thống truyện</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-blue-100">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-blue-300" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-blue-100">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-blue-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {(reduxError || localError) && (
              <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <p className="text-red-200 text-sm font-medium">
                    {localError || reduxError}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300 pulse-glow"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <BookOpen size={20} />
                    <span>Đăng Nhập</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-blue-200 text-xs">
              © 2025 Novel Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;