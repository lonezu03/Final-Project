import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllAuthors, deleteAuthor,updateAuthor  } from '../../redux/authorSlice';
import { Star, PencilLine, Trash } from 'lucide-react';

import { createAuthor } from '../../redux/authorSlice'; // Đảm bảo đã import
import Select from 'react-select';

const TopOrders = () => {
  const dispatch = useDispatch();
  const { authors, loading, error } = useSelector((state) => state.authors);
const [showForm, setShowForm] = useState(false);
const [image, setImage] = useState(null);
const [newAuthor, setNewAuthor] = useState({
  publicIDAuthor: '',
  nameAuthor: '',
  descriptionAuthor: '',
  nationalityAuthor: '',
  dobAuthor: '',
  // dodAuthor: '',
  genderAuthor: 'MALE',
  novels: [],
});

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
const [isEditing, setIsEditing] = useState(false); // true nếu đang sửa
{loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Save Changes" : "Create Novel")}
const { novels } = useSelector((state) => state.novels);
const novelOptions = novels?.map((novel) => ({
  value: novel.idNovel,
  label: novel.nameNovel,
}));
 const [currentAuthor, setCurrentAuthor] = useState(null); 
    
    
useEffect(() => {
  if (error) {
    alert(error);
  }
}, [error]);

  const authorsPerPage = 5; // Number of authors per page
  const totalAuthors = authors.length;

  // Calculate the indices of the authors to show for the current page
  const indexOfLastAuthor = currentPage * authorsPerPage;
  const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
  const currentAuthors = authors.slice(indexOfFirstAuthor, indexOfLastAuthor);

 const handleSubmit = (e) => {
  e.preventDefault();

  const formData = new FormData();
   const dob = new Date(newAuthor.dobAuthor);
  const currentDate = new Date();
   if (!newAuthor.dobAuthor) {
    alert("Ngày sinh là bắt buộc.");
    return;
  }
  if (dob > currentDate) {
    alert("Ngày sinh không thể là ngày trong tương lai.");
    return;
  }
   const age = currentDate.getFullYear() - dob.getFullYear();
  if (age < 18) {
    alert("Tác giả phải ít nhất 18 tuổi.");
    return;
  }
  if (!newAuthor.nameAuthor || newAuthor.nameAuthor.length < 3 || newAuthor.nameAuthor.length > 100) {
    alert('Tên tác giả phải có độ dài từ 3 đến 100 ký tự!');
    return;
  }
  if (newAuthor.descriptionAuthor.length > 100) {
    alert('Mô tả phải có độ dài tối đa 100 ký tự!');
    return;
  }
  const jsonPayload = new Blob([JSON.stringify({
    // idAuthor: isEditing ? newAuthor.idAuthor : undefined, 
    nameAuthor: newAuthor.nameAuthor,
    descriptionAuthor: newAuthor.descriptionAuthor,
    nationalityAuthor: newAuthor.nationalityAuthor,
    dobAuthor: newAuthor.dobAuthor,
    // dodAuthor: newAuthor.dodAuthor,
    genderAuthor: newAuthor.genderAuthor,
    novels: newAuthor.novels.map(String), // nếu có
  })], { type: 'application/json' });

  formData.append('request', jsonPayload);
  if (image) {
    formData.append("image", image);
  }

     if (isEditing) {
        dispatch(updateAuthor(formData))  }
      else {
        dispatch(createAuthor(formData))
  }
  // Reset
  setNewAuthor({
    nameAuthor: '',
    descriptionAuthor: '',
    nationalityAuthor: '',
    dobAuthor: '',
    // dodAuthor: '',
    genderAuthor: 'MALE',
    novels: [],
  });
  setImage(null);
  setIsEditing(false);
  
  setShowForm(false);
};

//hack handleEditClick
const handleEditClick = (author) => {
  setCurrentAuthor(author); // Lưu lại toàn bộ object tác giả

  setNewAuthor({
    idAuthor: author.idAuthor,
    nameAuthor: author.nameAuthor || '',
    descriptionAuthor: author.descriptionAuthor || '',
    nationalityAuthor: author.nationalityAuthor || '',
    dobAuthor: author.dobAuthor || '',
    // dodAuthor: author.dodAuthor || '',
    genderAuthor: author.genderAuthor || 'MALE',
    novels: Array.isArray(author.novels) ? author.novels.map(n => n.idNovel) : [],
  });
  console.log(author);
  setImage(null); // không auto fill ảnh khi edit
  setIsEditing(true); // Đặt trạng thái là đang chỉnh sửa
  setShowForm(true);
  // Nếu bạn cần tracking ID để update sau này:
};
 const cancelForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setCurrentAuthor(null);
        setImageFile(null);
        setSelectedNovelIds([]);
    };
  // Handle delete author
  const handleDelete = (id) => {
    console.log('Deleting author with ID:', id);
    dispatch(deleteAuthor(id));
  };

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Button mở form */}
      <button
        onClick={() => setShowForm(true)}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4 transition"
      >
        Add Author
      </button>

      {showForm && (
        <div>
          <div
            className="fixed inset-0 bg-gray-700 opacity-50 z-10"
            onClick={() => setShowForm(false)}
          ></div>
          <div className="fixed inset-0 flex justify-center items-center z-20">
<div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {isEditing ? 'Edit Author' : 'Create New Author'}
              </h2>
              {[
                ['nameAuthor', 'Name'],
                ['descriptionAuthor', 'Description'],
                ['nationalityAuthor', 'Nationality'],
                ['dobAuthor', 'Date of Birth', 'date'],
              ].map(([key, label, type = 'text']) => (
                <div key={key} className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700">{label}</label>
                  <input
                    type={type}
                    value={newAuthor[key]}
                    onChange={(e) => setNewAuthor({ ...newAuthor, [key]: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}

              {/* Gender */}
              <label className="block mb-2 font-medium text-gray-700">Gender</label>
              <select
                value={newAuthor.genderAuthor}
                onChange={(e) => setNewAuthor({ ...newAuthor, genderAuthor: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>

              <label className="block mb-2 font-medium text-gray-700">Select Novels</label>
              <Select
                isMulti
                options={novelOptions}
                value={novelOptions.filter((opt) => newAuthor.novels.includes(opt.value))}
                onChange={(selectedOptions) =>
                  setNewAuthor({
                    ...newAuthor,
                    novels: selectedOptions.map((opt) => opt.value),
                  })
                }
                className="mb-4"
              />

              {/* Image Upload */}
              <label className="block mb-2 font-medium text-gray-700">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded mb-2 w-full transition"
                disabled={loading}
              >
                {loading
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Novel'}
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded w-full transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <div className="text-xl font-semibold text-gray-800">Top Orders</div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(currentAuthors) && currentAuthors.length > 0 ? (
                currentAuthors.map((author, index) => (
                  <tr key={author.idAuthor}>
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-x-4">
                        <img
                          src={author.imageAuthor}
                          alt={author.nameAuthor}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{author.nameAuthor}</p>
                          {/* <p className="text-sm text-gray-600">{author.descriptionAuthor}</p> */}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{author.descriptionAuthor}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-x-4">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            handleEditClick(author);
                          }}
                        >
                          <PencilLine size={20} />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(author.idAuthor)}
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No authors available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-6 gap-x-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-gray-700 font-medium">
            Trang {currentPage} / {Math.ceil(totalAuthors / authorsPerPage)}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === Math.ceil(totalAuthors / authorsPerPage)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopOrders;
