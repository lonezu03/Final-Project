import React, { useState, useRef, useEffect } from 'react';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaStepBackward, FaStepForward,
  FaFastBackward, FaFastForward, FaEllipsisV, FaMoon
} from 'react-icons/fa';
import { IoMdSunny } from "react-icons/io";

// Dữ liệu giả định
const MOCK_STATS = { chapters: "6905", reads: "2400526", ratings: "1" };
const MOCK_COVER_IMAGE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKrSURBVFhH7ZfRbhxFFIDfbVXaVChAVMCSjUUGXIAx0LmyuAJHyoQLN8GFG9GiIyEHiB0kLgwZARKyEWgkTQoFId0oJdHdNLVPdT89vl/Vqc5B//RcvupV1VPTU9X7qdP5H9QKVLVTNQA9QL3APKAfsLVb9QG2AVuAacAUYBjQDoT3A0kNaARaAduBqg07A7cA84A2oF+T9LBgK2AW0IlIsG0AAS5P0y2AbWACMAo4YgY7gSRTtVPaDBRklj2lTDDgTWDnB3A7EOokKj1QNoOk+V5M9AwQW5fS7gPqjJNJHLbBOkEfdHBmKgK8BvS7SfoR2AYkPZoWnN0A3P15hKj3P9uB6ZBUzVCk+QN4y7qQpP2W7A5EfcDkG2QnARsCb1fVd0n6CrAZyM1d0PciAP8a0J9Jejh5R8kGZD9tYMyK1N02Ad8DgiQpLwK3XvN61zTfR2aA8fXgG8BLwGvAEaANyA2yT0l6GNgCJPQQ8xclnRNpXUvSOEp6bK6G1FvTVqTmkfQLMAHISgHqgBTgLSAH2KzcDuQG2SfAcTYb8CDwGvBGpLfM0xZkIWAr0EukPUsKAb0aY1lPmgNbgDyAylp7SyNpH/MLeUUMQUb8P1A7U+p9RSm3cvykG0DdZzSgP1Hqa7UBrQEbIJcHkP2QfQYkHVZbr0y0PwCftoB/ATBfpnEtd2EslK4rK3IA2QesAzYBSYE3QNcBlQbtAZsAnYDBAI/k9kf0s2A7MLlFmgPYBJS7uXZE67gXWwO0bUAD4LpLtkugfYBLQD2gK5DtQG6A7QE0RMg2IKsB9UCLsC4q0kQDpPmB7EAfUB8oBaYBOwCzUnQvQBEQf0sV8P4B9tEGoN+PAAAAAElFTkSuQmCC";

// Component con để quản lý việc chọn tốc độ phát
const PlaybackSpeedControl = ({ currentSpeed, onSpeedChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSpeed = (speed) => {
    onSpeedChange(speed);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-semibold w-14 text-center py-1 bg-slate-200/80 rounded-md hover:bg-slate-300/80 transition-colors"
        title="Tốc độ phát"
      >
        {currentSpeed.toFixed(2)}x
      </button>
      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10 border border-slate-300 dark:border-gray-600">
          {speeds.map(speed => (
            <button
              key={speed}
              onClick={() => handleSelectSpeed(speed)}
              className={`block w-full text-center px-2 py-1.5 text-xs hover:bg-slate-200 dark:hover:bg-gray-600 ${
                speed === currentSpeed ? 'font-bold text-blue-600 dark:text-sky-400' : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {speed.toFixed(2)}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const AudioPlayer = ({
  audioSrc,
  onPrevChapter,
  onNextChapter,
  isFirstChapter,
  isLastChapter,
  novel, // <<== NHẬN PROP MỚI
  coverImage,
  initialTime = 0, // Nhận prop này
  onTimeUpdate, 
  className = '',
  onProgressUpdate, // <<== THAY ĐỔI: Nhận prop mới

}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkModeInPlayer, setIsDarkModeInPlayer] = useState(true);
   const formatLargeNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };
 
  // State cho âm lượng và tốc độ, có khởi tạo từ localStorage
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('audioPlayerVolume') || '1'));
  const [playbackRate, setPlaybackRate] = useState(() => parseFloat(localStorage.getItem('audioPlayerRate') || '1.0'));
   const novelStats = {
    chapters: novel?.totalChapter || 'N/A',
    reads: formatLargeNumber(novel?.viewNovel || 0),
    ratings: novel?.ratingCount || 'N/A',
  };
  // Effect chính để quản lý thẻ <audio>
    useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      if (initialTime > 0) {
        audio.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
    };
    
    // Hàm này sẽ được gọi liên tục khi audio đang phát
    const handleTimeUpdate = () => {
      const newCurrentTime = audio.currentTime;
      const newDuration = audio.duration;
      
      setCurrentTime(newCurrentTime); // Cập nhật UI của player
      
      // Chỉ tính toán và gửi đi nếu có tổng thời lượng và callback
      if (newDuration > 0 && onProgressUpdate) {
        const percentage = (newCurrentTime / newDuration) * 100;
        
        // GỬI CẢ % VÀ GIÂY LÊN CHO COMPONENT CHA
        onProgressUpdate(percentage, newCurrentTime);
      }
    };

    const handleEnded = () => setIsPlaying(false);

    // Gắn các event listener
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Dọn dẹp listeners khi component unmount hoặc audioSrc thay đổi
    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc, initialTime, onProgressUpdate]); // Chạy lại effect này khi chương (audioSrc) thay đổi

  // Effect #2: Đồng bộ state với thuộc tính của thẻ audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Effect #3: Lưu cài đặt vào localStorage
  useEffect(() => {
    localStorage.setItem('audioPlayerVolume', volume.toString());
    localStorage.setItem('audioPlayerRate', playbackRate.toString());
  }, [volume, playbackRate]);

  // Effect #4: Reset trạng thái khi đổi chương
  useEffect(() => {
    // Khi audioSrc thay đổi, effect #1 sẽ chạy lại và xử lý việc reset thời gian
    // Chúng ta chỉ cần reset trạng thái isPlaying ở đây
    setIsPlaying(false);
  }, [audioSrc]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio && audioSrc) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(error => console.error("Lỗi khi phát audio:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      const seekToTime = (parseFloat(event.target.value) / 100) * duration;
      audio.currentTime = seekToTime;
      setCurrentTime(seekToTime);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => setIsMuted(!isMuted);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const rewind = (seconds = 10) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seconds); };
  const fastForward = (seconds = 10) => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + seconds); };
  const togglePlayerDarkMode = () => setIsDarkModeInPlayer(!isDarkModeInPlayer);
  
  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-orange-400 text-black p-2 shadow-lg flex items-center justify-between space-x-2 sm:space-x-3 ${className}`}>
        {/* 1. Bên trái: Ảnh bìa + Thông số */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <img
            src={coverImage || MOCK_COVER_IMAGE_URL}
            alt="Bìa truyện"
            className="w-10 h-10 object-cover rounded-sm"
          />
          <div className="text-xs leading-tight hidden sm:block">
             <p><span className="font-bold">{novelStats.chapters}</span> Chương</p>
            <p><span className="font-bold">{novelStats.reads}</span> Lượt đọc</p>
            <p><span className="font-bold">{novelStats.ratings}</span> Đánh giá</p>
          </div>
        </div>

        {/* 2. Ở giữa: Bộ điều khiển */}
        <div className="flex-grow bg-slate-100/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 flex items-center justify-between space-x-1.5 sm:space-x-2 min-w-0">
          {/* 2a. Nút điều khiển phát nhạc */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
            <button onClick={onPrevChapter} disabled={isFirstChapter} className="text-base sm:text-lg md:text-xl text-slate-600 hover:text-slate-900 disabled:opacity-40" title="Chương trước"><FaStepBackward /></button>
            <button onClick={() => rewind(10)} className="text-base sm:text-lg md:text-xl text-slate-600 hover:text-slate-900" title="Tua lại 10 giây"><FaFastBackward /></button>
            <button onClick={togglePlayPause} className="text-xl sm:text-2xl md:text-3xl text-orange-500 hover:text-orange-600 disabled:opacity-40" title={isPlaying ? "Tạm dừng" : "Phát"} disabled={!audioSrc}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={() => fastForward(10)} className="text-base sm:text-lg md:text-xl text-slate-600 hover:text-slate-900" title="Tua tới 10 giây"><FaFastForward /></button>
            <button onClick={onNextChapter} disabled={isLastChapter} className="text-base sm:text-lg md:text-xl text-slate-600 hover:text-slate-900 disabled:opacity-40" title="Chương sau"><FaStepForward /></button>
          </div>

          {/* 2b. Hiển thị thời gian & Thanh tiến trình */}
          <div className="flex-grow flex items-center space-x-2 mx-1 sm:mx-2 min-w-[120px] sm:min-w-[180px] md:min-w-[220px]">
            <span className="text-xs font-medium whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-1.5 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-slate-700 disabled:bg-gray-300"
              disabled={!duration}
              title="Tua nhanh"
            />
          </div>

          {/* 2c. Âm lượng, Tốc độ & Tùy chọn khác */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <PlaybackSpeedControl currentSpeed={playbackRate} onSpeedChange={setPlaybackRate} />
            <div className="flex items-center group">
              <button onClick={toggleMute} className="text-base sm:text-lg text-slate-600 hover:text-slate-900" title={isMuted ? "Bật tiếng" : "Tắt tiếng"}>
                {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover:w-20 h-1.5 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-slate-700 transition-all duration-300 ml-1"
                title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>
            <button className="text-sm sm:text-base text-slate-600 hover:text-slate-900" title="Tùy chọn thêm">
              <FaEllipsisV />
            </button>
          </div>
        </div>

        {/* 3. Bên phải: Chế độ Sáng/Tối */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
          <button onClick={togglePlayerDarkMode} className="p-1 sm:p-1.5 bg-slate-800 text-white rounded-md hover:bg-slate-700" title={isDarkModeInPlayer ? "Chế độ sáng" : "Chế độ tối"}>
            {isDarkModeInPlayer ? <FaMoon className="text-sm sm:text-base" /> : <IoMdSunny className="text-sm sm:text-base" />}
          </button>
        </div>

        <audio ref={audioRef} src={audioSrc || ""} preload="metadata" />
      </div>
    </>
  );
};

export default AudioPlayer;