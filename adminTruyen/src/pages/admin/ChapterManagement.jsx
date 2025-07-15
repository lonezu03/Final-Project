import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllChapters, createChapter, deleteChapter, updateChapter } from '../../redux/chapterSlice';
import { PencilLine, Trash } from 'lucide-react';

const ChapterManagement = ({ novel }) => {
  const dispatch = useDispatch();
  // Lấy state từ slice. Giả sử slice có 1 cờ loading chung, đúng với file bạn cung cấp.
  const { chapters, loading, error } = useSelector((state) => state.chapters);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Dùng 1 state duy nhất để lưu object chương đang sửa
  const [currentChapter, setCurrentChapter] = useState(null); 
  const [file, setFile] = useState(null);

  // Trích xuất novelId để làm dependency cho useEffect
  const novelId = novel?.idNovel;

  useEffect(() => {
    // Chỉ dispatch khi có novelId
          dispatch(getAllChapters(novelId));

    if (novelId) {
      dispatch(getAllChapters(novelId));
    }
    // Reset lại trang về 1 mỗi khi đổi truyện
    setCurrentPage(1); 
  }, [novelId, dispatch]);

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
  const handleDeleteClick = (chapterId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chương này không?')) {
      dispatch(deleteChapter(chapterId));
    }
  };

  // Hàm xử lý khi submit form (Cả Tạo Mới và Cập Nhật)
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Tạo object 'request' chứa dữ liệu JSON
    const requestData = {
      titleChapter: e.target.titleChapter.value,
      // viewChapter: parseInt(e.target.viewChapter.value, 10) || 0,
      novel:  novel.idNovel , // Backend có thể cần object novel lồng nhau
    };

    if (isEditing) {
      // Nếu đang sửa, thêm idChapter vào object request
      requestData.idChapter = currentChapter.idChapter;
      
      // 2. Dispatch action 'updateChapter' với payload đúng cấu trúc
      dispatch(updateChapter({ 
        request: requestData, 
        textFile: file 
      }));
    } else {
      // 3. Dispatch action 'createChapter' với payload đúng cấu trúc
      dispatch(createChapter({ 
        request: requestData, 
        textFile: file 
      }));
    }
    
    cancelForm(); // Đóng và reset form sau khi hoàn tất
  };

  // Logic phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 5;
  const indexOfLastChapter = currentPage * chaptersPerPage;
  const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage;
  const currentChaptersToDisplay = chapters.slice(indexOfFirstChapter, indexOfLastChapter);
  const paginate = (page) => setCurrentPage(page);

  return (
    <div className="p-4 border-t-2 border-gray-200 mt-8">
      <h1 className="text-xl font-bold mb-4">Quản lý chương cho: <span className="text-blue-600">{novel.nameNovel}</span></h1>

      <button onClick={() => { setIsEditing(false); setCurrentChapter(null); setShowForm(true); }} className="bg-green-500 text-white p-2 rounded mb-4 hover:bg-green-600 transition-colors">
        Thêm Chương Mới
      </button>

      {/* Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-gray opacity-50  z-40" onClick={cancelForm}></div>
          <div className="fixed inset-0 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Sửa Thông Tin Chương' : 'Tạo Chương Mới'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="titleChapter" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề chương</label>
                  <input
                    id="titleChapter"
                    name="titleChapter"
                    type="text"
                    defaultValue={isEditing ? currentChapter?.titleChapter : ''}
                    placeholder="Ví dụ: Chương 1: Khởi đầu mới"
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  
                </div>
                <div className="mb-6">
                  <label htmlFor="chapterFile" className="block text-sm font-medium text-gray-700 mb-1">
                    File nội dung (.txt) {isEditing && "(Để trống nếu không muốn thay đổi)"}
                  </label>
                  <input
                    id="chapterFile"
                    type="file"
                    accept=".txt"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="border border-gray-300 p-2 w-full rounded-md"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={cancelForm} className="bg-gray-500 text-white py-2 px-4 rounded-md w-full hover:bg-gray-600 transition-colors">
                    Hủy
                  </button>
                  <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md w-full hover:bg-blue-700 transition-colors" disabled={loading}>
                    {loading ? 'Đang xử lý...' : isEditing ? 'Lưu Thay Đổi' : 'Tạo Chương'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Bảng dữ liệu và các trạng thái */}
      {loading && <p className="text-center mt-4">Đang tải danh sách chương...</p>}
      {error && <p className="text-center mt-4 text-red-500">Lỗi: {error}</p>}
      {!loading && chapters.length === 0 && (
        <div className="text-center mt-8 p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">Chưa có chương nào cho truyện này.</p>
        </div>
      )}

      {chapters.length > 0 && (
        <>
          <table className="table-auto w-full mt-4 border-collapse border border-gray-300 text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border border-gray-300">#</th>
                <th className="px-4 py-2 border border-gray-300">Tiêu đề</th>
                <th className="px-4 py-2 border border-gray-300">Lượt xem</th>
                <th className="px-4 py-2 border border-gray-300 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentChaptersToDisplay.map((chapter, index) => (
                <tr key={chapter.idChapter} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 border border-gray-300">{indexOfFirstChapter + index + 1}</td>
                  <td className="px-4 py-2 border border-gray-300">{chapter.titleChapter}</td>
                  <td className="px-4 py-2 border border-gray-300">{chapter.viewChapter}</td>
                  <td className="px-4 py-2 border border-gray-300 text-center">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => handleEditClick(chapter)} className="text-blue-600 hover:text-blue-800" title="Sửa"><PencilLine size={18} /></button>
                      <button onClick={() => handleDeleteClick(chapter.idChapter)} className="text-red-600 hover:text-red-800" title="Xóa"><Trash size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-4">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-l-md hover:bg-gray-300 disabled:opacity-50">
              Trước
            </button>
            <span className="px-4 py-2 bg-gray-100 border-t border-b border-gray-200">
              Trang {currentPage}
            </span>
            <button onClick={() => paginate(currentPage + 1)} disabled={indexOfLastChapter >= chapters.length} className="px-4 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300 disabled:opacity-50">
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChapterManagement;