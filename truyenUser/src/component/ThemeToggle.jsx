import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', size = 20 }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
          : 'bg-yellow-100 hover:bg-yellow-200 text-orange-600'
      } ${className}`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative overflow-hidden">
        {/* Sun Icon */}
        <Sun 
          size={size} 
          className={`transform transition-all duration-500 ${
            isDarkMode 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        
        {/* Moon Icon */}
        <Moon 
          size={size} 
          className={`absolute inset-0 transform transition-all duration-500 ${
            isDarkMode 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      
      {/* Animated Background */}
      <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-purple-500/25' 
          : 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/25'
      } -z-10`} />
    </button>
  );
};

export default ThemeToggle;
