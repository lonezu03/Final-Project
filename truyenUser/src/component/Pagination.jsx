import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Không hiển thị nếu chỉ có 1 trang
  }

  const handlePageClick = (page) => {
    // API page tính từ 0, nhưng hiển thị cho người dùng từ 1
    onPageChange(page - 1);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Số trang tối đa hiển thị cùng lúc
    const pageBuffer = 2; // Số trang hiển thị ở mỗi bên của trang hiện tại

    if (totalPages <= maxPagesToShow + 2) {
      // Hiển thị tất cả các trang nếu tổng số trang nhỏ
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Logic hiển thị phức tạp hơn với dấu "..."
      let startPage = Math.max(2, currentPage - pageBuffer + 1);
      let endPage = Math.min(totalPages - 1, currentPage + pageBuffer + 1);
      
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers.map((number, index) => {
      const isCurrent = number === currentPage + 1;
      if (number === '...') {
        return <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-400"><MoreHorizontal size={16}/></span>;
      }
      return (
        <button
          key={number}
          onClick={() => handlePageClick(number)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isCurrent
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {number}
        </button>
      );
    });
  };

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => handlePageClick(currentPage)}
        disabled={currentPage === 0}
        className="px-3 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>
      {renderPageNumbers()}
      <button
        onClick={() => handlePageClick(currentPage + 2)}
        disabled={currentPage === totalPages - 1}
        className="px-3 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;