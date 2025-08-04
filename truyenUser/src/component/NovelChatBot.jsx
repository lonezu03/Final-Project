import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Send, Bot, X, Book, Star, Clock } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import { GEMINI_CONFIG } from '../config/gemini';

const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.API_KEY);

const NovelChatBot = () => {
  const { isDarkMode } = useTheme();
  // Không cần dispatch nữa vì dữ liệu đã được load trong App.jsx
  // const dispatch = useDispatch();
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "🎯 Xin chào! Tôi là trợ lý AI thông minh cho website truyện với khả năng tìm kiếm siêu nhanh!\n\n🔍 **Các loại tìm kiếm tôi hỗ trợ:**\n\n�‍💼 **Theo tác giả:**\n• \"Truyện của [tên tác giả]\"\n• \"Tác giả Nguyễn Nhật Ánh viết gì hay?\"\n\n� **Theo thể loại:**\n• \"Thể loại romance hay nhất\"\n• \"Truyện kinh dị đáng sợ\"\n• \"Tìm truyện hành động\"\n\n❤️ **Theo sở thích/mô tả:**\n• \"Tôi thích truyện về ma thuật\"\n• \"Truyện có nội dung lãng mạn\"\n• \"Gợi ý truyện về tình bạn\"\n\n🎨 **Kết hợp:**\n• \"Truyện romance của tác giả X\"\n• \"Thể loại hành động có yếu tố hài hước\"\n\n⭐ **Đặc biệt:**\n• \"Truyện hot\", \"hay nhất\", \"phổ biến\"\n• \"Hoàn thành\", \"nhiều chương\"\n\n💡 **Thử ngay:** \"Truyện của Kim Dung\", \"Thể loại romance\", \"Tôi thích truyện về học đường\"...",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Cache và rate limiting
  const [searchCache, setSearchCache] = useState(new Map());
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [rateLimitResetTime, setRateLimitResetTime] = useState(0);
  
  // Rate limiting constants
  const RATE_LIMIT_REQUESTS = 10; // Tối đa 10 requests
  const RATE_LIMIT_WINDOW = 60000; // Trong 1 phút (60 giây)
  const MIN_REQUEST_INTERVAL = 2000; // Tối thiểu 2 giây giữa các request
  const CACHE_DURATION = 300000; // Cache trong 5 phút

  // Lấy dữ liệu từ Redux store
  const novels = useSelector((state) => state.novels.novels || []);
  const authors = useSelector((state) => state.authors.authors || []);
  const categories = useSelector((state) => state.categories.categories || []);
  
  console.log("Novels data from Redux:", novels);
  console.log("Authors data from Redux:", authors);
  console.log("Categories data from Redux:", categories);
  
  // Memoize dữ liệu để tránh re-calculate không cần thiết
  const limitedNovels = useMemo(() => 
    novels.filter(novel => novel && (novel.nameNovel || novel.title)).slice(0, 100),
    [novels]
  );
  
  const authorsData = useMemo(() => 
    authors.filter(author => author && author.nameAuthor),
    [authors]
  );
  
  const categoriesData = useMemo(() => 
    categories.filter(category => category && category.nameCategory),
    [categories]
  );
  
  // Rate limiting check
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Reset counter nếu đã qua window
    if (now > rateLimitResetTime) {
      setRequestCount(0);
      setRateLimitResetTime(now + RATE_LIMIT_WINDOW);
    }
    
    // Kiểm tra rate limit
    if (requestCount >= RATE_LIMIT_REQUESTS) {
      return {
        allowed: false,
        message: `⏰ Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi ${Math.ceil((rateLimitResetTime - now) / 1000)} giây nữa.`
      };
    }
    
    // Kiểm tra khoảng cách tối thiểu giữa các request
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      return {
        allowed: false,
        message: `⏰ Vui lòng đợi ${Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000)} giây trước khi gửi yêu cầu tiếp theo.`
      };
    }
    
    return { allowed: true };
  }, [requestCount, rateLimitResetTime, lastRequestTime]);
  
  // Cache management
  const getCachedResult = useCallback((query) => {
    const cached = searchCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }
    return null;
  }, [searchCache]);
  
  const setCachedResult = useCallback((query, result) => {
    setSearchCache(prev => {
      const newCache = new Map(prev);
      newCache.set(query.toLowerCase(), {
        result,
        timestamp: Date.now()
      });
      
      // Giới hạn kích thước cache (tối đa 50 entries)
      if (newCache.size > 50) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      
      return newCache;
    });
  }, []);
  
  // Không cần fetch dữ liệu authors và categories nữa vì đã được load trong App.jsx
  // useEffect(() => {
  //   const shouldFetchAuthors = !authorsData || authorsData.length === 0;
  //   const shouldFetchCategories = !categoriesData || categoriesData.length === 0;
  //   
  //   if (shouldFetchAuthors) {
  //     console.log('🔄 [ChatBot] Fetching authors...');
  //     dispatch(getAllAuthors());
  //   }
  //   if (shouldFetchCategories) {
  //     console.log('🔄 [ChatBot] Fetching categories...');
  //     dispatch(getAllCategories());
  //   }
  // }, [dispatch, authorsData, categoriesData]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto reset rate limit counter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now > rateLimitResetTime && requestCount > 0) {
        setRequestCount(0);
        setRateLimitResetTime(now + RATE_LIMIT_WINDOW);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [rateLimitResetTime, requestCount]);

  // Clean old cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchCache(prev => {
        const newCache = new Map();
        const now = Date.now();
        
        for (const [key, value] of prev.entries()) {
          if (now - value.timestamp < CACHE_DURATION) {
            newCache.set(key, value);
          }
        }
        
        return newCache;
      });
    }, 60000); // Clean every minute

    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Kiểm tra rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const rateLimitMessage = {
        sender: "bot",
        text: rateLimitCheck.message,
      };
      setMessages((prev) => [...prev, rateLimitMessage]);
      return;
    }

    // Kiểm tra cache trước
    const cachedResult = getCachedResult(input);
    if (cachedResult) {
      const userMessage = { sender: "user", text: input };
      const cachedMessage = { 
        sender: "bot", 
        text: (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-500" />
              <span className="text-sm text-gray-500">Kết quả từ cache (nhanh hơn)</span>
            </div>
            {cachedResult}
          </div>
        )
      };
      setMessages((prev) => [...prev, userMessage, cachedMessage]);
      setInput("");
      return;
    }

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // Update rate limiting counters
    setRequestCount(prev => prev + 1);
    setLastRequestTime(Date.now());

    try {
      // Kiểm tra nếu không có dữ liệu novels, authors hoặc categories
      if (!limitedNovels || limitedNovels.length === 0) {
        const noDataMessage = {
          sender: "bot",
          text: "Lại dám trống rỗng? Thật chướng mắt. Em đợi đi, tôi bắt nó ra cho em.",
        };
        setMessages((prev) => [...prev, noDataMessage]);
        setIsLoading(false);
        return;
      }

      const chat = genAI.getGenerativeModel({ model: GEMINI_CONFIG.MODEL_NAME });
      
      // Tối ưu context - chỉ lấy thông tin cần thiết
      const authorsContext = authorsData.length > 0 ? authorsData
        .slice(0, 20) // Giới hạn 20 tác giả để giảm token
        .map(author => {
          const authorNovels = limitedNovels.filter(novel => 
            novel.authors && novel.authors.some(a => a.idAuthor === author.idAuthor)
          );
          return `${author.nameAuthor}: ${authorNovels.length} truyện`;
        }).join(', ') : "Chưa có dữ liệu tác giả";

      const categoriesContext = categoriesData.length > 0 ? categoriesData
        .slice(0, 15) // Giới hạn 15 thể loại để giảm token
        .map(category => {
          const categoryNovels = limitedNovels.filter(novel => 
            novel.categories && novel.categories.some(c => c.idCategory === category.idCategory)
          );
          return `${category.nameCategory}: ${categoryNovels.length} truyện`;
        }).join(', ') : "Chưa có dữ liệu thể loại";

      // Tối ưu novel context - chỉ thông tin cần thiết
      const novelContext = limitedNovels
        .map((novel) => {
          const title = novel.nameNovel || novel.title || "Chưa có tên";
          const rating = novel.rating ? parseFloat(novel.rating).toFixed(1) : "0";
          const categories = novel.categories && novel.categories.length > 0
            ? novel.categories
                .filter(cat => cat && cat.categoryName)
                .map(cat => cat.categoryName)
                .slice(0, 2) // Chỉ lấy 2 thể loại đầu
                .join(", ")
            : "Chưa phân loại";
          const authors = novel.authors && novel.authors.length > 0
            ? novel.authors
                .filter(author => author && author.authorName)
                .map(author => author.authorName)
                .slice(0, 1) // Chỉ lấy 1 tác giả đầu
                .join(", ")
            : "Chưa có tác giả";
          
          const status = novel.status || novel.statusNovel || "Không xác định";
          const totalChapters = novel.totalChapter || novel.totalChapters || 0;
          const viewCount = novel.totalView || novel.viewCount || 0;

          return `[${novel.idNovel}] "${title}" - ${authors} - ${categories} - ${rating}/5 - ${status} - ${totalChapters}ch - ${viewCount}views`;
        })
        .join("\n");

      // Prompt tối ưu - ngắn gọn hơn
      const prompt = `Bạn là trợ lý tìm kiếm truyện thông minh.

TÁC GIẢ: ${authorsContext}

THỂ LOẠI: ${categoriesContext}

TRUYỆN (${limitedNovels.length}):
${novelContext}

NHIỆM VỤ: Tìm truyện phù hợp với yêu cầu "${currentInput}"

QUY TẮC:
1. CHỈ TRẢ JSON ARRAY chứa ID của truyện phù hợp
2. Tối đa 5 truyện
3. Ưu tiên rating cao, view nhiều
4. Nếu không tìm thấy, trả về []

JSON:`;

      console.log("Optimized data being sent to AI:");
      console.log("- Novels count:", limitedNovels.length);
      console.log("- Authors count:", authorsData.length);
      console.log("- Categories count:", categoriesData.length);

      const result = await chat.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const response = await result.response;
      const text = response.text().trim();
      
      console.log("Gemini response:", text);

      // Bước 1: Parse JSON từ AI
      let foundNovelIds = [];
      try {
        // Cố gắng parse chuỗi JSON mà AI trả về
        foundNovelIds = JSON.parse(text); 
        if (!Array.isArray(foundNovelIds)) {
          throw new Error("Response is not an array");
        }
      } catch (e) {
        console.error("AI did not return valid JSON:", text);
        console.error("Parse error:", e);
        
        // Thử trích xuất JSON từ text nếu AI trả về thêm text khác
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          try {
            foundNovelIds = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            console.error("Failed to extract JSON from response");
            foundNovelIds = [];
          }
        } else {
          foundNovelIds = [];
        }
      }

      // Bước 2: Dựa vào IDs, lấy thông tin truyện từ Redux store
      const foundNovels = foundNovelIds
        .map(id => limitedNovels.find(novel => novel.idNovel === id))
        .filter(Boolean); // Lọc bỏ những truyện không tìm thấy

      console.log("Found novels:", foundNovels.length, foundNovels.map(n => n.nameNovel || n.title));

      // Bước 3: Hiển thị kết quả
      let botResponse;
      if (foundNovels.length > 0) {
        // Tạo component hiển thị truyện với thông tin chi tiết đầy đủ
        const novelCards = foundNovels.map((novel) => {
          const title = novel.nameNovel || novel.title;
          const rating = novel.rating ? parseFloat(novel.rating).toFixed(1) : "N/A";
          const categories = novel.categories && novel.categories.length > 0
            ? novel.categories
                .filter(cat => cat && cat.categoryName)
                .map(cat => cat.categoryName)
                .slice(0, 2)
                .join(", ")
            : "Chưa phân loại";
          const authors = novel.authors && novel.authors.length > 0
            ? novel.authors
                .filter(author => author && author.authorName)
                .map(author => author.authorName)
                .join(", ")
            : "Chưa có tác giả";
          const viewCount = (novel.totalView || novel.viewCount || 0).toLocaleString();
          const totalChapters = novel.totalChapter || novel.totalChapters || 0;
          const description = novel.descriptionNovel || novel.description;

          return (
            <Link
              key={novel.idNovel}
              to={`/novel/${novel.idNovel}`}
              onClick={() => setIsChatting(false)}
              className={`block ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-lg p-3 mt-2 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex-shrink-0 flex items-center justify-center`}>
                  <Book size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                    {title}
                  </h4>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    {authors} • {categories}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-current" />
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        {rating}
                      </span>
                    </div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {totalChapters} chương
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {viewCount} lượt xem
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${novel.status === 'COMPLETED' 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
                      : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                    }`}>
                      {novel.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang cập nhật'}
                    </span>
                    {description && (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} truncate max-w-[100px]`}>
                        {description.substring(0, 20)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        });

        botResponse = (
          <div>
            <p className="mb-2">🎯 Dựa trên yêu cầu của bạn, tôi tìm thấy {foundNovels.length} truyện phù hợp:</p>
            {novelCards}
            <p className="text-xs text-gray-500 mt-3">
              💡 Tìm kiếm từ {limitedNovels.length} truyện, {authorsData.length} tác giả, {categoriesData.length} thể loại
            </p>
          </div>
        );
        
        // Cache kết quả thành công
        setCachedResult(currentInput, botResponse);
      } else {
        botResponse = `Em đang thử thách tôi đấy à, bảo bối? Những thứ em tìm không xứng đáng để xuất hiện. Đưa ra một yêu cầu khác, một yêu cầu xứng tầm với em hơn.

💡 **Thử hỏi với các tác giả có sẵn:**
${authorsData.slice(0, 5).map(a => `"Truyện của ${a.nameAuthor}"`).join(', ')}

💡 **Thử hỏi với các thể loại có sẵn:**
${categoriesData.slice(0, 5).map(c => `"Thể loại ${c.nameCategory}"`).join(', ')}

💡 **Hoặc thử:** "Gợi ý truyện hot", "Truyện rating cao", "Truyện nhiều view"`;
      }

      const botMessage = { sender: "bot", text: botResponse };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error with Gemini AI:", error);
      console.error("Error details:", error.message, error.stack);
      
      // Xử lý lỗi cụ thể
      let errorText = "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
      
      if (error.message && error.message.includes("API_KEY")) {
        errorText = "Lỗi cấu hình API. Vui lòng liên hệ quản trị viên.";
      } else if (error.message && error.message.includes("quota")) {
        errorText = "Hệ thống đang quá tải. Vui lòng thử lại sau ít phút.";
      } else if (error.message && error.message.includes("network")) {
        errorText = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.";
      } else if (error.name === "TypeError") {
        errorText = "Có lỗi xử lý dữ liệu. Vui lòng thử lại với câu hỏi khác.";
      }
      
      const errorMessage = {
        sender: "bot",
        text: errorText,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChatting) {
    return (
      <button
        onClick={() => {
          setIsChatting(true);
        }}
        className="fixed right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 z-50 animate-bounce"
        style={{ bottom: '70px' }}
        aria-label="Mở hộp thoại chat"
      >
        <Bot size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed right-4 w-80 max-w-[calc(100vw-2rem)] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl z-50 border flex flex-col overflow-hidden max-h-[calc(100vh-2rem)]`} style={{ bottom: '70px' }}>
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} />
          </div>
          <h3 className="font-bold text-lg">Trợ lý đọc truyện</h3>
        </div>
        <div className="flex items-center gap-1">
          {searchCache.size > 0 && (
            <button
              onClick={() => {
                setSearchCache(new Map());
                const clearMessage = {
                  sender: "bot",
                  text: "🗑️ Đã xóa cache. Tìm kiếm tiếp theo sẽ gọi AI mới."
                };
                setMessages(prev => [...prev, clearMessage]);
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-xs"
              title="Xóa cache tìm kiếm"
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => setIsChatting(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Đóng chat"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div
        ref={chatContainerRef}
        className={`flex-1 p-4 overflow-y-auto bg-gradient-to-b ${isDarkMode ? 'from-gray-900 to-gray-800' : 'from-gray-50 to-white'} min-h-0`}
        style={{ maxHeight: "400px" }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-3 mb-4 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot size={16} />
              </div>
            )}
            <div
              className={`max-w-[250px] px-4 py-3 rounded-2xl shadow-sm ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
                  : isDarkMode 
                    ? "bg-gray-700 text-gray-100 border border-gray-600 rounded-bl-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
              }`}
            >
              <div className="text-sm leading-relaxed break-words">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-end gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={16} />
            </div>
            <div className={`${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-800 border-gray-100'} border rounded-2xl rounded-bl-sm p-3 shadow-sm`}>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
        {/* Rate limit indicator */}
        {requestCount > 0 && (
          <div className={`mb-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
            <Clock size={12} />
            <span>
              Đã sử dụng {requestCount}/{RATE_LIMIT_REQUESTS} requests trong phút này
              {requestCount >= RATE_LIMIT_REQUESTS && (
                <span className="text-orange-500 ml-1">
                  (Đã đạt giới hạn - đợi {Math.ceil((rateLimitResetTime - Date.now()) / 1000)}s)
                </span>
              )}
            </span>
          </div>
        )}
        
        {/* Cache indicator */}
        {searchCache.size > 0 && (
          <div className={`mb-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{searchCache.size} kết quả được lưu cache (tìm kiếm nhanh hơn)</span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập tin nhắn..."
            className={`flex-1 px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500' : 'border-gray-200 bg-white focus:border-blue-500'} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className={`p-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${
              isLoading || requestCount >= RATE_LIMIT_REQUESTS
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
            }`}
            disabled={isLoading || requestCount >= RATE_LIMIT_REQUESTS}
            title={
              requestCount >= RATE_LIMIT_REQUESTS 
                ? 'Đã đạt giới hạn request, vui lòng đợi'
                : 'Gửi tin nhắn'
            }
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovelChatBot;
