import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllChapters, createChapter, deleteChapter, updateChapter, clearChapters, getChapterById } from '../../redux/chapterSlice';
import { PencilLine, Trash, Plus, Eye, BookOpen, Coins, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const ChapterManagement = ({ novel }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  // Lấy state từ slice. Giả sử slice có 1 cờ loading chung, đúng với file bạn cung cấp.
  const { chapters, loading, error } = useSelector((state) => state.chapters);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Dùng 1 state duy nhất để lưu object chương đang sửa
  const [currentChapter, setCurrentChapter] = useState(null); 
  const [file, setFile] = useState(null);
  const [showFormpre, setShowFormpre] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // State để lưu nội dung chương cần preview
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Trích xuất novelId để làm dependency cho useEffect
  const novelId = novel?.idNovel;

  useEffect(() => {
    // Chỉ dispatch khi có novelId
    if (novelId) {
      console.log('ChapterManagement: Fetching chapters for novelId:', novelId);
      // Clear chapters trước khi fetch data mới
      dispatch(clearChapters());
      dispatch(getAllChapters(novelId));
    }
    // Reset lại trang về 1 mỗi khi đổi truyện
    setCurrentPage(1); 
  }, [novelId, dispatch]);

  // Debug effect để track error
  useEffect(() => {
    if (error) {
      console.error('ChapterManagement Error:', error);
    }
  }, [error]);

  // Nếu không có novel được truyền vào, không render gì cả.
  // Đây là một "guard clause" để component tự ẩn đi.
  if (!novel) {
    return null;
  }

  // Hàm để đóng form và reset các state liên quan
  const cancelForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentChapter(null);
    setFile(null);
  };

  // Hàm xử lý khi nhấn nút Sửa
  const handleEditClick = (chapter) => {
    setCurrentChapter(chapter); // Lưu lại object chương cần sửa
    setIsEditing(true);
    setShowForm(true);
  };

  // Hàm xử lý khi nhấn nút Xóa
  const handleDeleteClick = async (chapterId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chương này không?')) {
      try {
        await dispatch(deleteChapter(chapterId)).unwrap();
        toast.success('Xóa chương thành công!');
      } catch (error) {
        toast.error('Xóa chương thất bại!');
        console.error('Error deleting chapter:', error);
      }
    }
  };
  

  // Hàm xử lý khi submit form (Cả Tạo Mới và Cập Nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const chapterTitle = e.target.titleChapter.value;
    if (!chapterTitle || chapterTitle.length < 3 || chapterTitle.length > 50) {
        toast.error('Tên chương phải có độ dài từ 3 đến 50 ký tự!');
        return;
    }
    // 1. Tạo object 'request' chứa dữ liệu JSON
    const coinPriceValue = parseInt(e.target.coinPrice.value, 10) || 0;
    const cointRentPriceValue = parseInt(e.target.cointRentPrice.value, 10) || 0;
    const dayRentAmountValue = parseInt(e.target.dayRentAmount.value, 10) || 0;
    
    const requestData = {
      titleChapter: e.target.titleChapter.value,
      novel:  novel.idNovel,
      coinPrice: coinPriceValue,
      cointRentPrice: cointRentPriceValue,
      dayRentAmount: dayRentAmountValue
    };

    try {
      if (isEditing) {
        // Nếu đang sửa, thêm idChapter vào object request
        requestData.idChapter = currentChapter.idChapter;
        await dispatch(updateChapter({ 
          request: requestData, 
          textFile: file 
        })).unwrap();
        toast.success('Cập nhật chương thành công!');
      } else {
        await dispatch(createChapter({ 
          request: requestData, 
          textFile: file 
        })).unwrap();
        toast.success('Tạo chương mới thành công!');
      }
      cancelForm(); // Đóng và reset form sau khi hoàn tất
    } catch (error) {
      toast.error(isEditing ? 'Cập nhật chương thất bại!' : 'Tạo chương thất bại!');
      console.error('Error:', error);
    }
  };

  // Logic phân trang
  const chaptersPerPage = 5;
  
  // Lọc chapters theo search term
  const filteredChapters = Array.isArray(chapters) ? chapters.filter(chapter =>
    chapter.titleChapter?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  
  // Debug logging - sau khi filteredChapters được khởi tạo
  console.log('ChapterManagement Debug:', {
    novelId: novel?.idNovel,
    chapters: chapters,
    chaptersLength: chapters?.length,
    loading: loading,
    error: error,
    searchTerm: searchTerm,
    filteredChaptersLength: filteredChapters?.length
  });
  
  const indexOfLastChapter = currentPage * chaptersPerPage;
  const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage;
  const currentChaptersToDisplay = filteredChapters.slice(indexOfFirstChapter, indexOfLastChapter);
  const paginate = (page) => setCurrentPage(page);

  // Hàm xử lý khi nhấn nút Preview
  const handlepreviewClick = async (chapter) => {
    setPreviewTitle(chapter.titleChapter);
    setShowPreview(true);
    setLoadingPreview(true);
    
    try {
      // Gọi API để lấy nội dung đầy đủ của chapter
      const result = await dispatch(getChapterById(chapter.idChapter)).unwrap();
      
      if (result && result.contentChapter) {
        setPreviewContent(result.contentChapter);
      } else {
        setPreviewContent('⚠️ Không thể tải nội dung chapter này.');
      }
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      setPreviewContent('❌ Lỗi khi tải nội dung chapter: ' + (error || 'Không xác định'));
      toast.error('Không thể tải nội dung chapter!');
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Quản lý chương cho: <span className="text-blue-600 dark:text-blue-400">{novel.nameNovel}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Quản lý các chương của truyện một cách dễ dàng
          </p>
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Chương</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Array.isArray(chapters) ? chapters.length : 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Lượt Xem</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {Array.isArray(chapters) ? chapters.reduce((total, chapter) => total + (chapter.viewChapter || 0), 0) : 0}
              </p>
             
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
              <Eye className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Trung Bình Coin Mua</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {Array.isArray(chapters) && chapters.length > 0 ? Math.round(chapters.reduce((total, chapter) => total + (chapter.coinPrice || 0), 0) / chapters.length) : 0}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
              <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Trung Bình Coin Thuê</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {Array.isArray(chapters) && chapters.length > 0 ? Math.round(chapters.reduce((total, chapter) => total + (chapter.cointRentPrice || 0), 0) / chapters.length) : 0}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
              <Coins className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên chương..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
          />
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Add Chapter Button */}
      <div className="mb-8">
        <button 
          onClick={() => { setIsEditing(false); setCurrentChapter(null); setShowForm(true); }} 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Thêm Chương Mới
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowPreview(false)}></div>
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Xem trước chương
                    </h2>
                  </div>
                  <button 
                    onClick={() => setShowPreview(false)} 
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {previewTitle}
                </h3>
                
                {loadingPreview ? (
                  <div className="bg-slate-50/80 dark:bg-slate-700/80 rounded-xl p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-slate-600 dark:text-slate-300">Đang tải nội dung chapter...</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Gọi API getChapterById để lấy nội dung đầy đủ
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50/80 dark:bg-slate-700/80 rounded-xl p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                      {previewContent}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50">
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={cancelForm}></div>
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-lg">
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {isEditing ? 'Sửa Thông Tin Chương' : 'Tạo Chương Mới'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label htmlFor="titleChapter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tiêu đề chương
                  </label>
                  <input
                    id="titleChapter"
                    name="titleChapter"
                    type="text"
                    defaultValue={isEditing ? currentChapter?.titleChapter : ''}
                    placeholder="Ví dụ: Chương 1: Khởi đầu mới"
                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="coinPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Giá coin mua
                  </label>
                  <input
                    id="coinPrice"
                    name="coinPrice"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={isEditing ? currentChapter?.coinPrice || 0 : 0}
                    placeholder="Nhập giá coin để mua vĩnh viễn chương này"
                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cointRentPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Giá coin thuê
                  </label>
                  <input
                    id="cointRentPrice"
                    name="cointRentPrice"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={isEditing ? currentChapter?.cointRentPrice || 0 : 0}
                    placeholder="Nhập giá coin để thuê chương này"
                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dayRentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Số ngày thuê
                  </label>
                  <input
                    id="dayRentAmount"
                    name="dayRentAmount"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={isEditing ? currentChapter?.dayRentAmount || 1 : 1}
                    placeholder="Nhập số ngày cho phép thuê"
                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="chapterFile" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    File nội dung (.txt) {isEditing && "(Để trống nếu không muốn thay đổi)"}
                  </label>
                  <input
                    id="chapterFile"
                    type="file"
                    accept=".txt"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={cancelForm} 
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : isEditing ? 'Lưu Thay Đổi' : 'Tạo Chương'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-slate-600 dark:text-slate-300">Đang tải danh sách chương...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* {error && (
        <div className="text-center">
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl rounded-2xl p-8 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">Lỗi: {error}</p>
          </div>
        </div>
      )} */}
      
      {!loading && (!Array.isArray(chapters) || chapters.length === 0) && (
        <div className="text-center">
          <div className="bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur-xl rounded-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-600 rounded-full">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Chưa có chương nào cho truyện này.</p>
            </div>
          </div>
        </div>
      )}

      {Array.isArray(chapters) && chapters.length > 0 && (
        <>
          {/* Chapters Table */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Danh Sách Chương
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-200/50 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tiêu đề</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Lượt xem</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Coin Mua</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Coin Thuê</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày Thuê</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentChaptersToDisplay.map((chapter, index) => (
                    <tr key={chapter.idChapter} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {indexOfFirstChapter + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{chapter.titleChapter}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-500 dark:text-slate-400">{chapter.viewChapter}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{chapter.coinPrice || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{chapter.cointRentPrice || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{chapter.dayRentAmount || 0} ngày</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(chapter)} 
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200" 
                            title="Sửa"
                          >
                            <PencilLine size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(chapter.idChapter)} 
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200" 
                            title="Xóa"
                          >
                            <Trash size={18} />
                          </button>
                          <button 
                            onClick={() => handlepreviewClick(chapter)} 
                            className="p-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200" 
                            title="Xem trước"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center items-center p-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-2 flex items-center gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Trước
                </button>
                <span className="px-6 py-2 text-slate-700 dark:text-slate-300 font-medium">
                  Trang {currentPage}
                </span>
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={indexOfLastChapter >= filteredChapters.length} 
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChapterManagement;