import React from 'react';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import TopStories from '../TopStories';
import Footer from '../Footer';
import Stories from '../Stories';
import StorySlider from '../StorySlider';
import RecommendedStories from '../RecommendedStories';

const Home = () => {
    const { isDarkMode } = useTheme(); // Sử dụng theme context

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDarkMode 
                ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white' 
                : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
        }`}>
            <div className="space-y-8 pb-8">
                <StorySlider />
                <TopStories />
                {/* <RecommendedStoriesTest /> */}
                <RecommendedStories />
                <Stories />
            </div>
            <Footer />
            {/* Other components can be added here */}
        </div>

    );
};

export default Home;