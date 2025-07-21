// src/components/ForgotPasswordView.jsx

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'; // Thêm Loader2
import { toast } from 'react-toastify';
import { getAuth, updatePassword, signInWithEmailAndPassword } from "firebase/auth";

import { sendOTP, getUserIdByEmail, forgotPassword, loginUserWithPassword } from '../redux/userSlice';

const ForgotPasswordView = ({ onBackToLogin, onAuthSuccess }) => { // Thêm onAuthSuccess
  const dispatch = useDispatch();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    try {
      const returnedUserId = await dispatch(getUserIdByEmail(email)).unwrap();
      setUserId(returnedUserId);

      const otpResult = await dispatch(sendOTP({ email })).unwrap();
      setReceivedOtp(otpResult.receivedOtp);

      toast.success("Đã gửi mã OTP đến email của bạn.");
      setStep(2);
    } catch (err) {
      // err là giá trị từ rejectWithValue, có thể là chuỗi hoặc object
      const errorMessage = typeof err === 'string' ? err : err?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpInput.trim() === String(receivedOtp)) {
      setLocalError('');
      setStep(3);
    } else {
      setLocalError("Mã OTP không chính xác.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp.");
      return;
    }
    
    setIsLoading(true);
    setLocalError('');
    try {
      // 1. Gọi API đổi mật khẩu
      await dispatch(forgotPassword({ idUser: userId, password })).unwrap();
      
      // 2. Tự động đăng nhập
      const loggedInUser = await dispatch(loginUserWithPassword({ email, password })).unwrap();
            // await signInWithEmailAndPassword(auth, email, password);

      toast.success("Đổi mật khẩu và đăng nhập thành công!");
      setStep(4);

      // 3. Thông báo cho AuthModal biết đã thành công và gửi dữ liệu user lên
      setTimeout(() => {
        if(onAuthSuccess) {
            onAuthSuccess(loggedInUser);
        }
      }, 1500); // Đợi 1.5s để người dùng đọc thông báo

    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
        {step < 4 && (
             <button onClick={onBackToLogin} className="flex items-center text-xs text-stone-500 hover:text-stone-700 mb-4 disabled:opacity-50" disabled={isLoading}>
                <ArrowLeft size={14} className="mr-1"/> Quay lại Đăng nhập
            </button>
        )}

        {localError && <p className="text-red-600 text-sm text-center mb-3 bg-red-100 p-2 rounded-md">{localError}</p>}

        {step === 1 && (
            <form onSubmit={handleSendOtp}>
                 <p className="text-sm text-stone-600 mb-4 text-center">Vui lòng nhập email của bạn để nhận mã khôi phục mật khẩu.</p>
                 <div className="mb-4">
                    <label htmlFor="email-forgot" className="block text-sm font-medium text-stone-600 mb-1">Email</label>
                    <input id="email-forgot" type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm"/>
                </div>
                 <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-70 flex items-center justify-center">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Gửi mã xác nhận'}
                </button>
            </form>
        )}

        {step === 2 && (
             <form onSubmit={handleVerifyOtp}>
                 <p className="text-sm text-stone-600 mb-4 text-center">Một mã OTP đã được gửi đến <b>{email}</b>. Vui lòng kiểm tra và nhập vào bên dưới.</p>
                 <div className="mb-4">
                    <label htmlFor="otp-forgot" className="block text-sm font-medium text-stone-600 mb-1">Mã OTP</label>
                    <input id="otp-forgot" type="text" placeholder="Nhập mã OTP" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm"/>
                </div>
                 <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-70">
                    Xác nhận
                </button>
            </form>
        )}

        {step === 3 && (
            <form onSubmit={handleResetPassword}>
                 <p className="text-sm text-stone-600 mb-4 text-center">Xác thực thành công! Vui lòng đặt lại mật khẩu mới.</p>
                <div className="mb-4 relative">
                    <label className="block text-sm font-medium text-stone-600 mb-1">Mật khẩu mới</label>
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 pr-10 bg-white border rounded-md"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center px-3 text-stone-500">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                 <div className="mb-5 relative">
                    <label className="block text-sm font-medium text-stone-600 mb-1">Xác nhận mật khẩu</label>
                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 pr-10 bg-white border rounded-md"/>
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center px-3 text-stone-500">
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                 <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-70 flex items-center justify-center">
                     {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Lưu mật khẩu và Đăng nhập'}
                </button>
            </form>
        )}

        {step === 4 && (
            <div className="text-center">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
                <p className="font-semibold text-stone-700">Đổi mật khẩu thành công!</p>
                <p className="text-sm text-stone-600">Bạn đã được tự động đăng nhập. Cửa sổ này sẽ đóng lại sau giây lát.</p>
            </div>
        )}
    </div>
  );
};

export default ForgotPasswordView;