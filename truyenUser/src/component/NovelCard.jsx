// src/components/NovelCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Star, Users, Book, Layers } from 'lucide-react'; // Ví dụ icons

const NovelCard = ({ novel }) => {
  const { isDarkMode } = useTheme(); // Sử dụng theme context
  
  if (!novel) return null;

  const authorNames = novel.authors && novel.authors.length > 0
    ? novel.authors.map(author => author.nameAuthor).join(', ')
    : 'Chưa rõ';

  const categoryNames = novel.categories && novel.categories.length > 0
    ? novel.categories.map(cat => cat.nameCategory).join(', ')
    : 'Chưa rõ';

  return (
    <div className={`rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col ${
      isDarkMode 
        ? 'bg-slate-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    }`}>
      <Link to={`/novel/${novel.idNovel}`} className="block">
        <img
          src={novel.imageNovel || 'https://via.placeholder.com/150x220.png?text=Truyen'}
          alt={novel.nameNovel}
          className="w-full h-48 sm:h-56 md:h-64 object-cover"
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className={`text-lg font-semibold mb-1 truncate ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`} title={novel.nameNovel}>
          <Link to={`/novel/${novel.idNovel}`} className={`${
            isDarkMode 
              ? 'hover:text-sky-400' 
              : 'hover:text-blue-600'
          }`}>
            {novel.nameNovel}
          </Link>
        </h3>
        <p className={`text-xs mb-1 flex items-center truncate ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`} title={authorNames}>
          <Users size={14} className="mr-1.5 flex-shrink-0" /> {authorNames}
        </p>
        <p className={`text-xs mb-2 flex items-center truncate ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`} title={categoryNames}>
          <Book size={14} className="mr-1.5 flex-shrink-0" /> {categoryNames}
        </p>

        <div className={`flex items-center justify-between text-xs mt-auto pt-2 border-t ${
          isDarkMode 
            ? 'text-gray-300 border-gray-700' 
            : 'text-gray-600 border-gray-200'
        }`}>
          <span className="flex items-center">
            <Star size={14} className="mr-1 text-yellow-500" /> {novel.rating || 'N/A'}
          </span>
          <span className="flex items-center">
            <Layers size={14} className="mr-1" /> {novel.totalChapter || 'N/A'} chương
          </span>
        </div>
      </div>
    </div>
  );
};

export default NovelCard;