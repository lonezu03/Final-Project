// src/AuthModal.jsx
import React, { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { auth } from '../firebase-config';
import {
  GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword
} from "firebase/auth";
import {
  registerUser,
  loginUserWithPassword,
  loginUserByEmailOnly,
  createUserByEmailOnly,
  sendOTP as sendOTPAPI,
  clearUserError
} from "../redux/userSlice";
import ForgotPasswordView from './ForgotPasswordView';
import { useTheme } from '../context/ThemeContext'; 

const logoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThhqK6mONYbcEN8rDOd2rPIKFmhSBKbWkAAw&s";

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [receivedOtpFromServer, setReceivedOtpFromServer] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const switchToForgotPassword = () => {
    if (!isLoading && !isOtpSending) {
        setView('forgotPassword');
    }
  };
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setShowPassword(false);
        setShowConfirmPassword(false);
        setView('login'); setEmail(''); setPassword(''); setConfirmPassword('');
        setOtpInput(''); setReceivedOtpFromServer(''); setLocalError('');
        dispatch(clearUserError());
        setIsLoading(false); setIsOtpSending(false);
      }, 300);
    } else {
      setOtpInput(''); setLocalError(''); dispatch(clearUserError());
      if (view === 'login' || view === 'register') setConfirmPassword('');
    }
  }, [isOpen, view, dispatch]);

  const handleCloseModal = () => { if (!isLoading && !isOtpSending) onClose(); };
  const switchToRegister = () => { if (!isLoading && !isOtpSending) setView('register'); };
  const switchToLogin = () => { if (!isLoading && !isOtpSending) setView('login'); };

  const handleBackendOperation = async (thunkAction, payload, operationName = "Operation") => {
    // Không set isLoading ở đây nữa, để hàm gọi có thể kiểm soát
    setLocalError('');
    try {
      const actionResult = await dispatch(thunkAction(payload)).unwrap();
      // Chỉ gọi onAuthSuccess và handleCloseModal khi đăng nhập thành công
      if (operationName === "Email/Password Login") {
        if (onAuthSuccess) onAuthSuccess(actionResult);
        handleCloseModal();
      }
      return actionResult; // Trả về kết quả để hàm gọi có thể sử dụng
    } catch (err) {
      console.error(`${operationName} Error:`, err);
      const errorMessage = typeof err === 'string' ? err : err?.message || `Lỗi ${operationName.toLowerCase()}.`;
      setLocalError(errorMessage);
      throw new Error(errorMessage); // Ném lỗi để hàm gọi có thể bắt được
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setLocalError("Mật khẩu xác nhận không khớp."); return; }
    if (password.length < 6) { setLocalError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    setIsOtpSending(true); setLocalError('');
    try {
      const actionResult = await dispatch(sendOTPAPI({ email })).unwrap();
      if (actionResult.otpSent && actionResult.receivedOtp) {
        setReceivedOtpFromServer(actionResult.receivedOtp);
        setView('otp');
      } else {
        setLocalError(actionResult.message || "Gửi OTP thất bại từ server.");
      }
    } catch (err) {
      setLocalError(err?.message || err || "Gửi OTP thất bại. Vui lòng thử lại.");
    } finally {
      setIsOtpSending(false);
    }
  };

  // =====================================================================
  // SỬA ĐỔI CHÍNH: Thêm bước đăng nhập sau khi đăng ký
  // =====================================================================
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (String(otpInput) !== String(receivedOtpFromServer)) { setLocalError("Mã OTP không chính xác."); return; }
    
    setIsLoading(true);
    setLocalError('');
    
    try {
      // BƯỚC 1: Đăng ký trên Firebase
      // await createUserWithEmailAndPassword(auth, email, password);
      
      // BƯỚC 2: Đăng ký trên Backend
      const registrationPayload = { emailUser: email, passwordUser: password };
      await dispatch(registerUser(registrationPayload)).unwrap();
      
      // BƯỚC 3: Tự động đăng nhập trên Backend để lấy token
      const loginPayload = { email, password };
      const loggedInUser = await dispatch(loginUserWithPassword(loginPayload)).unwrap();
      
      // Nếu tất cả các bước thành công
      if (onAuthSuccess) onAuthSuccess(loggedInUser);
      handleCloseModal();

    } catch (err) {
      // Xử lý các lỗi có thể xảy ra
      if (err?.code === 'auth/email-already-in-use') {
        setLocalError("Email này đã được sử dụng. Vui lòng đăng nhập.");
      } else if (err?.code === 'auth/weak-password') {
        setLocalError("Mật khẩu quá yếu, vui lòng chọn mật khẩu khác.");
      } else {
        // Lỗi từ các thunk (registerUser, loginUserWithPassword)
        const errorMessage = typeof err === 'string' ? err : err?.message || "Đăng ký hoặc đăng nhập thất bại.";
        setLocalError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Kiểm soát isLoading tại đây
    try {
      // await signInWithEmailAndPassword(auth, email, password);
      const loginPayload = { email, password };
      // Sử dụng lại hàm handleBackendOperation cho đăng nhập
      await handleBackendOperation(loginUserWithPassword, loginPayload, "Email/Password Login");
    } catch (err) {
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(err.code)) {
        setLocalError("Email hoặc mật khẩu không đúng.");
      } else {
        setLocalError(err.message || `Đăng nhập thất bại.`);
      }
    } finally {
      setIsLoading(false); // Đảm bảo reset isLoading
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    dispatch(clearUserError());
    const provider = new GoogleAuthProvider();
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const createUserPayload = {
        email: googleUser.email,
        // Thêm các trường khác nếu API của bạn hỗ trợ và bạn muốn gửi
        // displayName: googleUser.displayName,
        // photoURL: googleUser.photoURL,
        // firebaseUid: googleUser.uid,
      };

      console.log("Attempting to create/sync Google user with:", createUserPayload);
      // Gọi createUserByEmailOnly và không dùng handleBackendOperation ở đây để có thể bắt lỗi cụ thể
      const actionResultCreate = await dispatch(createUserByEmailOnly(createUserPayload));

      if (createUserByEmailOnly.fulfilled.match(actionResultCreate)) {
        console.log("Google user created/synced successfully via createUserByEmailOnly:", actionResultCreate.payload);
        if (onAuthSuccess) onAuthSuccess(actionResultCreate.payload);
        handleCloseModal();
      } else if (createUserByEmailOnly.rejected.match(actionResultCreate)) {
        // actionResultCreate.payload là giá trị từ rejectWithValue
        const createError = actionResultCreate.payload;
        console.error("Error during createUserByEmailOnly for Google:", createError);

        // Kiểm tra lỗi "User already existed" (code 1010)
        // Điều chỉnh điều kiện này cho phù hợp với cách API của bạn trả về lỗi
        const isUserAlreadyExistedError =
          (typeof createError === 'string' && createError.toLowerCase().includes("user already existed")) ||
          (createError && createError.code === 1010) || // Nếu API trả về object lỗi có code
          (createError && typeof createError.message === 'string' && createError.message.toLowerCase().includes("user already existed"));


        if (isUserAlreadyExistedError) {
          console.log("User already exists, attempting loginUserByEmailOnly for:", { email: googleUser.email });
          // Gọi loginUserByEmailOnly và không dùng handleBackendOperation ở đây để có thể bắt lỗi cụ thể
          const actionResultLogin = await dispatch(loginUserByEmailOnly({ email: googleUser.email }));

          if (loginUserByEmailOnly.fulfilled.match(actionResultLogin)) {
            console.log("Logged in existing Google user successfully via loginUserByEmailOnly:", actionResultLogin.payload);
            if (onAuthSuccess) onAuthSuccess(actionResultLogin.payload);
            handleCloseModal();
          } else if (loginUserByEmailOnly.rejected.match(actionResultLogin)) {
            const loginError = actionResultLogin.payload;
            console.error("Error during loginUserByEmailOnly for existing Google user:", loginError);
            const loginErrorMessage = typeof loginError === 'string' ? loginError : loginError?.message || "Đăng nhập Google thất bại sau khi user đã tồn tại.";
            setLocalError(loginErrorMessage);
          }
        } else {
          // Nếu là lỗi khác không phải "User already existed" từ createUserByEmailOnly
          const createErrorMessage = typeof createError === 'string' ? createError : createError?.message || "Đăng nhập/Đồng bộ Google thất bại.";
          setLocalError(createErrorMessage);
        }
      }
    } catch (firebaseAuthError) { // Lỗi từ signInWithPopup của Firebase
      console.error("Firebase Google sign-in error:", firebaseAuthError);
      if (firebaseAuthError.code !== 'auth/popup-closed-by-user' && firebaseAuthError.code !== 'auth/cancelled-popup-request') {
        setLocalError(firebaseAuthError.message || `Đăng nhập Google thất bại.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  const currentLoadingState = isLoading || isOtpSending;

  const renderContent = () => {
     if (view === 'forgotPassword') {
        return (
            <ForgotPasswordView 
                onBackToLogin={switchToLogin} 
                onAuthSuccess={onAuthSuccess} // <<== Truyền prop này vào
            />
        );
    }
    if (view === 'login') {
      return (
        <form onSubmit={handleEmailPasswordLogin}>
          <div className="mb-4">
            <label htmlFor="email-login" className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-stone-600'
            }`}>Email</label>
            <input 
              id="email-login" 
              type="email" 
              placeholder="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={currentLoadingState} 
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors placeholder-opacity-70 disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-700 border-gray-600 text-gray-200 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400' 
                  : 'bg-white border-stone-300 text-stone-800 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 disabled:bg-stone-50'
              }`} 
            />
          </div>
          <div className="mb-5">
            <div className="flex justify-between items-baseline">
              <label htmlFor="password-login" className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-stone-600'
              }`}>Mật khẩu</label>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); switchToForgotPassword(); }}
                  className={`text-xs hover:underline transition-colors ${
                    isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
                  }`}
                >
                  Quên mật khẩu?
                </button>            
            </div>
            <div className="relative">
              <input
                id="password-login"
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={currentLoadingState}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors placeholder-opacity-70 disabled:opacity-50 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-gray-600 text-gray-200 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400' 
                    : 'bg-white border-stone-300 text-stone-800 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 disabled:bg-stone-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 flex items-center px-3 transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-stone-500 hover:text-stone-700'
                }`}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={currentLoadingState} 
            className={`w-full font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400' 
                : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
          <p className={`text-sm text-center mt-5 ${
            isDarkMode ? 'text-gray-300' : 'text-stone-600'
          }`}>Chưa có tài khoản?{' '}
            <button 
              type="button" 
              onClick={switchToRegister} 
              disabled={currentLoadingState} 
              className={`font-semibold hover:underline focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${
                isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
              }`}
            >Đăng ký ngay</button>
          </p>
          <div className="my-5 flex items-center">
            <div className={`flex-grow border-t ${
              isDarkMode ? 'border-gray-600' : 'border-stone-300'
            }`}></div>
            <span className={`flex-shrink mx-2 text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-stone-400'
            }`}>HOẶC</span>
            <div className={`flex-grow border-t ${
              isDarkMode ? 'border-gray-600' : 'border-stone-300'
            }`}></div>
          </div>
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={currentLoadingState} 
            className={`w-full flex items-center justify-center py-2.5 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'border-gray-600 bg-slate-700 text-gray-200 hover:bg-slate-600 focus:ring-gray-500' 
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 focus:ring-stone-400'
            }`}
          >
            <FcGoogle className="mr-2.5" size={22} />
            {isLoading ? 'Đang xử lý Google...' : 'Đăng nhập bằng Google'}
          </button>
        </form>
      );
    } else if (view === 'register') {
      return (
        <form onSubmit={handleRequestOtp}>
          <div className="mb-4">
            <label htmlFor="email-register" className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-stone-600'
            }`}>Email</label>
            <input 
              id="email-register" 
              type="email" 
              placeholder="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={currentLoadingState} 
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors placeholder-opacity-70 disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-700 border-gray-600 text-gray-200 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400' 
                  : 'bg-white border-stone-300 text-stone-800 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 disabled:bg-stone-50'
              }`} 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password-register" className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-stone-600'
            }`}>Mật khẩu</label>
            <div className="relative">
              <input
                id="password-register"
                type={showPassword ? "text" : "password"}
                placeholder="password (ít nhất 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={currentLoadingState}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors placeholder-opacity-70 disabled:opacity-50 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-gray-600 text-gray-200 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400' 
                    : 'bg-white border-stone-300 text-stone-800 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 disabled:bg-stone-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 flex items-center px-3 transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-stone-500 hover:text-stone-700'
                }`}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="confirm-password-register" className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-stone-600'
            }`}>Nhập lại mật khẩu</label>
            <div className="relative">
              <input
                id="confirm-password-register"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={currentLoadingState}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors placeholder-opacity-70 disabled:opacity-50 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-gray-600 text-gray-200 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400' 
                    : 'bg-white border-stone-300 text-stone-800 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 disabled:bg-stone-50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute inset-y-0 right-0 flex items-center px-3 transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-stone-500 hover:text-stone-700'
                }`}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={currentLoadingState} 
            className={`w-full font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400' 
                : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
            }`}
          >
            {isOtpSending ? 'Đang gửi OTP...' : 'Tiếp tục'}
          </button>
          <p className={`text-sm text-center mt-5 ${
            isDarkMode ? 'text-gray-300' : 'text-stone-600'
          }`}>Đã có tài khoản?{' '}
            <button 
              type="button" 
              onClick={switchToLogin} 
              disabled={currentLoadingState} 
              className={`font-semibold hover:underline focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${
                isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
              }`}
            >Đăng nhập</button>
          </p>
        </form>
      );
    } else if (view === 'otp') {
      return (
        <form onSubmit={handleVerifyOtpAndRegister}>
          <p className={`text-sm mb-3 text-center ${
            isDarkMode ? 'text-gray-300' : 'text-stone-600'
          }`}>
            Một mã OTP đã được gửi đến email <span className="font-semibold">{email}</span>. Vui lòng nhập mã OTP để hoàn tất đăng ký.
          </p>
          <div className="mb-4">
            <label htmlFor="otp-input" className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-stone-600'
            }`}>Mã OTP</label>
            <input
              id="otp-input" 
              type="text" 
              placeholder="Nhập mã OTP" 
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)} 
              required 
              disabled={currentLoadingState}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors placeholder-opacity-70 disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-700 border-gray-600 text-gray-200 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400' 
                  : 'bg-white border-stone-300 text-stone-800 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 disabled:bg-stone-50'
              }`}
            />
          </div>
          <button 
            type="submit" 
            disabled={currentLoadingState}
            className={`w-full font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400' 
                : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
            }`}
          >
            {isLoading ? 'Đang đăng ký...' : 'Xác nhận và Đăng ký'}
          </button>
          <p className={`text-sm text-center mt-5 ${
            isDarkMode ? 'text-gray-300' : 'text-stone-600'
          }`}>
            <button 
              type="button" 
              onClick={() => { if (!currentLoadingState) setView('register') }} 
              disabled={currentLoadingState} 
              className={`font-semibold hover:underline focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${
                isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
              }`}
            >Quay lại</button>
            {' | '}
            <button 
              type="button" 
              onClick={switchToLogin} 
              disabled={currentLoadingState} 
              className={`font-semibold hover:underline focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${
                isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
              }`}
            >Về trang Đăng nhập</button>
          </p>
        </form>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className={`rounded-lg w-full max-w-sm shadow-xl p-6 sm:p-8 relative transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 text-gray-200 border border-gray-600' 
          : 'bg-stone-100 text-stone-700 border border-stone-200'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto opacity-80" />
          <h2 className={`text-xl font-semibold absolute left-1/2 -translate-x-1/2 ${
            isDarkMode ? 'text-white' : 'text-stone-800'
          }`}>
            {view === 'login' && 'Đăng nhập'}
            {view === 'register' && 'Đăng ký'}
            {view === 'otp' && 'Xác thực OTP'}
            {view === 'forgotPassword' && 'Quên Mật Khẩu'}
          </h2>
          <button 
            onClick={handleCloseModal} 
            className={`transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-stone-500 hover:text-stone-700'
            }`} 
            aria-label="Đóng" 
            disabled={currentLoadingState}
          >
            <X size={24} />
          </button>
        </div>
        {localError && (
          <p className={`text-sm text-center mb-3 p-2 rounded-md ${
            isDarkMode 
              ? 'text-red-300 bg-red-900/20 border border-red-700' 
              : 'text-red-600 bg-red-100 border border-red-200'
          }`}>{localError}</p>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthModal;