// src/components/NovelCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Book, Layers } from 'lucide-react'; // Ví dụ icons

const NovelCard = ({ novel }) => {
  if (!novel) return null;

  const authorNames = novel.authors && novel.authors.length > 0
    ? novel.authors.map(author => author.nameAuthor).join(', ')
    : 'Chưa rõ';

  const categoryNames = novel.categories && novel.categories.length > 0
    ? novel.categories.map(cat => cat.nameCategory).join(', ')
    : 'Chưa rõ';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <Link to={`/novel/${novel.idNovel}`} className="block">
        <img
          src={novel.imageNovel || 'https://via.placeholder.com/150x220.png?text=Truyen'}
          alt={novel.nameNovel}
          className="w-full h-48 sm:h-56 md:h-64 object-cover"
        />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate" title={novel.nameNovel}>
          <Link to={`/novel/${novel.idNovel}`} className="hover:text-blue-600 dark:hover:text-sky-400">
            {novel.nameNovel}
          </Link>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center truncate" title={authorNames}>
          <Users size={14} className="mr-1.5 flex-shrink-0" /> {authorNames}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center truncate" title={categoryNames}>
          <Book size={14} className="mr-1.5 flex-shrink-0" /> {categoryNames}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
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