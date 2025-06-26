// src/pages/SearchResultsPage.jsx
import React, { useEffect, useState } from 'react'; // Bỏ useCallback nếu không dùng như cách trước
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchNovels,
  clearSearchedNovels,
 selectSearchedNovels,    // Đã đổi
  selectSearchPagination,  // Đã đổi tên
  selectSearchLoading,
  selectNovelsError        // Tên này cần phải khớp với export từ slice
} from '../redux/novelSlice';
import NovelCard from './NovelCard'; // Đường dẫn đến NovelCard (giả sử nằm trong components)
import { Loader2 as LucideSpinner, SearchX } from 'lucide-react';

// Helper để parse query params từ URL
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResultsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useQuery();

  // Sử dụng selector mới cho kết quả tìm kiếm và pagination
  const novels = useSelector(selectSearchedNovels);
  const paginationInfoFromStore = useSelector(selectSearchPagination);
  const loading = useSelector(selectSearchLoading);
  const error = useSelector(selectNovelsError);

  // State để lưu trữ các giá trị lấy từ URL, dùng để điều khiển UI và dispatch
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  // currentPageForUI và pageSizeForUI sẽ được lấy trực tiếp từ paginationInfoFromStore để render
  // hoặc từ URL khi người dùng tương tác

  // Hàm thực hiện tìm kiếm
  const doSearch = (term, page, size) => {
    if (!term || term.trim() === "") {
      dispatch(clearSearchedNovels());
      return;
    }
    const searchCriteria = {
      nameNovel: term.trim(),
      nameOperator: "CONTAINS",
    };
    const paginationAndSortParams = { page, size };
    // console.log("Dispatching searchNovels with:", { searchCriteria, paginationAndSortParams });
    dispatch(searchNovels({ searchCriteria, paginationAndSortParams }));
  };

  // Effect chính: Lắng nghe thay đổi trên URL (location.search) và thực hiện tìm kiếm
  useEffect(() => {
    const termFromUrl = queryParams.get('q') || '';
    const pageFromUrl = Number(queryParams.get('page')) || 0;
    const sizeFromUrl = Number(queryParams.get('size')) || 20;

    setCurrentSearchTerm(termFromUrl); // Cập nhật từ khóa hiển thị trên UI

    if (termFromUrl.trim() !== "") {
      doSearch(termFromUrl, pageFromUrl, sizeFromUrl);
    } else {
      dispatch(clearSearchedNovels());
    }
  }, [location.search, dispatch]); // Chỉ chạy lại khi query params trên URL thay đổi hoặc dispatch thay đổi

  const handlePageChange = (newPage) => {
    const currentSize = paginationInfoFromStore?.pageSize || 20;
    if (newPage >= 0 && newPage < (paginationInfoFromStore?.totalPages || 0)) {
      navigate(`/search-results?q=${encodeURIComponent(currentSearchTerm)}&page=${newPage}&size=${currentSize}`);
    }
  };

  const handleSizeChange = (newSize) => {
    navigate(`/search-results?q=${encodeURIComponent(currentSearchTerm)}&page=0&size=${newSize}`);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LucideSpinner className="animate-spin text-blue-500 dark:text-sky-400" size={48} />
        <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">Đang tìm kiếm truyện...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <SearchX size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Lỗi Tìm Kiếm</h2>
        <p className="text-gray-700 dark:text-gray-300">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
        <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
            Về Trang Chủ
        </button>
      </div>
    );
  }

  // Sau khi loading xong và không có lỗi
  // Hiển thị "Không tìm thấy kết quả" nếu có từ khóa tìm kiếm, nhưng novels rỗng
  if (currentSearchTerm.trim() !== "" && novels.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <SearchX size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Không tìm thấy kết quả</h2>
        <p className="text-gray-600 dark:text-gray-400">Không có truyện nào phù hợp với từ khóa "{currentSearchTerm}".</p>
        <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
            Về Trang Chủ
        </button>
      </div>
    );
  }

  // Hiển thị "Vui lòng nhập từ khóa" nếu không có từ khóa và novels rỗng
   if (currentSearchTerm.trim() === "" && novels.length === 0) {
    return (
        <div className="container mx-auto p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Vui lòng nhập từ khóa từ thanh tìm kiếm để tìm truyện.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {currentSearchTerm.trim() !== "" && novels.length > 0 && ( // Chỉ hiển thị tiêu đề nếu có kết quả và từ khóa
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Kết quả tìm kiếm cho: "<span className="text-blue-600 dark:text-sky-400">{currentSearchTerm}</span>"
        </h1>
      )}

      {novels.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {novels.map((novel) => (
              <NovelCard key={novel.idNovel} novel={novel} />
            ))}
          </div>

          {paginationInfoFromStore && paginationInfoFromStore.totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center space-y-4">
                <div className="flex justify-center items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(paginationInfoFromStore.pageNumber - 1)}
                        disabled={paginationInfoFromStore.first || loading}
                        className="px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Trước
                    </button>
                    {[...Array(paginationInfoFromStore.totalPages).keys()].map(pageIdx => (
                        <button
                        key={pageIdx}
                        onClick={() => handlePageChange(pageIdx)}
                        disabled={loading}
                        className={`px-4 py-2 border rounded-md ${
                            paginationInfoFromStore.pageNumber === pageIdx
                            ? 'bg-blue-500 text-white dark:bg-sky-500'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                        } disabled:opacity-50`}
                        >
                        {pageIdx + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(paginationInfoFromStore.pageNumber + 1)}
                        disabled={paginationInfoFromStore.last || loading}
                        className="px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sau
                    </button>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Kích thước trang:</span>
                    <select
                        value={paginationInfoFromStore.pageSize || 20} // Lấy pageSize từ store hoặc mặc định
                        onChange={(e) => handleSizeChange(Number(e.target.value))}
                        disabled={loading}
                        className="px-2 py-1 border rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Hiển thị {paginationInfoFromStore.numberOfElements} trên tổng số {paginationInfoFromStore.totalElements} truyện.
                    Trang {paginationInfoFromStore.pageNumber != null ? paginationInfoFromStore.pageNumber + 1 : '-'}/{paginationInfoFromStore.totalPages || '-'}.
                </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default SearchResultsPage;