// src/components/TopStories.jsx
import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "../context/ThemeContext"; // Import useTheme
import { Link } from "react-router-dom";
import { User, Book } from "lucide-react";

// Giả sử categories vẫn được fetch riêng và có slice tương ứng
// Nếu không, bạn có thể bỏ qua phần liên quan đến categories hoặc lấy categories từ novel nếu có
import { getAllCategories } from "../redux/categorySlice"; // Điều chỉnh đường dẫn nếu cần

const TopStories = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme(); // Sử dụng theme context

  // Lấy dữ liệu từ store
  const { novels, loading: novelsLoading, error: novelsError } = useSelector((state) => state.novels);
  // Không cần lấy authors từ store nữa
  // const { authors, loading: authorsLoading, error: authorsError } = useSelector((state) => state.authors);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);

  // Fetch categories nếu chưa có (giả sử categories vẫn được quản lý riêng)
  // Nên thực hiện việc fetch này ở component cha (ví dụ: HomePage)
  // useEffect(() => {
  //   if (!categories || categories.length === 0 && !categoriesLoading) {
  //     dispatch(getAllCategories());
  //   }
  // }, [dispatch, categories, categoriesLoading]);


  const renderError = (err, type) => (typeof err === 'string' ? err : err?.message || `Đã có lỗi xảy ra khi tải ${type}.`);

  const sectionsData = useMemo(() => {
    // Chỉ cần novels và categories (nếu categories vẫn được dùng)
    if (!novels || novels.length === 0 || !categories) {
        console.log("TopStories: novels hoặc categories chưa sẵn sàng", {novelsLength: novels?.length, categoriesExists: !!categories });
        return [];
    }

    // Tạo map để tra cứu nhanh tên thể loại (nếu cần)
    // Nếu categories được nhúng trong novel, logic này sẽ khác
    const categoryMap = new Map(categories.map(category => [category.idCategory, category.nameCategory]));

    const getAuthorName = (novel) => {
      // Lấy tên tác giả từ mảng novel.authors
      if (novel.authors && novel.authors.length > 0) {
        // Lấy tên của tác giả đầu tiên, hoặc nối tên nhiều tác giả
        return novel.authors.map(author => author.nameAuthor).join(', ');
      }
      return "Chưa rõ"; // Fallback
    };

    const getGenre = (novel) => {
      // Logic lấy thể loại có thể giữ nguyên nếu novel.listCategory vẫn tồn tại
      // Hoặc nếu categories được nhúng trong novel theo cách khác, cần điều chỉnh ở đây
      if (novel.categories && novel.categories.length > 0) { // Giả sử novel giờ có trường categories
        // Lấy tên của category đầu tiên trong danh sách
        return novel.categories[0].nameCategory || "Chưa rõ";
      }
      // Fallback nếu dùng categoryMap từ state.categories
      // if (novel.categoryIds && novel.categoryIds.length > 0) { // Nếu novel có mảng id thể loại
      //   return categoryMap.get(novel.categoryIds[0]) || "Chưa rõ";
      // }
      return "Chưa rõ"; // Fallback nếu không có category
    };

    // Sắp xếp và lọc truyện (logic này có thể giữ nguyên)
    const sortedByViews = [...novels].sort((a, b) => (b.viewNovel || 0) - (a.viewNovel || 0));
    const sortedByRating = [...novels].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));

    // Lọc ra các truyện không nằm trong top 1 của sortedByViews để tránh trùng lặp
    const topViewId = sortedByViews.length > 0 ? sortedByViews[0].idNovel : null;
    const recommended = [...novels]
        .filter(n => n.idNovel !== topViewId) // Loại bỏ truyện top view nếu có
        .sort((a,b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));


    return [
      {
        title: "Đọc nhiều",
        topStory: sortedByViews[0] ? {
          id: sortedByViews[0].idNovel,
          name: sortedByViews[0].nameNovel,
          author: getAuthorName(sortedByViews[0]),
          genre: getGenre(sortedByViews[0]),
          image: sortedByViews[0].imageNovel || "https://via.placeholder.com/64x96.png?text=N",
        } : null,
        list: sortedByViews.slice(1, 10).map(n => ({id: n.idNovel, name: n.nameNovel})),
      },
      {
        title: "Đánh giá cao",
        topStory: sortedByRating[0] ? {
            id: sortedByRating[0].idNovel,
            name: sortedByRating[0].nameNovel,
            author: getAuthorName(sortedByRating[0]),
            genre: getGenre(sortedByRating[0]),
            image: sortedByRating[0].imageNovel || "https://via.placeholder.com/64x96.png?text=N",
        } : null,
        list: sortedByRating.slice(1, 10).map(n => ({id: n.idNovel, name: n.nameNovel})),
      },
      {
        title: "Đề cử",
        topStory: recommended[0] ? {
            id: recommended[0].idNovel,
            name: recommended[0].nameNovel,
            author: getAuthorName(recommended[0]),
            genre: getGenre(recommended[0]),
            image: recommended[0].imageNovel || "https://via.placeholder.com/64x96.png?text=N",
        } : null,
        list: recommended.slice(1, 10).map(n => ({id: n.idNovel, name: n.nameNovel})),
      },
    ].filter(section => section.topStory && section.topStory.id);
  }, [novels, categories]); // Bỏ authors khỏi dependency

  // Xử lý loading và error
  if (novelsLoading && (!novels || novels.length === 0)) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
          <p className={`text-center py-5 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Đang tải danh sách truyện...</p>
      </div>
    );
  }
  // Kiểm tra categoriesLoading nếu categories vẫn được fetch riêng và là bắt buộc
  if (categoriesLoading && (!categories || categories.length === 0)) {
     return (
      <div className="container mx-auto p-4 sm:p-6">
          <p className={`text-center py-5 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Đang tải thể loại...</p>
      </div>
    );
  }


  if (novelsError && (!novels || novels.length === 0)) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
          <p className="text-center text-red-500 py-5">Lỗi tải danh sách truyện: {renderError(novelsError, 'truyện')}</p>
      </div>
    );
  }
  // Thêm xử lý lỗi cho categoriesError nếu cần
  if (categoriesError && (!categories || categories.length === 0)) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
          <p className="text-center text-red-500 py-5">Lỗi tải thể loại: {renderError(categoriesError, 'thể loại')}</p>
      </div>
    );
  }

  if (!sectionsData || sectionsData.length === 0) {
    // Thêm kiểm tra nếu novels có nhưng không đủ để tạo section
    if (novels && novels.length > 0 && (!categories || categories.length === 0) && categoriesLoading) {
        // Trường hợp này là đang đợi categories, có thể hiển thị loading khác
        return (
            <div className="container mx-auto p-4 sm:p-6">
                <p className={`text-center py-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Đang chờ dữ liệu thể loại...</p>
            </div>
        );
    }
    return (
    <div className="container mx-auto p-4 sm:p-6">
        <p className={`text-center py-5 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>Không có dữ liệu truyện nổi bật để hiển thị.</p>
    </div>
  );
}

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className={`rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sectionsData.map((section, idx) => (
            <div key={idx} className={`flex flex-col rounded-lg p-5 shadow-md hover:shadow-lg transition-all duration-300 border ${
              isDarkMode 
                ? 'bg-slate-700 border-gray-600 hover:bg-slate-600' 
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}>
              <h2 className={`text-xl font-bold mb-5 border-b-2 pb-2 relative ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-blue-400 to-purple-400' 
                    : 'from-blue-600 to-purple-600'
                }`}>
                  {section.title}
                </span>
                <div className={`absolute bottom-0 left-0 w-12 h-0.5 rounded-full ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}></div>
              </h2>
              
              {section.topStory && (
                <div className={`flex mb-6 items-start group rounded-lg p-3 transition-all duration-300 ${
                  isDarkMode 
                    ? 'hover:bg-slate-600' 
                    : 'hover:bg-gray-50'
                }`}>
                  <div className="w-20 h-28 overflow-hidden rounded-lg mr-4 flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300">
                    <Link to={`/novel/${section.topStory.id}`}>
                      <img
                        src={section.topStory.image}
                        alt={section.topStory.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className={`font-bold text-base sm:text-lg leading-tight mb-2 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'text-white group-hover:text-blue-400' 
                        : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                      <Link to={`/novel/${section.topStory.id}`} className="line-clamp-2 hover:underline" title={section.topStory.name}>
                        {section.topStory.name}
                      </Link>
                    </h3>
                    <p className={`text-xs sm:text-sm flex items-center mb-2 truncate ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <User size={16} className={`mr-2 flex-shrink-0 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-500'
                      }`} />
                      <span className="font-medium">{section.topStory.author}</span>
                    </p>
                    <p className={`text-xs sm:text-sm flex items-center truncate ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <Book size={16} className={`mr-2 flex-shrink-0 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-500'
                      }`} />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode 
                          ? 'bg-gray-600 text-gray-200' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>{section.topStory.genre}</span>
                    </p>
                  </div>
                </div>
              )}
              
              <ul className={`space-y-2 text-sm flex-grow ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {section.list.map((item, itemIdx) => (
                  <li key={item.id || itemIdx} className={`flex items-center rounded-lg p-2 transition-all duration-200 group ${
                    isDarkMode 
                      ? 'hover:bg-slate-600' 
                      : 'hover:bg-gray-50'
                  }`}>
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 flex-shrink-0 transition-all duration-200
                        ${itemIdx === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md" :
                        itemIdx === 1 ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md" :
                        itemIdx === 2 ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md" :
                        (isDarkMode 
                          ? "bg-gray-600 text-gray-300 group-hover:bg-gray-500" 
                          : "bg-gray-200 text-gray-600 group-hover:bg-gray-300")}`}
                    >
                      {itemIdx + 2} 
                    </span>
                    <Link 
                      to={`/novel/${item.id}`} 
                      className="truncate hover:text-blue-600 hover:underline transition-all duration-200 font-medium group-hover:translate-x-1" 
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopStories;