import React from 'react';
import TopStories from '../TopStories';
import Footer from '../Footer';
import Stories from '../Stories';
import StorySlider from '../StorySlider';

const Home = () => {
    return (
        <div>
            <StorySlider />
            <TopStories />
            <Stories />
            <Footer />
            {/* Other components can be added here */}
        </div>

    );
};

export default Home;