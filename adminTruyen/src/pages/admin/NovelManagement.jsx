import React, { useEffect, useState,useRef  } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    getAllNovels, createNovel, deleteNovel, updateNovel, 
    addAuthorToNovel, addCategoryToNovel 
} from '../../redux/novelSlice'; // Thêm icon BookOpen
import ChapterManagement from './ChapterManagement';
import { PencilLine, Trash, Star, BookOpen, UserPlus, Tag, ScanSearch } from 'lucide-react';
import Select from 'react-select';



const PreviewModal = ({ novel, onClose }) => {
  if (!novel) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black opacity-50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold">Xem trước: {novel.nameNovel}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <img 
                src={novel.imageNovel} 
                alt={novel.nameNovel} 
                className="w-full h-64 object-cover rounded-md"
              />
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="font-semibold text-lg">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Trạng thái</p>
                    <p>{novel.statusNovel === 'CONTINUE' ? 'Đang tiến hành' : 
                        novel.statusNovel === 'COMPLETED' ? 'Hoàn thành' : 'Tạm ngưng'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số chương</p>
                    <p>{novel.totalChapter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đánh giá</p>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-500 stroke-yellow-500" />
                      <span>{novel.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg">Mô tả</h4>
                <p className="mt-2 text-gray-700">{novel.descriptionNovel}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg">Tác giả</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {novel.authors?.length > 0 ? (
                    novel.authors.map(author => (
                      <span key={author.idAuthor} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {author.nameAuthor}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Chưa có tác giả</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg">Thể loại</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {novel.categories?.length > 0 ? (
                    novel.categories.map(category => (
                      <span key={category.idCategory} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {category.nameCategory}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Chưa có thể loại</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
const AddToNovelModal = ({
    show,
    onClose,
    title,
    options,
    onSubmit,
    isLoading
}) => {
    const [selectedId, setSelectedId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedId) {
            onSubmit(selectedId);
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black opacity-50 z-40" onClick={onClose}></div>
            <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">{title}</h3>
                    <form onSubmit={handleSubmit}>
                        <Select
                            options={options}
                            onChange={(option) => setSelectedId(option.value)}
                            placeholder="Chọn một mục..."
                            className="mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Hủy</button>
                            <button type="submit" disabled={!selectedId || isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                {isLoading ? 'Đang thêm...' : 'Thêm'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
const NovelManager = () => {
  const dispatch = useDispatch();
  const { novels, loading, error } = useSelector((state) => state.novels);
  const { authors } = useSelector((state) => state.authors);
  const { categories } = useSelector((state) => state.categories); 

  // State để quản lý novel nào đang được chọn để xem chương
  const [selectedNovel, setSelectedNovel] = useState(null); 
  const [previewNovel, setPreviewNovel] = useState(null);
  // States cho Form
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNovel, setCurrentNovel] = useState(null); // Dùng để lưu novel đang edit
  const [image, setImage] = useState(null); // Dùng cho file ảnh upload
  const [selectedAuthorIds, setSelectedAuthorIds] = useState([]);
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [novelToUpdate, setNovelToUpdate] = useState(null); // Lưu lại novel đang được thao tác
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRefs = useRef({}); // Dùng để xử lý click ra ngoài
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);




   useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId && dropdownRefs.current[openDropdownId] && !dropdownRefs.current[openDropdownId].contains(event.target)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdownId]);


    // Hàm bật/tắt dropdown cho một novel cụ thể
    const toggleDropdown = (novelId) => {
        setOpenDropdownId(openDropdownId === novelId ? null : novelId);
    };
  // Chuyển đổi author data cho component Select
  // const authorOptions = authors.map(author => ({
  //   value: author.idAuthor,
  //   label: author.nameAuthor,
  // }));
  const authorOptions = authors.map(author => ({ value: author.idAuthor, label: author.nameAuthor }));
  const categoryOptions = categories.map(category => ({ value: category.idCategory, label: category.nameCategory }));

    // Hàm xử lý khi thêm tác giả
    const handleAddAuthorSubmit = (authorId) => {
    if (novelToUpdate && authorId) {
        dispatch(addAuthorToNovel({ idNovel: novelToUpdate.idNovel, idAuthor: authorId }))
            .unwrap()
            .then(() => {
                setShowAddAuthorModal(false); // Đóng modal khi thành công
                setNovelToUpdate(null);
            })
            .catch(err => {
                console.error("Lỗi khi thêm tác giả:", err);
                toast.error("Không thể thêm tác giả");
            });
    } else {
        toast.error("Vui lòng chọn tác giả");
    }
};
    
const handleAddCategorySubmit = (categoryId) => {
    if (novelToUpdate && categoryId) {
        dispatch(addCategoryToNovel({ idNovel: novelToUpdate.idNovel, idCategory: categoryId }))
            .unwrap()
            .then(() => {
                setShowAddCategoryModal(false);
                setNovelToUpdate(null);
            })
            .catch(err => {
                console.error("Lỗi khi thêm thể loại:", err);
                toast.error("Không thể thêm thể loại");
            });
    } else {
        toast.error("Vui lòng chọn thể loại");
    }
};

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
    const categoryIds = Array.isArray(novel.categories) ? novel.categories.map(cat => cat.idCategory) : [];
    setCurrentNovel(novel);
    setSelectedAuthorIds(authorIds); // Cập nhật state cho Select component
    setSelectedCategoryIds(categoryIds);
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
    if (!e.target.nameNovel.value || e.target.nameNovel.value.length < 3 || e.target.nameNovel.value.length > 100) {
      alert('Tên truyện phải có độ dài từ 3 đến 100 ký tự!');
      return;
    }
    if (e.target.descriptionNovel.value.length > 200) {
      alert('Mô tả có độ dài tối đa 200 ký tự!');
      return;
    }
    // Tạo payload từ các input của form
    const payload = {
      nameNovel: e.target.nameNovel.value,
      descriptionNovel: e.target.descriptionNovel.value,
      //totalChapter: parseInt(e.target.totalChapter.value, 10) || 0,
      //rating: parseFloat(e.target.rating.value) || 0,
      statusNovel: e.target.statusNovel.value,
      category: selectedCategoryIds,
    authors: selectedAuthorIds,    // Mảng string
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
          <div className="fixed inset-0 bg-gray opacity-50 bg-opacity-50 z-40" onClick={cancelForm}></div>
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
                  {/* <div>
                    <label htmlFor="totalChapter" className="block text-sm font-medium text-gray-700 mb-1">Tổng số chương</label>
                    <input id="totalChapter" name="totalChapter" type="number" defaultValue={isEditing ? currentNovel?.totalChapter : 0} className="border border-gray-300 p-2 w-full rounded-md" />
                  </div>
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                    <input id="rating" name="rating" type="number" step="0.1" max="5" min="0" defaultValue={isEditing ? currentNovel?.rating : 0} className="border border-gray-300 p-2 w-full rounded-md" />
                  </div> */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                  <Select
                    isMulti
                    options={categoryOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    defaultValue={categoryOptions.filter(option => selectedCategoryIds.includes(option.value))}
                    onChange={(selected) => setSelectedCategoryIds(selected.map(opt => opt.value))}
                    placeholder="Chọn thể loại..."
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
                      <div className="relative">
                      <button 
                        title="Xem trước" 
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200"
                        onClick={(e) => { e.stopPropagation(); setPreviewNovel(novel); }}
                      >
                        <ScanSearch size={18} />
                      </button>
                      
                      {/* Dropdown Menu - Hiển thị dựa trên state `openDropdownId` */}
                      {openDropdownId === novel.idNovel && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border rounded-md shadow-lg z-20">
                          <button 
                            onClick={() => { setNovelToUpdate(novel); setShowAddAuthorModal(true); setOpenDropdownId(null); }} 
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <UserPlus size={16} /> Thêm tác giả
                          </button>
                          <button 
                            onClick={() => { setNovelToUpdate(novel); setShowAddCategoryModal(true); setOpenDropdownId(null); }} 
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Tag size={16} /> Thêm thể loại
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Preview Modal */}
          {previewNovel && (
            <PreviewModal 
              novel={previewNovel} 
              onClose={() => setPreviewNovel(null)} 
            />
          )}
         <AddToNovelModal 
                show={showAddAuthorModal}
                onClose={() => setShowAddAuthorModal(false)}
                title={`Thêm tác giả cho: ${novelToUpdate?.nameNovel}`}
                options={authorOptions}
                onSubmit={handleAddAuthorSubmit}
                isLoading={loading}
            />
            <AddToNovelModal 
                show={showAddCategoryModal}
                onClose={() => setShowAddCategoryModal(false)}
                title={`Thêm thể loại cho: ${novelToUpdate?.nameNovel}`}
                options={categoryOptions}
                onSubmit={handleAddCategorySubmit}
                isLoading={loading}
            />
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