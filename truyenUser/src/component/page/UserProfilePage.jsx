// src/pages/UserProfilePage.jsx (hoặc nơi bạn lưu component)

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ForgotPasswordView from '../ForgotPasswordView'; 
 
// Import các actions từ userSlice
import {
  updateUserProfile,
  uploadAvatar,
} from '../../redux/userSlice';

import ChangePasswordDialog from '../ChangePasswordDialog';
import { User, Mail, Calendar, Edit3, Camera, KeyRound, Coins, BookOpen, Save, Loader2 as LucideSpinner } from 'lucide-react';

// Component hàng thông tin (giữ nguyên)
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
                    name={name}
                    value={value || ''} // Đảm bảo value không bao giờ là null/undefined
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

  // State cục bộ của component
  const [formData, setFormData] = useState({ userNameUser: '', dobUser: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const fileInputRef = useRef(null);

  // Hàm helper để chuyển đổi ngày tháng từ nhiều định dạng
  const formatDateForInput = (dob) => {
    if (!dob) return '';
    try {
      let dateObj;
      if (Array.isArray(dob) && dob.length >= 3) {
        // API trả về [năm, tháng, ngày]
        dateObj = new Date(Date.UTC(dob[0], dob[1] - 1, dob[2]));
      } else {
        // API trả về chuỗi ISO hoặc timestamp
        dateObj = new Date(dob);
      }
      if (isNaN(dateObj.getTime())) return ''; // Ngày không hợp lệ
      return dateObj.toISOString().split('T')[0]; // Format thành 'YYYY-MM-DD'
    } catch (e) {
      return '';
    }
  };

  // Đồng bộ state của form với Redux store
  useEffect(() => {
    if (!currentUser) {
      // Có thể thêm toast ở đây nếu muốn
      navigate('/');
    } else {
      setFormData({
        userNameUser: currentUser.userNameUser || '',
        dobUser: formatDateForInput(currentUser.dobUser),
      });
    }
  }, [currentUser, navigate]);

  // Hàm xử lý chung cho các input trong form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý khi bấm nút "Lưu thay đổi"
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!formData.userNameUser) {
        toast.error("Tên người dùng không được để trống.");
        return;
    }
    
    // Payload chỉ chứa các trường cần cập nhật
    const payload = {
        userNameUser: formData.userNameUser,
        dobUser: formData.dobUser // Gửi đi dưới dạng 'YYYY-MM-DD'
    };

    dispatch(updateUserProfile(payload))
      .unwrap()
      .then(() => {
        toast.success('Cập nhật thông tin thành công!');
        setIsEditing(false);
        // Tùy chọn: dispatch(fetchCurrentUser(currentUser.idUser)); để lấy lại toàn bộ data mới nhất
      })
      .catch((err) => {
        toast.error(`Cập nhật thất bại: ${err.message || err}`);
      });
  };

  // Hàm xử lý khi bấm "Hủy"
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form về trạng thái từ Redux store
    setFormData({
      userNameUser: currentUser.userNameUser || '',
      dobUser: formatDateForInput(currentUser.dobUser),
    });
  };

  // Hàm xử lý khi chọn file ảnh đại diện mới
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Action updateUserAvatar đã được sửa để chỉ cần file
      dispatch(uploadAvatar(file))
        .unwrap()
        .then(() => {
          toast.success('Cập nhật ảnh đại diện thành công!');
        })
        .catch((err) => {
          toast.error(`Tải ảnh lên thất bại: ${err.message || err}`);
        });
    }
  };

  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen"><LucideSpinner className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">Cài đặt tài khoản</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Cột trái: Avatar và thông tin cơ bản */}
            <div className="md:col-span-1 flex flex-col items-center text-center">
              <div className="relative group">
                <img
                  src={currentUser.avatarUser || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.userNameUser || currentUser.emailUser[0])}&background=random&color=fff`}
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
                <UserInfoRow icon={<Mail size={20} />} label="Email" value={currentUser.emailUser} isEditing={false} disabled={true} />
                <UserInfoRow icon={<Calendar size={20} />} label="Ngày sinh" name="dobUser" value={formData.dobUser} isEditing={isEditing} onChange={handleInputChange} inputType="date" />
                
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

      {showPasswordDialog && <ChangePasswordDialog onClose={() => setShowPasswordDialog(false)} />}
    </div>
  );
};

export default UserProfilePage;