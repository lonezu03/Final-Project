// src/pages/UserReadingHistoryPage.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import UserReadingHistory from '../UserReadingHistory'; 

const UserReadingHistoryPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`min-h-screen py-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto px-2 sm:px-4">
        <UserReadingHistory />
      </div>
    </div>
  );
};

export default UserReadingHistoryPage;