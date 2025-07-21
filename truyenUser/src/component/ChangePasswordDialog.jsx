import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changeUserPassword, clearUserError } from '../redux/userSlice'; // Sửa đường dẫn nếu cần
import { X, KeyRound, Eye, EyeOff, Loader2 as LucideSpinner } from 'lucide-react';
import { sendOTP, getUserIdByEmail, forgotPassword, loginUserWithPassword } from '../redux/userSlice';
import { toast } from 'react-toastify';
// Component con cho ô nhập mật khẩu có nút hiển thị/ẩn
const PasswordInput = ({ id, value, onChange, placeholder, isVisible, onToggleVisibility }) => (
  <div className="relative">
    <input
      id={id}
      type={isVisible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder={placeholder}
      required
    />
    <button
      type="button"
      onClick={onToggleVisibility}
      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
      aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
    >
      {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
);

const ChangePasswordDialog = ({ onClose, onNotification }) => {
  const dispatch = useDispatch();
  
  // Lấy trạng thái loading và error từ Redux
  const { currentUser,loading, error: reduxError } = useSelector((state) => state.user);

  // State cục bộ cho form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  // State cho việc hiển thị/ẩn mật khẩu
  // const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Xóa lỗi cũ khi component được mở
  React.useEffect(() => {
    dispatch(clearUserError());
  }, [dispatch]);

   const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    // dispatch(clearUserError());

    if (newPassword.length < 6) {
      setFormError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }
    
    // Đảm bảo có currentUser và idUser
    if (!currentUser?.idUser) {
        setFormError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
        return;
    }

    try {
      console.log("Đang đổi mật khẩu...", currentUser.idUser, newPassword);
      // BƯỚC 1: Gọi thunk forgotPassword với idUser và mật khẩu mới
      await dispatch(forgotPassword({ 
          idUser: currentUser.idUser, 
          password: newPassword 
      })).unwrap();

      // BƯỚC 3: Để đảm bảo token được làm mới, ta nên đăng nhập lại
      await dispatch(loginUserWithPassword({ 
          email: currentUser.emailUser, 
          password: newPassword 
      })).unwrap();
      
      // Đồng bộ đăng nhập với Firebase

      // onNotification('success', 'Đổi mật khẩu và làm mới phiên đăng nhập thành công!');
      toast.success('Đổi mật khẩu thành công!');
      onClose(); // ĐÓNG DIALOG KHI TẤT CẢ THÀNH CÔNG
    } catch (err) {
      // Lỗi sẽ được bắt bởi .unwrap()
      // reduxError sẽ tự động được cập nhật, không cần setFormError
    }
  };


  return (
    // Lớp phủ toàn màn hình
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      {/* Dialog content */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800" aria-label="Đóng">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <KeyRound className="mr-2 text-blue-600" /> Đổi mật khẩu
        </h2>
        
        {/* Hiển thị lỗi từ Redux hoặc từ form */}
        {(reduxError || formError) && (
          <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">
            {reduxError || formError}
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 
            LƯU Ý: Mặc dù form có ô nhập mật khẩu cũ, nhưng chúng ta sẽ không gửi nó đến API 
            vì API `updateUser` của bạn không yêu cầu. Việc có ô này là một lớp bảo mật
            phía client. Nếu backend của bạn có logic kiểm tra mật khẩu cũ, bạn sẽ cần
            sửa lại thunk `changeUserPassword`. Hiện tại, chúng ta sẽ ẩn nó đi để khớp với API.
            Nếu bạn muốn hiện lại, chỉ cần bỏ comment khối div dưới đây.
          */}
          {/* 
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
            <PasswordInput id="old-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu cũ của bạn" isVisible={showOldPass} onToggleVisibility={() => setShowOldPass(!showOldPass)} />
          </div> 
          */}

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <PasswordInput id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" isVisible={showNewPass} onToggleVisibility={() => setShowNewPass(!showNewPass)} />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <PasswordInput id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" isVisible={showConfirmPass} onToggleVisibility={() => setShowConfirmPass(!showConfirmPass)} />
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait flex items-center min-w-[110px] justify-center">
              {loading ? <LucideSpinner size={18} className="animate-spin" /> : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordDialog;