import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllNovels, createNovel, deleteNovel, updateNovel } from '../../redux/novelSlice';
// Thêm icon BookOpen
import { PencilLine, Trash, Star, BookMarked, BookOpen } from 'lucide-react'; 
import Select from 'react-select';
import ChapterManagement from './ChapterManagement';

const NovelManager = () => {
  const dispatch = useDispatch();
  const { novels, loading, error } = useSelector((state) => state.novels);
  const { authors } = useSelector((state) => state.authors);

  // State để quản lý novel nào đang được chọn để xem chương
  const [selectedNovel, setSelectedNovel] = useState(null); 
  
  // States cho Form
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNovel, setCurrentNovel] = useState(null); // Dùng để lưu novel đang edit
  const [image, setImage] = useState(null); // Dùng cho file ảnh upload
  const [selectedAuthorIds, setSelectedAuthorIds] = useState([]);

  // Chuyển đổi author data cho component Select
  const authorOptions = authors.map(author => ({
    value: author.idAuthor,
    label: author.nameAuthor,
  }));

  // Hàm xử lý đóng form và reset các state liên quan
  const cancelForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentNovel(null);
    setImage(null);
    setSelectedAuthorIds([]);
  };

  // Hàm xử lý khi nhấn nút Sửa
  const handleEditClick = (novel) => {
    // Lấy danh sách ID tác giả từ object novel
    const authorIds = Array.isArray(novel.authors) ? novel.authors.map(author => author.idAuthor) : [];
    
    setCurrentNovel(novel);
    setSelectedAuthorIds(authorIds); // Cập nhật state cho Select component
    setIsEditing(true);
    setShowForm(true);
  };

  // Hàm xử lý khi nhấn nút Xóa
  const handleDeleteNovel = (idNovel) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa truyện này? Tất cả các chương liên quan cũng sẽ bị xóa.')) {
      dispatch(deleteNovel(idNovel));
      // Nếu truyện đang được chọn bị xóa, hãy bỏ chọn nó để ẩn ChapterManagement
      if (selectedNovel && selectedNovel.idNovel === idNovel) {
        setSelectedNovel(null);
      }
    }
  };

  // Hàm xử lý khi submit form (Cả Tạo Mới và Cập Nhật)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Tạo payload từ các input của form
    const payload = {
      nameNovel: e.target.nameNovel.value,
      descriptionNovel: e.target.descriptionNovel.value,
      totalChapter: parseInt(e.target.totalChapter.value, 10) || 0,
      rating: parseFloat(e.target.rating.value) || 0,
      statusNovel: e.target.statusNovel.value,
      authors: selectedAuthorIds.map(id => ({ idAuthor: id })), // Gửi dưới dạng list object
    };
    
    // Tạo FormData để có thể gửi cả file và dữ liệu JSON
    const formData = new FormData();
    formData.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (image) {
      formData.append("image", image);
    }

    if (isEditing) {
      // Thêm idNovel vào payload khi cập nhật
      payload.idNovel = currentNovel.idNovel;
      // Gửi lại payload đã cập nhật vào FormData
      formData.set("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      dispatch(updateNovel(formData));
    } else {
      dispatch(createNovel(formData));
    }
    
    cancelForm();
  };

  // Hàm xử lý bật/tắt hiển thị component ChapterManagement
  const handleViewChapters = (novel) => {
    if (selectedNovel && selectedNovel.idNovel === novel.idNovel) {
      setSelectedNovel(null); // Nếu click lại truyện đang chọn -> ẩn đi
    } else {
      setSelectedNovel(novel); // Nếu click truyện khác -> chọn truyện đó
    }
  };

  // Logic phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const novelsPerPage = 5;
  const totalNovels = novels.length;
  const indexOfLastNovel = currentPage * novelsPerPage;
  const indexOfFirstNovel = indexOfLastNovel - novelsPerPage;
  const currentNovelsToDisplay = novels.slice(indexOfFirstNovel, indexOfLastNovel);
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= Math.ceil(totalNovels / novelsPerPage)) {
        setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Quản lý truyện</h1>

      <button onClick={() => { setIsEditing(false); setCurrentNovel(null); setShowForm(true); }} className="bg-green-500 text-white p-2 rounded mb-4 hover:bg-green-600 transition-colors">
        Thêm Truyện Mới
      </button>

      {/* Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={cancelForm}></div>
          <div className="fixed inset-0 flex justify-center items-center z-50 overflow-y-auto py-10">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Sửa Thông Tin Truyện' : 'Tạo Truyện Mới'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nameNovel" className="block text-sm font-medium text-gray-700 mb-1">Tên truyện</label>
                  <input id="nameNovel" name="nameNovel" type="text" required defaultValue={isEditing ? currentNovel?.nameNovel : ''} className="border border-gray-300 p-2 w-full rounded-md" />
                </div>
                <div>
                  <label htmlFor="descriptionNovel" className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea id="descriptionNovel" name="descriptionNovel" rows="4" defaultValue={isEditing ? currentNovel?.descriptionNovel : ''} className="border border-gray-300 p-2 w-full rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="totalChapter" className="block text-sm font-medium text-gray-700 mb-1">Tổng số chương</label>
                    <input id="totalChapter" name="totalChapter" type="number" defaultValue={isEditing ? currentNovel?.totalChapter : 0} className="border border-gray-300 p-2 w-full rounded-md" />
                  </div>
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                    <input id="rating" name="rating" type="number" step="0.1" max="5" min="0" defaultValue={isEditing ? currentNovel?.rating : 0} className="border border-gray-300 p-2 w-full rounded-md" />
                  </div>
                </div>
                <div>
                  <label htmlFor="statusNovel" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select id="statusNovel" name="statusNovel" defaultValue={isEditing ? currentNovel?.statusNovel : 'CONTINUE'} className="border border-gray-300 p-2 w-full rounded-md">
                    <option value="CONTINUE">Đang tiến hành</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="DROP">Tạm ngưng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                  <Select
                    isMulti
                    options={authorOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    defaultValue={authorOptions.filter(option => selectedAuthorIds.includes(option.value))}
                    onChange={(selected) => setSelectedAuthorIds(selected.map(opt => opt.value))}
                    placeholder="Chọn tác giả..."
                  />
                </div>
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa</label>
                  <input id="image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="border border-gray-300 p-2 w-full rounded-md" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={cancelForm} className="bg-gray-500 text-white py-2 px-4 rounded-md w-full hover:bg-gray-600 transition-colors">Hủy</button>
                  <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md w-full hover:bg-blue-700 transition-colors" disabled={loading}>
                    {loading ? 'Đang xử lý...' : isEditing ? 'Lưu Thay Đổi' : 'Tạo Truyện'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Bảng Dữ Liệu */}
      {loading && novels.length === 0 && <p className="text-center mt-6">Đang tải danh sách truyện...</p>}
      {error && <p className="text-red-500 text-center mt-6">Lỗi: {error}</p>}
      <div className="relative overflow-x-auto rounded-lg shadow-md mt-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-200 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Tên truyện</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3 text-center">Số chương</th>
              <th className="px-6 py-3 text-center">Đánh giá</th>
              <th className="px-6 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentNovelsToDisplay.map((novel, index) => (
              <tr key={novel.idNovel} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{indexOfFirstNovel + index + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-x-3">
                    <img src={novel.imageNovel} alt={novel.nameNovel} className="w-12 h-16 rounded-md object-cover flex-shrink-0"/>
                    <span className="font-semibold">{novel.nameNovel}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{novel.statusNovel}</td>
                <td className="px-6 py-4 text-center">{novel.totalChapter}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={16} className="fill-yellow-500 stroke-yellow-500" /> 
                    <span>{novel.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center items-center gap-x-4">
                    <button title="Quản lý chương" className="text-green-600 hover:text-green-800" onClick={(e) => { e.stopPropagation(); handleViewChapters(novel); }}>
                      <BookOpen size={20} />
                    </button>
                    <button title="Sửa truyện" className="text-blue-600 hover:text-blue-800" onClick={(e) => { e.stopPropagation(); handleEditClick(novel); }}>
                      <PencilLine size={20} />
                    </button>
                    <button title="Xóa truyện" className="text-red-600 hover:text-red-800" onClick={(e) => { e.stopPropagation(); handleDeleteNovel(novel.idNovel); }}>
                      <Trash size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-6">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-l-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
          Trước
        </button>
        <span className="px-4 py-2 bg-white border-t border-b border-gray-200">
          Trang {currentPage} / {Math.ceil(totalNovels / novelsPerPage) || 1}
        </span>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === Math.ceil(totalNovels / novelsPerPage)} className="px-4 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
          Sau
        </button>
      </div>

      {/* VÙNG HIỂN THỊ COMPONENT QUẢN LÝ CHƯƠNG */}
      {selectedNovel && (
        <div className="mt-8 transition-all duration-500">
          <ChapterManagement novel={selectedNovel} />
        </div>
      )}
    </div>
  );
};

export default NovelManager;