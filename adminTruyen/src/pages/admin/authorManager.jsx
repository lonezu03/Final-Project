import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllAuthors, deleteAuthor, updateAuthor } from '../../redux/authorSlice';
import { getAllNovels } from '../../redux/novelSlice'; // Thêm import getAllNovels
import { PencilLine, Trash, Plus, Users, Calendar, Globe, BookOpen, Camera, X } from 'lucide-react';
import { createAuthor } from '../../redux/authorSlice';
import Select from 'react-select';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const AuthorManager = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const { authors, loading, error } = useSelector((state) => state.authors);
  const { novels } = useSelector((state) => state.novels);

  // Helper function để tính tuổi chính xác
  const calculateAge = (birthDate, endDate = new Date()) => {
    const birth = new Date(birthDate);
    const end = new Date(endDate);
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    const dayDiff = end.getDate() - birth.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    
    return age;
  };

  const [showForm, setShowForm] = useState(false);
  const [image, setImage] = useState(null);
  const [newAuthor, setNewAuthor] = useState({
    publicIDAuthor: '',
    nameAuthor: '',
    descriptionAuthor: '',
    nationalityAuthor: '',
    dobAuthor: '',
    dodAuthor: '', // Thêm trường ngày mất
    genderAuthor: 'MALE',
    novels: [],
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState(null);

  console.log('danh sách novel', novels);
  console.log('Array.isArray(novels):', Array.isArray(novels));
  console.log('novels?.length:', novels?.length);
  
  const novelOptions = Array.isArray(novels) && novels.length > 0 
    ? novels.map((novel) => ({
        value: novel.idNovel,
        label: novel.nameNovel,
        key: novel.idNovel,
      }))
    : [];

  console.log('novels.novels:', novels?.novels);
  console.log('novelOptions:', novelOptions);

  useEffect(() => {
    dispatch(getAllAuthors());
    dispatch(getAllNovels()); // Bỏ comment để load dữ liệu novels
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      alert(error);
    }
  }, [error]);

  const authorsPerPage = 5;
  const totalAuthors = authors.length;

  // Calculate the indices of the authors to show for the current page
  const indexOfLastAuthor = currentPage * authorsPerPage;
  const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
  const currentAuthors = authors.slice(indexOfFirstAuthor, indexOfLastAuthor);

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('handleSubmit - Current newAuthor state:', newAuthor);
    console.log('handleSubmit - isEditing:', isEditing);

    const formData = new FormData();
    const dob = new Date(newAuthor.dobAuthor);
    const dod = newAuthor.dodAuthor ? new Date(newAuthor.dodAuthor) : null;
    const currentDate = new Date();
    
    // Validation cho ngày sinh
    if (!newAuthor.dobAuthor) {
      alert("Ngày sinh là bắt buộc.");
      return;
    }
    if (dob > currentDate) {
      alert("Ngày sinh không thể là ngày trong tương lai.");
      return;
    }
    
    // Validation cho ngày mất (nếu có)
    if (dod) {
      if (dod > currentDate) {
        alert("Ngày mất không thể là ngày trong tương lai.");
        return;
      }
      if (dod <= dob) {
        alert("Ngày mất phải sau ngày sinh.");
        return;
      }
      // Kiểm tra tuổi tác giả khi mất (phải >= 18)
      const ageAtDeath = calculateAge(dob, dod);
      if (ageAtDeath < 18) {
        alert("Tác giả phải ít nhất 18 tuổi khi mất.");
        return;
      }
    } else {
      // Nếu chưa mất, kiểm tra tuổi hiện tại
      const currentAge = calculateAge(dob, currentDate);
      if (currentAge < 18) {
        alert("Tác giả phải ít nhất 18 tuổi.");
        return;
      }
    }
    if (!newAuthor.nameAuthor || newAuthor.nameAuthor.length < 3 || newAuthor.nameAuthor.length > 100) {
      alert('Tên tác giả phải có độ dài từ 3 đến 100 ký tự!');
      return;
    }
    if (newAuthor.descriptionAuthor.length > 100) {
      alert('Mô tả phải có độ dài tối đa 100 ký tự!');
      return;
    }
    
    // Tạo payload khác nhau cho create và update
    const payloadData = {
      nameAuthor: newAuthor.nameAuthor,
      descriptionAuthor: newAuthor.descriptionAuthor,
      nationalityAuthor: newAuthor.nationalityAuthor,
      dobAuthor: newAuthor.dobAuthor,
      dodAuthor: newAuthor.dodAuthor || null, // Thêm trường dodAuthor
      genderAuthor: newAuthor.genderAuthor,
      novels: newAuthor.novels.map(String),
    };

    // Nếu đang edit, thêm idAuthor vào payload
    if (isEditing && newAuthor.idAuthor) {
      payloadData.idAuthor = newAuthor.idAuthor;
    }

    const jsonPayload = new Blob([JSON.stringify(payloadData)], { type: 'application/json' });

    formData.append('request', jsonPayload);
    if (image) {
      formData.append("image", image);
    }

    if (isEditing) {
      console.log('Updating author with payload:', payloadData);
      // Gửi cả FormData và idAuthor riêng biệt
      dispatch(updateAuthor({ 
        authorFormData: formData, 
        idAuthor: newAuthor.idAuthor 
      }));
    } else {
      console.log('Creating author with payload:', payloadData);
      dispatch(createAuthor(formData));
    }
    
    // Reset
    setNewAuthor({
      nameAuthor: '',
      descriptionAuthor: '',
      nationalityAuthor: '',
      dobAuthor: '',
      dodAuthor: '', // Thêm reset cho dodAuthor
      genderAuthor: 'MALE',
      novels: [],
    });
    setImage(null);
    setIsEditing(false);
    setShowForm(false);
  };

  // Handle edit click
  const handleEditClick = (author) => {
    console.log('Editing author:', author);
    setCurrentAuthor(author);

    const authorData = {
      idAuthor: author.idAuthor,
      nameAuthor: author.nameAuthor || '',
      descriptionAuthor: author.descriptionAuthor || '',
      nationalityAuthor: author.nationalityAuthor || '',
      dobAuthor: author.dobAuthor || '',
      dodAuthor: author.dodAuthor || '', // Thêm dodAuthor cho edit
      genderAuthor: author.genderAuthor || 'MALE',
      novels: Array.isArray(author.novels) ? author.novels.map(n => n.idNovel) : [],
    };
    
    console.log('Setting newAuthor state with:', authorData);
    setNewAuthor(authorData);
    setImage(null);
    setIsEditing(true);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentAuthor(null);
    setImage(null);
    setNewAuthor({
      nameAuthor: '',
      descriptionAuthor: '',
      nationalityAuthor: '',
      dobAuthor: '',
      dodAuthor: '', // Thêm reset dodAuthor
      genderAuthor: 'MALE',
      novels: [],
    });
  };

  // Handle delete author
  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tác giả này không?')) {
      console.log('Deleting author with ID:', id);
      dispatch(deleteAuthor(id));
    }
  };

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'}`}>
        <div className="text-center">
          <div className={`relative ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-3xl p-12 shadow-2xl border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'}`}>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-6"></div>
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-orange-400 to-red-500'} mx-auto w-fit mb-4`}>
              <Users className="w-8 h-8 text-white" />
            </div>
            <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Đang tải dữ liệu tác giả</p>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl border-b ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} sticky top-0 z-40`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-orange-400 to-red-500'} shadow-xl`}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-orange-400 via-red-400 to-pink-400' : 'bg-gradient-to-r from-orange-600 via-red-600 to-pink-600'} bg-clip-text text-transparent`}>
                  Quản Lý Tác Giả
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2 text-lg`}>
                  Quản lý thông tin tác giả và tác phẩm của họ
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className={`group flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-xl hover:shadow-orange-500/25'
                  : 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white shadow-xl hover:shadow-orange-500/25'
              }`}
            >
              <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
              <span className="text-lg">Thêm Tác Giả</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`group ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-3xl p-6 border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Tổng Tác Giả</p>
                <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2`}>{totalAuthors}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>người sáng tác</p>
              </div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 group-hover:from-orange-500/30 group-hover:to-red-600/30' : 'bg-gradient-to-br from-orange-100 to-red-100 group-hover:from-orange-200 group-hover:to-red-200'} transition-all duration-300`}>
                <Users className={`w-10 h-10 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
            </div>
          </div>

          <div className={`group ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-3xl p-6 border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Tác Giả Nam</p>
                <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2`}>
                  {authors.filter(author => author.genderAuthor === 'MALE').length}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                  {authors.length > 0 ? Math.round((authors.filter(author => author.genderAuthor === 'MALE').length / authors.length) * 100) : 0}% tổng số
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 group-hover:from-blue-500/30 group-hover:to-indigo-600/30' : 'bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200'} transition-all duration-300`}>
                <Users className={`w-10 h-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          <div className={`group ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-3xl p-6 border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Tác Giả Nữ</p>
                <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2`}>
                  {authors.filter(author => author.genderAuthor === 'FEMALE').length}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                  {authors.length > 0 ? Math.round((authors.filter(author => author.genderAuthor === 'FEMALE').length / authors.length) * 100) : 0}% tổng số
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-rose-600/20 group-hover:from-pink-500/30 group-hover:to-rose-600/30' : 'bg-gradient-to-br from-pink-100 to-rose-100 group-hover:from-pink-200 group-hover:to-rose-200'} transition-all duration-300`}>
                <Users className={`w-10 h-10 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
              </div>
            </div>
          </div>

          <div className={`group ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-3xl p-6 border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>Có Tác Phẩm</p>
                <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2`}>
                  {authors.filter(author => author.novels && author.novels.length > 0).length}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                  {authors.length > 0 ? Math.round((authors.filter(author => author.novels && author.novels.length > 0).length / authors.length) * 100) : 0}% hoạt động
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 group-hover:from-emerald-500/30 group-hover:to-green-600/30' : 'bg-gradient-to-br from-emerald-100 to-green-100 group-hover:from-emerald-200 group-hover:to-green-200'} transition-all duration-300`}>
                <BookOpen className={`w-10 h-10 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={cancelForm}
              ></div>
              
              <div className={`relative w-full max-w-3xl ${isDarkMode ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-xl rounded-3xl shadow-2xl border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} max-h-[90vh] overflow-y-auto`}>
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-orange-400 to-red-500'} shadow-lg`}>
                        {isEditing ? <PencilLine className="w-7 h-7 text-white" /> : <Plus className="w-7 h-7 text-white" />}
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-orange-400 to-red-400' : 'bg-gradient-to-r from-orange-600 to-red-600'} bg-clip-text text-transparent`}>
                          {isEditing ? 'Chỉnh Sửa Tác Giả' : 'Thêm Tác Giả Mới'}
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          {isEditing ? 'Cập nhật thông tin tác giả' : 'Tạo hồ sơ tác giả mới'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={cancelForm}
                      className={`p-3 rounded-2xl transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Users className="w-5 h-5 mr-2" />
                        Tên Tác Giả
                      </label>
                      <input
                        type="text"
                        value={newAuthor.nameAuthor}
                        onChange={(e) => setNewAuthor({ ...newAuthor, nameAuthor: e.target.value })}
                        className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-orange-500 focus:bg-slate-700/70' 
                            : 'bg-white/80 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-white'
                        } focus:ring-4 focus:ring-orange-500/20 focus:outline-none shadow-lg`}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <BookOpen className="w-5 h-5 mr-2" />
                        Mô Tả
                      </label>
                      <textarea
                        value={newAuthor.descriptionAuthor}
                        onChange={(e) => setNewAuthor({ ...newAuthor, descriptionAuthor: e.target.value })}
                        className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-orange-500 focus:bg-slate-700/70' 
                            : 'bg-white/80 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-white'
                        } focus:ring-4 focus:ring-orange-500/20 focus:outline-none shadow-lg resize-none`}
                        placeholder="Mô tả ngắn về tác giả và phong cách viết..."
                        rows="4"
                      />
                    </div>

                    {/* Nationality and Date of Birth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Globe className="w-5 h-5 mr-2" />
                          Quốc Tịch
                        </label>
                        <input
                          type="text"
                          value={newAuthor.nationalityAuthor}
                          onChange={(e) => setNewAuthor({ ...newAuthor, nationalityAuthor: e.target.value })}
                          className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-orange-500 focus:bg-slate-700/70' 
                              : 'bg-white/80 border-orange-200 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-white'
                          } focus:ring-4 focus:ring-orange-500/20 focus:outline-none shadow-lg`}
                          placeholder="Ví dụ: Việt Nam"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Calendar className="w-5 h-5 mr-2" />
                          Ngày Sinh
                        </label>
                        <input
                          type="date"
                          value={newAuthor.dobAuthor}
                          onChange={(e) => setNewAuthor({ ...newAuthor, dobAuthor: e.target.value })}
                          className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-orange-500 focus:bg-slate-700/70' 
                              : 'bg-white/80 border-orange-200 text-gray-900 focus:border-orange-500 focus:bg-white'
                          } focus:ring-4 focus:ring-orange-500/20 focus:outline-none shadow-lg`}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Calendar className="w-5 h-5 mr-2" />
                          Ngày Mất (tùy chọn)
                        </label>
                        <input
                          type="date"
                          value={newAuthor.dodAuthor}
                          onChange={(e) => setNewAuthor({ ...newAuthor, dodAuthor: e.target.value })}
                          className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-700/50 border-slate-600 text-white focus:border-orange-500 focus:bg-slate-700/70' 
                              : 'bg-white/80 border-orange-200 text-gray-900 focus:border-orange-500 focus:bg-white'
                          } focus:ring-4 focus:ring-orange-500/20 focus:outline-none shadow-lg`}
                        />
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Để trống nếu tác giả còn sống
                        </p>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Users className="w-5 h-5 mr-2" />
                        Giới Tính
                      </label>
                      <select
                        value={newAuthor.genderAuthor}
                        onChange={(e) => setNewAuthor({ ...newAuthor, genderAuthor: e.target.value })}
                        className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600 text-white focus:border-orange-500 focus:bg-slate-700/70' 
                            : 'bg-white/80 border-orange-200 text-gray-900 focus:border-orange-500 focus:bg-white'
                        } focus:ring-4 focus:ring-orange-500/20 focus:outline-none shadow-lg`}
                      >
                        <option value="MALE">👨 Nam</option>
                        <option value="FEMALE">👩 Nữ</option>
                        <option value="OTHER">🏳️‍⚧️ Khác</option>
                      </select>
                    </div>

                    {/* Novels Selection */}
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <BookOpen className="w-5 h-5 mr-2" />
                        Chọn Truyện
                      </label>
                      <Select
                          isMulti
                          isDisabled={false}
                          options={novelOptions}
                          value={novelOptions.filter((opt) => newAuthor.novels.includes(opt.value))}
                          onChange={(selectedOptions) =>
                            setNewAuthor({
                              ...newAuthor,
                              novels: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
                            })
                          }
                          onMenuOpen={() => console.log('Menu opened, novelOptions:', novelOptions)}
                          onMenuClose={() => console.log('Menu closed')}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          placeholder={novelOptions.length > 0 ? "Chọn các truyện của tác giả" : "Đang tải danh sách truyện..."}
                          noOptionsMessage={() => novelOptions.length > 0 ? "Không có tùy chọn" : "Đang tải dữ liệu..."}
                          isLoading={novelOptions.length === 0}
                          menuPlacement="auto"
                          menuShouldBlockScroll={false}
                          menuShouldScrollIntoView={false}
                          closeMenuOnScroll={false}
                          blurInputOnSelect={false}
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              backgroundColor: isDarkMode ? 'rgb(51 65 85 / 0.5)' : 'rgb(255 255 255 / 0.8)',
                              borderColor: 'transparent',
                              borderRadius: '1rem',
                              minHeight: '64px',
                              border: 'none',
                              boxShadow: state.isFocused ? `0 0 0 4px ${isDarkMode ? 'rgb(249 115 22 / 0.2)' : 'rgb(249 115 22 / 0.2)'}` : 'none',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgb(51 65 85 / 0.7)' : 'rgb(255 255 255)',
                              }
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: isDarkMode ? 'rgb(51 65 85)' : 'white',
                              borderRadius: '1rem',
                              border: `2px solid ${isDarkMode ? 'rgb(71 85 105)' : 'rgb(251 146 60)'}`,
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                              marginTop: '8px',
                              zIndex: 99999,
                              position: 'absolute', // Về lại absolute để đúng vị trí
                              width: '100%',
                              pointerEvents: 'auto',
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              padding: '8px',
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected 
                                ? (isDarkMode ? 'rgb(249 115 22)' : 'rgb(249 115 22)')
                                : state.isFocused 
                                  ? (isDarkMode ? 'rgb(71 85 105)' : 'rgb(255 237 213)')
                                  : 'transparent',
                              color: state.isSelected ? 'white' : (isDarkMode ? 'white' : 'rgb(17 24 39)'),
                              padding: '12px 16px',
                              fontSize: '14px',
                              fontWeight: state.isSelected ? '600' : '500',
                              '&:hover': {
                                backgroundColor: state.isSelected 
                                  ? (isDarkMode ? 'rgb(249 115 22)' : 'rgb(249 115 22)')
                                  : (isDarkMode ? 'rgb(71 85 105)' : 'rgb(255 237 213)'),
                              }
                            }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: isDarkMode ? 'rgb(249 115 22)' : 'rgb(255 237 213)',
                              borderRadius: '1rem',
                              padding: '2px 8px',
                              margin: '2px',
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: isDarkMode ? 'white' : 'rgb(17 24 39)',
                              fontWeight: '500',
                              fontSize: '14px',
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: isDarkMode ? 'white' : 'rgb(17 24 39)',
                              borderRadius: '50%',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgb(239 68 68)' : 'rgb(239 68 68)',
                                color: 'white',
                              }
                            }),
                            placeholder: (base) => ({
                              ...base,
                              color: isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)',
                              fontSize: '16px',
                            }),
                            input: (base) => ({
                              ...base,
                              color: isDarkMode ? 'white' : 'rgb(17 24 39)',
                              fontSize: '16px',
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: isDarkMode ? 'white' : 'rgb(17 24 39)',
                              fontSize: '16px',
                            })
                          }}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Camera className="w-5 h-5 mr-2" />
                        Ảnh Đại Diện
                      </label>
                      <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-slate-600 hover:border-orange-500 bg-slate-700/30' 
                          : 'border-orange-200 hover:border-orange-400 bg-orange-50/50'
                      } p-8`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImage(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center">
                          <Camera className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            {image ? image.name : 'Chọn ảnh đại diện'}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Kéo thả hoặc nhấn để chọn ảnh (PNG, JPG, JPEG)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-8">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                          isDarkMode 
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-xl' 
                            : 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white shadow-xl'
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : isEditing ? (
                          <PencilLine className="w-6 h-6" />
                        ) : (
                          <Plus className="w-6 h-6" />
                        )}
                        <span className="text-lg">
                          {loading
                            ? (isEditing ? 'Đang cập nhật...' : 'Đang tạo...')
                            : (isEditing ? 'Cập Nhật Tác Giả' : 'Tạo Tác Giả Mới')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={cancelForm}
                        className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                          isDarkMode 
                            ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border-2 border-slate-600' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200'
                        } shadow-lg`}
                      >
                        <span className="text-lg">Hủy Bỏ</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authors Table */}
        <div className={`${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl rounded-3xl shadow-2xl border ${isDarkMode ? 'border-slate-700/50' : 'border-orange-200/50'} overflow-hidden`}>
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20' : 'bg-gradient-to-br from-orange-100 to-red-100'}`}>
                  <Users className={`w-8 h-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-orange-400 to-red-400' : 'bg-gradient-to-r from-orange-600 to-red-600'} bg-clip-text text-transparent`}>
                    Danh Sách Tác Giả
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Quản lý thông tin {totalAuthors} tác giả trong hệ thống
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-orange-200/30 shadow-xl">
              <table className="min-w-full">
                <thead className={`${isDarkMode ? 'bg-gradient-to-r from-slate-700/80 to-slate-600/80' : 'bg-gradient-to-r from-orange-50 to-amber-50'} backdrop-blur-sm`}>
                  <tr>
                    <th className={`px-8 py-6 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      STT
                    </th>
                    <th className={`px-8 py-6 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      Thông Tin Tác Giả
                    </th>
                    <th className={`px-8 py-6 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      Mô Tả
                    </th>
                    <th className={`px-8 py-6 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      Chi Tiết
                    </th>
                    <th className={`px-8 py-6 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y-2 ${isDarkMode ? 'divide-slate-700/50' : 'divide-orange-100/50'}`}>
                  {Array.isArray(currentAuthors) && currentAuthors.length > 0 ? (
                    currentAuthors.map((author, index) => (
                      <tr key={author.idAuthor} className={`group transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-orange-50/60'}`}>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                            isDarkMode ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 text-orange-400' : 'bg-gradient-to-br from-orange-100 to-red-100 text-orange-600'
                          }`}>
                            {indexOfFirstAuthor + index + 1}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-6">
                            <div className="relative group-hover:scale-105 transition-transform duration-300">
                              <img
                                src={author.imageAuthor}
                                alt={author.nameAuthor}
                                className="w-16 h-16 rounded-2xl object-cover border-3 border-orange-200 shadow-xl"
                              />
                              <div className={`absolute inset-0 rounded-2xl ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                {author.nameAuthor}
                              </p>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                                <p className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Sinh: {author.dobAuthor ? new Date(author.dobAuthor).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
                                </p>
                                {author.dodAuthor && (
                                  <p className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Mất: {new Date(author.dodAuthor).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                              {author.novels && author.novels.length > 0 && (
                                <p className={`text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'} flex items-center mt-1`}>
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {author.novels.length} tác phẩm
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-orange-50/50'} rounded-xl p-4 max-w-xs`}>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                              {author.descriptionAuthor || (
                                <span className={`italic ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Chưa có mô tả
                                </span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Globe className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {author.nationalityAuthor || 'Chưa xác định'}
                              </span>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                                author.genderAuthor === 'MALE' 
                                  ? (isDarkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-800 border border-blue-200')
                                  : author.genderAuthor === 'FEMALE'
                                  ? (isDarkMode ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-pink-100 text-pink-800 border border-pink-200')
                                  : (isDarkMode ? 'bg-gray-600/20 text-gray-400 border border-gray-500/30' : 'bg-gray-100 text-gray-800 border border-gray-200')
                              }`}>
                                {author.genderAuthor === 'MALE' ? '👨 Nam' : author.genderAuthor === 'FEMALE' ? '👩 Nữ' : '🏳️‍⚧️ Khác'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEditClick(author)}
                              className={`group/btn p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                                isDarkMode 
                                  ? 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30' 
                                  : 'bg-orange-100 hover:bg-orange-200 text-orange-600 border border-orange-200'
                              } shadow-lg hover:shadow-xl`}
                              title="Chỉnh sửa tác giả"
                            >
                              <PencilLine className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                            </button>
                            <button
                              onClick={() => handleDelete(author.idAuthor)}
                              className={`group/btn p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                                isDarkMode 
                                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-200'
                              } shadow-lg hover:shadow-xl`}
                              title="Xóa tác giả"
                            >
                              <Trash className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center space-y-6">
                          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-orange-50/50'}`}>
                            <Users className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto`} />
                          </div>
                          <div className="space-y-2">
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Chưa có tác giả nào
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} max-w-md`}>
                              Hệ thống chưa có thông tin tác giả. Hãy thêm tác giả đầu tiên bằng cách nhấn nút "Thêm Tác Giả" ở trên.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowForm(true)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                              isDarkMode 
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' 
                                : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
                            } shadow-lg`}
                          >
                            <Plus className="w-5 h-5" />
                            <span>Thêm Tác Giả Đầu Tiên</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalAuthors > authorsPerPage && (
              <div className="flex justify-center items-center mt-8 space-x-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    currentPage === 1
                      ? (isDarkMode ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                      : (isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600' : 'bg-white hover:bg-orange-50 text-gray-700 border-2 border-orange-200 shadow-lg')
                  }`}
                >
                  <span className="text-lg">← Trước</span>
                </button>
                
                <div className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-lg ${isDarkMode ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'} shadow-xl`}>
                  <span>Trang {currentPage}</span>
                  <span className="opacity-70">của</span>
                  <span>{Math.ceil(totalAuthors / authorsPerPage)}</span>
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalAuthors / authorsPerPage)}
                  className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    currentPage === Math.ceil(totalAuthors / authorsPerPage)
                      ? (isDarkMode ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                      : (isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600' : 'bg-white hover:bg-orange-50 text-gray-700 border-2 border-orange-200 shadow-lg')
                  }`}
                >
                  <span className="text-lg">Sau →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorManager;
