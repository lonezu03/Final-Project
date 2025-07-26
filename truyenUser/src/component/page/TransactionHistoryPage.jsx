// src/pages/UserTransactionHistoryPage.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import UserTransactionHistory from '../UserTransactionHistory'; // Điều chỉnh đường dẫn này cho đúng
// import MainLayout from '../layouts/MainLayout';

const UserTransactionHistoryPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`min-h-screen py-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto px-2 sm:px-4">
        <UserTransactionHistory />
      </div>
    </div>
  );
};

export default UserTransactionHistoryPage;