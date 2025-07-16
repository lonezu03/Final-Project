// src/pages/UserReadingHistoryPage.jsx
import React from 'react';
import UserReadingHistory from '../UserReadingHistory'; 

const UserReadingHistoryPage = () => {
  return (


    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-2 sm:px-4">
       
        <UserReadingHistory />
      </div>
    </div>
  );
};

export default UserReadingHistoryPage;