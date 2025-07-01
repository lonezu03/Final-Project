import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  updateUserProfile,
  updateUserAvatar,
} from '../../redux/userSlice';
import ChangePasswordDialog from '../ChangePasswordDialog'; // Đã sửa đường dẫn
import { User, Mail, Calendar, Edit3, Camera, KeyRound, Coins, BookOpen, Save, Loader2 as LucideSpinner } from 'lucide-react';

// Component thông báo nhỏ
const Notification = ({ message, type, onDismiss }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onDismiss(), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;
  const styles = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };
  return <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg z-[100] animate-fade-in-down ${styles[type]}`}>{message}</div>;
};

// Component hàng thông tin (đã sửa để nhận prop 'name')
const UserInfoRow = ({ icon, label, value, isEditing, onChange, name, inputType = "text", disabled = false }) => (
  <div className="flex items-center border-b border-gray-200 py-4">
    <div className="w-1/3 flex items-center text-gray-500">
      {icon}
      <span className="ml-3 font-medium">{label}</span>
    </div>
    <div className="w-2/3">
      {isEditing && !disabled ? (
        <input
          type={inputType}
          name={name} // Sửa lỗi: Thêm thuộc tính name để hàm handler chung hoạt động
          value={value}
          onChange={onChange}
          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span className={`text-gray-800 ${disabled ? 'text-gray-400' : ''}`}>{value || 'Chưa cập nhật'}</span>
      )}
    </div>
  </div>
);

const UserProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, loading } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({ userNameUser: '', dobUser: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else {
      // Đồng bộ state của form với Redux store mỗi khi currentUser thay đổi
      setFormData({
        userNameUser: currentUser.userNameUser || '',
        dobUser: currentUser.dobUser ? new Date(currentUser.dobUser).toISOString().split('T')[0] : '',
      });
    }
  }, [currentUser, navigate]);

  const showNotification = (type, message) => setNotification({ type, message });

  // Sửa lỗi: Hàm xử lý input duy nhất, hoạt động cho tất cả các trường
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Logic gửi dispatch đã đúng
      await dispatch(updateUserProfile(formData)).unwrap();
      showNotification('success', 'Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err) {
      showNotification('error', err || 'Cập nhật thất bại.');
    }
  };

  // Hàm Hủy, reset lại formData về giá trị từ currentUser
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      userNameUser: currentUser.userNameUser || '',
      dobUser: currentUser.dobUser ? new Date(currentUser.dobUser).toISOString().split('T')[0] : '',
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await dispatch(updateUserAvatar(file)).unwrap();
        showNotification('success', 'Cập nhật ảnh đại diện thành công!');
      } catch (err) {
        showNotification('error', err || 'Tải ảnh lên thất bại.');
      }
    }
  };

  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen"><LucideSpinner className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">Cài đặt tài khoản</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Cột trái: Avatar và thông tin cơ bản */}
            <div className="md:col-span-1 flex flex-col items-center text-center">
              <div className="relative group">
                <img
                  src={currentUser.avatarUser || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.userNameUser) || currentUser.emailUser[0]}&background=random&color=fff`}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
                <button onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity cursor-pointer">
                  <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 break-words">{currentUser.userNameUser}</h2>
              <p className="text-sm text-gray-500 break-all">{currentUser.emailUser}</p>
              <div className="mt-4 flex items-center bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full font-semibold">
                <Coins className="mr-2" size={18} />
                <span>{currentUser.coin?.toLocaleString() || 0} Coins</span>
              </div>
            </div>

            {/* Cột phải: Form chỉnh sửa thông tin */}
            <div className="md:col-span-2">
              <form onSubmit={handleProfileUpdate}>
                <UserInfoRow icon={<User size={20} />} label="Tên người dùng" name="userNameUser" value={formData.userNameUser} isEditing={isEditing} onChange={handleInputChange} />
                <UserInfoRow icon={<Mail size={20} />} label="Email" value={currentUser.emailUser} isEditing={isEditing} disabled={true} />
                <UserInfoRow icon={<Calendar size={20} />} label="Ngày sinh" name="dobUser" value={formData.dobUser} isEditing={isEditing} onChange={handleInputChange} inputType="date" />
                
                {/* Nút "Lưu" và "Hủy" chỉ hiển thị ở chế độ chỉnh sửa VÀ nằm BÊN TRONG form */}
                {isEditing && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button type="submit" disabled={loading} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait">
                      {loading ? <LucideSpinner className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={16} />}
                      Lưu thay đổi
                    </button>
                    <button type="button" onClick={handleCancelEdit} className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                  </div>
                )}
              </form>
              
              {/* Nút "Chỉnh sửa" chỉ hiển thị ở chế độ xem VÀ nằm BÊN NGOÀI form */}
              {!isEditing && (
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                   <button type="button" onClick={() => setIsEditing(true)} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300">
                    <Edit3 className="mr-2" size={16} /> Chỉnh sửa thông tin
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Phần hành động khác */}
          <div className="mt-10 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Bảo mật & Lịch sử</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setShowPasswordDialog(true)} className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors text-left">
                <KeyRound className="mr-4 text-red-500 flex-shrink-0" size={24} />
                <div>
                  <span className="font-medium text-gray-800">Thay đổi mật khẩu</span>
                  <p className="text-xs text-gray-500">Nên thay đổi định kỳ để bảo vệ tài khoản.</p>
                </div>
              </button>
              <button onClick={() => navigate('/user/reading-history')} className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors text-left">
                <BookOpen className="mr-4 text-green-500 flex-shrink-0" size={24} />
                <div>
                  <span className="font-medium text-gray-800">Lịch sử đọc truyện</span>
                  <p className="text-xs text-gray-500">Xem lại các chương bạn đã đọc gần đây.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog đổi mật khẩu */}
      {showPasswordDialog && <ChangePasswordDialog onClose={() => setShowPasswordDialog(false)} onNotification={showNotification} />}
    </div>
  );
};

export default UserProfilePage;