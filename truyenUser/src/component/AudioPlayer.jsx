import React, { useState, useRef, useEffect } from 'react';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaStepBackward, FaStepForward,
  FaFastBackward, FaFastForward, FaEllipsisV, FaMoon
} from 'react-icons/fa';
import { IoMdSunny } from "react-icons/io";
import { optimizeCloudinaryAudioUrl, optimizeCloudinaryImageUrl } from '../utils/cloudinaryOptimizer';

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
  novel,
  coverImage,
  initialTime = 0,
  className = '',
  onProgressUpdate,
}) => {
  // Optimize Cloudinary URLs for better audio seeking and image loading
  const optimizedAudioSrc = optimizeCloudinaryAudioUrl(audioSrc);
  const optimizedCoverImage = optimizeCloudinaryImageUrl(coverImage);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkModeInPlayer, setIsDarkModeInPlayer] = useState(true);
  
  // THÊM STATE ĐỂ THEO DÕI TRẠNG THÁI TUA
  const [isSeeking, setIsSeeking] = useState(false);
  const [isManualSeeking, setIsManualSeeking] = useState(false);
  const seekTimeoutRef = useRef(null);
  
  // THÊM STATE ĐỂ THEO DÕI KHẢ NĂNG TUA CỦA SERVER
  const [rangeSupport, setRangeSupport] = useState('unknown'); // 'supported', 'not-supported', 'unknown'
  const [isBuffering, setIsBuffering] = useState(false);
  const rangeCheckRef = useRef(false);

// Lấy vị trí phát hiện tại
const position = audioRef.current?.currentTime || 0;
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

    // Kiểm tra khả năng Range Request của server
    const checkRangeSupport = async () => {
      if (rangeCheckRef.current || !optimizedAudioSrc) return;
      rangeCheckRef.current = true;
      
      try {
        const response = await fetch(optimizedAudioSrc, { 
          method: 'HEAD',
          headers: { 'Range': 'bytes=0-1' }
        });
        
        const acceptRanges = response.headers.get('Accept-Ranges');
        const statusCode = response.status;
        
        if (acceptRanges === 'bytes' || statusCode === 206) {
          setRangeSupport('supported');
          console.log('[AudioPlayer] Server hỗ trợ Range Request');
        } else {
          setRangeSupport('not-supported');
          console.log('[AudioPlayer] Server KHÔNG hỗ trợ Range Request, sẽ sử dụng fallback');
        }
      } catch (error) {
        console.warn('[AudioPlayer] Không thể kiểm tra Range support:', error);
        setRangeSupport('unknown');
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Set initial time sau khi đã load metadata
      if (initialTime > 0 && !isNaN(initialTime)) {
        const safeInitialTime = Math.min(Math.max(0, initialTime), audio.duration);
        const seekAndPlay = async () => {
          try {
            audio.currentTime = safeInitialTime;
            await new Promise((resolve) => {
              const handleSeeked = () => {
                audio.removeEventListener('seeked', handleSeeked);
                resolve();
              };
              audio.addEventListener('seeked', handleSeeked);
            });
            setCurrentTime(safeInitialTime);
            if (onProgressUpdate && duration > 0) {
              onProgressUpdate((safeInitialTime / duration) * 100, safeInitialTime);
            }
          } catch (error) {
            console.error('Error setting initial time:', error);
          }
        };
        seekAndPlay();
      }
    };

    const handleTimeUpdate = () => {
      if (!isManualSeeking) {
        setCurrentTime(audio.currentTime);
        if (duration > 0 && onProgressUpdate) {
          onProgressUpdate((audio.currentTime / duration) * 100, audio.currentTime);
        }
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleLoadStart = () => setIsBuffering(true);

    // Gửi thời gian hiện tại khi play/pause
    const handlePlay = () => {
      setIsBuffering(false);
      if (onProgressUpdate && duration > 0) {
        onProgressUpdate((audio.currentTime / duration) * 100, audio.currentTime);
      }
    };
    const handlePause = () => {
      if (onProgressUpdate && duration > 0) {
        onProgressUpdate((audio.currentTime / duration) * 100, audio.currentTime);
      }
    };

    // Thêm event listener cho seeking và seeked
    const handleSeeking = () => {
      setIsManualSeeking(true);
      setIsBuffering(true);
    };
    const handleSeeked = () => {
      setIsManualSeeking(false);
      setIsBuffering(false);
    };

    // Kiểm tra Range support khi audio src thay đổi
    checkRangeSupport();

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    // Gửi thời gian hiện tại khi mount nếu có duration
    if (onProgressUpdate && duration > 0) {
      onProgressUpdate((audio.currentTime / duration) * 100, audio.currentTime);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [duration, isManualSeeking, onProgressUpdate, optimizedAudioSrc]);

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
    setIsPlaying(false);
    setIsSeeking(false); // Reset trạng thái tua khi đổi chương
    setRangeSupport('unknown'); // Reset range support check
    setIsBuffering(false);
    rangeCheckRef.current = false; // Reset range check flag
  }, [optimizedAudioSrc]);

  // THÊM EFFECT ĐỂ ĐỒNG BỘ initialTime MỚI KHI optimizedAudioSrc THAY ĐỔI
useEffect(() => {
  if (audioRef.current && typeof initialTime === 'number') {
    audioRef.current.currentTime = initialTime;
  }
}, [initialTime, optimizedAudioSrc]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio && optimizedAudioSrc) {
      if (isPlaying) {
      audio.pause();
      } else {
      audio.play().catch(error => console.error("Lỗi khi phát audio:", error));
      }
      setIsPlaying(!isPlaying);
    }
    };

    // Sửa lại hàm handleSeek với fallback cho trường hợp không hỗ trợ Range
    const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio || !duration) {
      console.log('[handleSeek] Không có audio hoặc duration');
      return;
    }
    
    const seekToTime = (parseFloat(event.target.value) / 100) * duration;
    console.log('[handleSeek] Seek bar value:', event.target.value, '=> seekToTime:', seekToTime, 'Range support:', rangeSupport);
    
    // Nếu server không hỗ trợ Range Request, cảnh báo người dùng
    if (rangeSupport === 'not-supported') {
      console.warn('[handleSeek] Server không hỗ trợ Range Request, tua có thể không chính xác');
      // Vẫn thử tua nhưng với timeout ngắn hơn để không làm treo UI
      try {
        audio.currentTime = seekToTime;
        // Đặt timeout ngắn để kiểm tra xem tua có thành công không
        setTimeout(() => {
          if (Math.abs(audio.currentTime - seekToTime) > 5) {
            console.warn('[handleSeek] Tua không chính xác, có thể cần đợi file tải hoàn tất');
          }
        }, 1000);
      } catch (error) {
        console.error('[handleSeek] Lỗi khi tua (server không hỗ trợ Range):', error);
        return;
      }
    } else {
      // Server hỗ trợ Range Request, tua bình thường
      audio.currentTime = seekToTime;
    }
    
    console.log('[handleSeek] Sau khi set audio.currentTime:', audio.currentTime);
    // Nếu đang phát thì play lại (một số trình duyệt cần gọi play sau khi set currentTime)
    if (!audio.paused) {
      audio.play().then(() => {
        console.log('[handleSeek] Đã gọi play() sau khi tua, currentTime:', audio.currentTime);
      }).catch((err) => {
        console.error('[handleSeek] Lỗi khi play sau tua:', err);
      });
    } else {
      console.log('[handleSeek] Audio đang pause, không gọi play(). currentTime:', audio.currentTime);
    }
    setTimeout(() => {
      if (audio) {
        console.log('[handleSeek] 200ms sau tua, currentTime:', audio.currentTime);
      }
    }, 200);
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

    // SỬA LẠI HÀM rewind VÀ fastForward với cách tiếp cận tương tự
  const rewind = (seconds = 10) => { 
    if (audioRef.current && duration > 0) {
      const audio = audioRef.current;
      const wasPlaying = !audio.paused;
      
      if (wasPlaying) {
        audio.pause();
      }
      
      setIsSeeking(true);
      const newTime = Math.max(0, audio.currentTime - seconds);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Gửi progress update
      if (onProgressUpdate) {
        const percentage = (newTime / duration) * 100;
        onProgressUpdate(percentage, newTime);
      }
      
      // Clear timeout cũ
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      seekTimeoutRef.current = setTimeout(() => {
        setIsSeeking(false);
        if (wasPlaying) {
          audio.play().catch(error => console.error("Lỗi khi tiếp tục phát audio:", error));
        }
      }, 200);
    }
  };
  
  const fastForward = (seconds = 10) => { 
    if (audioRef.current && duration > 0) {
      const audio = audioRef.current;
      const wasPlaying = !audio.paused;
      
      if (wasPlaying) {
        audio.pause();
      }
      
      setIsSeeking(true);
      const newTime = Math.min(duration, audio.currentTime + seconds);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Gửi progress update
      if (onProgressUpdate) {
        const percentage = (newTime / duration) * 100;
        onProgressUpdate(percentage, newTime);
      }
      
      // Clear timeout cũ
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      seekTimeoutRef.current = setTimeout(() => {
        setIsSeeking(false);
        if (wasPlaying) {
          audio.play().catch(error => console.error("Lỗi khi tiếp tục phát audio:", error));
        }
      }, 200);
    }
  };
  
  const togglePlayerDarkMode = () => setIsDarkModeInPlayer(!isDarkModeInPlayer);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-orange-400 text-black p-2 shadow-lg flex items-center justify-between space-x-2 sm:space-x-3 ${className}`}>
        {/* 1. Bên trái: Ảnh bìa + Thông số */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <img
            src={optimizedCoverImage || MOCK_COVER_IMAGE_URL}
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
            <button onClick={togglePlayPause} className="text-xl sm:text-2xl md:text-3xl text-orange-500 hover:text-orange-600 disabled:opacity-40" title={isPlaying ? "Tạm dừng" : "Phát"} disabled={!optimizedAudioSrc}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={() => fastForward(10)} className="text-base sm:text-lg md:text-xl text-slate-600 hover:text-slate-900" title="Tua tới 10 giây"><FaFastForward /></button>
            <button onClick={onNextChapter} disabled={isLastChapter} className="text-base sm:text-lg md:text-xl text-slate-600 hover:text-slate-900 disabled:opacity-40" title="Chương sau"><FaStepForward /></button>
          </div>

          {/* 2b. Hiển thị thời gian & Thanh tiến trình */}
          <div className="flex-grow flex items-center space-x-2 mx-1 sm:mx-2 min-w-[120px] sm:min-w-[180px] md:min-w-[220px] relative">
            <span className="text-xs font-medium whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="relative flex-grow">
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
              
              {/* Hiển thị cảnh báo Range Request */}
              {rangeSupport === 'not-supported' && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  ⚠️ Tua có thể không chính xác
                </div>
              )}
              
              {/* Hiển thị trạng thái buffering */}
              {isBuffering && (
                <div className="absolute -top-8 right-0 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Đang tải...
                  </div>
                </div>
              )}
            </div>
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

        <audio
          ref={audioRef}
          src={optimizedAudioSrc}
          preload="auto"
          playsInline
          controls={false}
          onLoadedMetadata={(e) => {
            const audio = e.target;
            setDuration(audio.duration);
            if (initialTime > 0) {
              audio.currentTime = initialTime;
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(duration);
          }}
        />
      </div>
    </>
  );
};

export default AudioPlayer;