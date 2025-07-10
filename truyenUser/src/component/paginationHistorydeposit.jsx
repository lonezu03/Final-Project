// src/components/Pagination.jsx

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const paginationHistorydeposit = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const renderPageButton = (pageNumber, isActive = false) => (
    <button
      key={pageNumber}
      onClick={() => handlePageClick(pageNumber)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-sky-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      {pageNumber}
    </button>
  );

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const ellipsis = <span key="ellipsis" className="px-4 py-2 text-gray-400"><MoreHorizontal size={16} /></span>;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(renderPageButton(i, i === currentPage));
      }
    } else {
      pageNumbers.push(renderPageButton(1, 1 === currentPage));
      if (currentPage > 3) {
        pageNumbers.push(React.cloneElement(ellipsis, { key: 'ellipsis-start' }));
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(renderPageButton(i, i === currentPage));
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push(React.cloneElement(ellipsis, { key: 'ellipsis-end' }));
      }
      pageNumbers.push(renderPageButton(totalPages, totalPages === currentPage));
    }

    return pageNumbers;
  };

  return (
    <nav className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} className="mr-1" />
        Trước
      </button>
      {renderPageNumbers()}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sau
        <ChevronRight size={16} className="ml-1" />
      </button>
    </nav>
  );
};

export default paginationHistorydeposit;