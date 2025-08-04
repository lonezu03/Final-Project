import React, { useEffect, useState,useRef  } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    getAllNovels, createNovel, deleteNovel, updateNovel, 
    addAuthorToNovel, addCategoryToNovel 
} from '../../redux/novelSlice'; // Thêm icon BookOpen
import ChapterManagement from './ChapterManagement';
import { PencilLine, Trash, Star, BookOpen, UserPlus, Tag, ScanSearch, Plus, Book, Eye, CheckCircle, Clock, Users } from 'lucide-react';
import Select from 'react-select';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import defaultNovelImage from '../../assets/image.png';



const PreviewModal = ({ novel, onClose }) => {
  if (!novel) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Xem trước: {novel.nameNovel}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="relative group">
                  <img 
                    src={novel.imageNovel || defaultNovelImage} 
                    alt={novel.nameNovel} 
                    className="w-full h-80 object-cover rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-700"
                    onError={(e) => {
                      e.target.src = defaultNovelImage;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                </div>
              </div>
              
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-50/80 dark:bg-slate-700/80 rounded-xl p-4">
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Trạng thái</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        novel.statusNovel === 'CONTINUE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        novel.statusNovel === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {novel.statusNovel === 'CONTINUE' ? 'Đang tiến hành' : 
                         novel.statusNovel === 'COMPLETED' ? 'Hoàn thành' : 'Tạm ngưng'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Số chương</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{novel.totalChapter}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Đánh giá</p>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="fill-yellow-500 stroke-yellow-500" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{novel.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50/80 dark:bg-slate-700/80 rounded-xl p-4">
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3">Mô tả</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{novel.descriptionNovel}</p>
                </div>
                
                <div className="bg-slate-50/80 dark:bg-slate-700/80 rounded-xl p-4">
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3">Tác giả</h4>
                  <div className="flex flex-wrap gap-2">
                    {novel.authors?.length > 0 ? (
                      novel.authors.map(author => (
                        <span key={author.idAuthor} className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                          {author.nameAuthor}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">Chưa có tác giả</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50/80 dark:bg-slate-700/80 rounded-xl p-4">
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3">Thể loại</h4>
                  <div className="flex flex-wrap gap-2">
                    {novel.categories?.length > 0 ? (
                      novel.categories.map(category => (
                        <span key={category.idCategory} className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
                          {category.nameCategory}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">Chưa có thể loại</p>
                    )}
                  </div>
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose}></div>
            <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-md p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Select
                            options={options}
                            onChange={(option) => setSelectedId(option.value)}
                            placeholder="Chọn một mục..."
                            className="react-select-container"
                            classNamePrefix="react-select"
                            autoFocus
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: 'rgb(248 250 252)',
                                    borderColor: 'rgb(226 232 240)',
                                    borderRadius: '0.75rem',
                                    padding: '0.25rem',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        borderColor: 'rgb(99 102 241)'
                                    }
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected 
                                        ? 'rgb(99 102 241)' 
                                        : state.isFocused 
                                        ? 'rgb(238 242 255)' 
                                        : 'white',
                                    color: state.isSelected ? 'white' : 'rgb(51 65 85)'
                                })
                            }}
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit" 
                                disabled={!selectedId || isLoading} 
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                            >
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
  const { theme } = useTheme();
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
  const [searchTerm, setSearchTerm] = useState('');


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
  const handleDeleteNovel = async (idNovel) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa truyện này? Tất cả các chương liên quan cũng sẽ bị xóa.')) {
      try {
        await dispatch(deleteNovel(idNovel)).unwrap();
        toast.success('Xóa truyện thành công!');
        // Nếu truyện đang được chọn bị xóa, hãy bỏ chọn nó để ẩn ChapterManagement
        if (selectedNovel && selectedNovel.idNovel === idNovel) {
          setSelectedNovel(null);
        }
      } catch (error) {
        toast.error('Xóa truyện thất bại!');
        console.error('Error deleting novel:', error);
      }
    }
  };

  // Hàm xử lý khi submit form (Cả Tạo Mới và Cập Nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!e.target.nameNovel.value || e.target.nameNovel.value.length < 3 || e.target.nameNovel.value.length > 100) {
      toast.error('Tên truyện phải có độ dài từ 3 đến 100 ký tự!');
      return;
    }
    if (e.target.descriptionNovel.value.length > 2000) {
      toast.error('Mô tả có độ dài tối đa 2000 ký tự!');
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
    if (!image&& !isEditing) {
      // Nếu không có ảnh, fetch ảnh mặc định và append dưới dạng file
      const response = await fetch(defaultNovelImage);
      const blob = await response.blob();
      const file = new File([blob], "default-image.png", { type: blob.type });
      formData.append("image", file);
    }
    try {
      if (isEditing) {
        // Thêm idNovel vào payload khi cập nhật
        payload.idNovel = currentNovel.idNovel;
        // Gửi lại payload đã cập nhật vào FormData
        formData.set("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        await dispatch(updateNovel(formData)).unwrap();
        toast.success('Cập nhật truyện thành công!');
      } else {
        await dispatch(createNovel(formData)).unwrap();
        toast.success('Tạo truyện mới thành công!');
      }
      cancelForm();
    } catch (error) {
      toast.error(isEditing ? 'Cập nhật truyện thất bại!' : 'Tạo truyện thất bại!');
      console.error('Error:', error);
    }
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
  
  // Lọc novels theo search term
  const filteredNovels = novels.filter(novel =>
    novel.nameNovel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    novel.authors?.some(author => author.nameAuthor?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalNovels = filteredNovels.length;
  const indexOfLastNovel = currentPage * novelsPerPage;
  const indexOfFirstNovel = indexOfLastNovel - novelsPerPage;
  const currentNovelsToDisplay = filteredNovels.slice(indexOfFirstNovel, indexOfLastNovel);
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= Math.ceil(totalNovels / novelsPerPage)) {
        setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent mb-3">
              Quản Lý Truyện
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Quản lý bộ sưu tập truyện của bạn một cách dễ dàng
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Truyện</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{novels.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                <Book className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Đang Tiến Hành</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {novels.filter(novel => novel.statusNovel === 'CONTINUE').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Hoàn Thành</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {novels.filter(novel => novel.statusNovel === 'COMPLETED').length}
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tác Giả</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{authors.length}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên truyện hoặc tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            />
            <ScanSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Add Novel Button */}
        <div className="mb-6">
          <button 
            onClick={() => { setIsEditing(false); setCurrentNovel(null); setShowForm(true); }} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Thêm Truyện Mới
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={cancelForm}></div>
            <div className="fixed inset-0 flex justify-center items-center z-50 overflow-y-auto py-10">
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-2xl p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditing ? 'Chỉnh Sửa Truyện' : 'Tạo Truyện Mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="nameNovel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tên Truyện</label>
                    <input 
                      id="nameNovel" 
                      name="nameNovel" 
                      type="text" 
                      required 
                      defaultValue={isEditing ? currentNovel?.nameNovel : ''} 
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-indigo-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                    />
                  </div>
                  <div>
                    <label htmlFor="descriptionNovel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mô Tả</label>
                    <textarea 
                      id="descriptionNovel" 
                      name="descriptionNovel" 
                      rows="4" 
                      defaultValue={isEditing ? currentNovel?.descriptionNovel : ''} 
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-indigo-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                    />
                  </div>
                  <div>
                    <label htmlFor="statusNovel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Trạng Thái</label>
                    <select 
                      id="statusNovel" 
                      name="statusNovel" 
                      defaultValue={isEditing ? currentNovel?.statusNovel : 'CONTINUE'} 
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-indigo-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="CONTINUE">Đang tiến hành</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="DROP">Tạm ngưng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tác Giả</label>
                    <Select
                      isMulti
                      options={authorOptions}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      defaultValue={authorOptions.filter(option => selectedAuthorIds.includes(option.value))}
                      onChange={(selected) => setSelectedAuthorIds(selected.map(opt => opt.value))}
                      placeholder="Chọn tác giả..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: theme === 'dark' ? 'rgb(51 65 85 / 0.7)' : 'rgb(255 255 255 / 0.7)',
                          borderColor: theme === 'dark' ? 'rgb(71 85 105)' : 'rgb(199 210 254)',
                          borderRadius: '0.75rem',
                          padding: '0.5rem',
                          backdropFilter: 'blur(4px)',
                          '&:hover': {
                            borderColor: 'rgb(99 102 241)'
                          }
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: 'rgb(99 102 241)',
                          borderRadius: '0.5rem'
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: 'white'
                        })
                      }}
                    />
                  </div> 
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Thể Loại</label>
                    <Select
                      isMulti
                      options={categoryOptions}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      defaultValue={categoryOptions.filter(option => selectedCategoryIds.includes(option.value))}
                      onChange={(selected) => setSelectedCategoryIds(selected.map(opt => opt.value))}
                      placeholder="Chọn thể loại..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: theme === 'dark' ? 'rgb(51 65 85 / 0.7)' : 'rgb(255 255 255 / 0.7)',
                          borderColor: theme === 'dark' ? 'rgb(71 85 105)' : 'rgb(199 210 254)',
                          borderRadius: '0.75rem',
                          padding: '0.5rem',
                          backdropFilter: 'blur(4px)',
                          '&:hover': {
                            borderColor: 'rgb(99 102 241)'
                          }
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: 'rgb(147 51 234)',
                          borderRadius: '0.5rem'
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: 'white'
                        })
                      }}
                    />
                  </div> 
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ảnh Bìa</label>
                    <input 
                      id="image" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setImage(e.target.files[0])} 
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-indigo-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Nếu không chọn ảnh, hệ thống sẽ sử dụng ảnh mặc định
                    </p>
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
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={loading}
                    >
                      {loading ? 'Đang xử lý...' : isEditing ? 'Lưu Thay Đổi' : 'Tạo Truyện'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Loading and Error States */}
        {loading && novels.length === 0 && (
          <div className="text-center mt-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8">
              <p className="text-slate-600 dark:text-slate-300">Đang tải truyện...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center mt-6">
            <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl rounded-2xl p-8 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">Lỗi: {error}</p>
            </div>
          </div>
        )}

        {/* Novels Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-200/50 dark:border-slate-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tên Truyện</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng Thái</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Chương</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Đánh Giá</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {currentNovelsToDisplay.map((novel, index) => (
                  <tr key={novel.idNovel} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{indexOfFirstNovel + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-x-3">
                        <img 
                          src={novel.imageNovel || defaultNovelImage} 
                          alt={novel.nameNovel} 
                          className="w-12 h-16 rounded-lg object-cover flex-shrink-0 shadow-md"
                          onError={(e) => {
                            e.target.src = defaultNovelImage;
                          }}
                        />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{novel.nameNovel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        novel.statusNovel === 'CONTINUE' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : novel.statusNovel === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {novel.statusNovel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{novel.totalChapter}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Star size={16} className="fill-yellow-500 stroke-yellow-500" /> 
                        <span className="text-slate-900 dark:text-slate-100">{novel.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-x-2">
                        <button 
                          title="Quản lý Chương" 
                          className="p-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200" 
                          onClick={(e) => { e.stopPropagation(); handleViewChapters(novel); }}
                        >
                          <BookOpen size={18} />
                        </button>
                        <button 
                          title="Chỉnh sửa Truyện" 
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200" 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(novel); }}
                        >
                          <PencilLine size={18} />
                        </button>
                        <button 
                          title="Xóa Truyện" 
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteNovel(novel.idNovel); }}
                        >
                          <Trash size={18} />
                        </button>
                        <div className="relative">
                          <button 
                            title="Xem trước" 
                            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                            onClick={(e) => { e.stopPropagation(); setPreviewNovel(novel); }}
                          >
                            <Eye size={18} />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openDropdownId === novel.idNovel && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl shadow-2xl z-20">
                              <button 
                                onClick={() => { setNovelToUpdate(novel); setShowAddAuthorModal(true); setOpenDropdownId(null); }} 
                                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700/50 rounded-t-xl transition-colors duration-200"
                              >
                                <UserPlus size={16} /> Thêm Tác Giả
                              </button>
                              <button 
                                onClick={() => { setNovelToUpdate(novel); setShowAddCategoryModal(true); setOpenDropdownId(null); }} 
                                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700/50 rounded-b-xl transition-colors duration-200"
                              >
                                <Tag size={16} /> Thêm Thể Loại
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
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-2 flex items-center gap-2">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1} 
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Trước
            </button>
            <span className="px-6 py-2 text-slate-700 dark:text-slate-300 font-medium">
              Trang {currentPage} / {Math.ceil(totalNovels / novelsPerPage) || 1}
            </span>
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === Math.ceil(totalNovels / novelsPerPage)} 
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Sau
            </button>
          </div>
        </div>

        {/* Chapter Management Section */}
        {selectedNovel && (
          <div className="mt-8 transition-all duration-500">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <ChapterManagement novel={selectedNovel} />
            </div>
          </div>
        )}

        {/* Modals */}
        {previewNovel && (
          <PreviewModal 
            novel={previewNovel} 
            onClose={() => setPreviewNovel(null)} 
          />
        )}
        <AddToNovelModal 
          show={showAddAuthorModal}
          onClose={() => setShowAddAuthorModal(false)}
          title={`Thêm Tác Giả cho: ${novelToUpdate?.nameNovel}`}
          options={authorOptions}
          onSubmit={handleAddAuthorSubmit}
          isLoading={loading}
        />
        <AddToNovelModal 
          show={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          title={`Thêm Thể Loại cho: ${novelToUpdate?.nameNovel}`}
          options={categoryOptions}
          onSubmit={handleAddCategorySubmit}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default NovelManager;