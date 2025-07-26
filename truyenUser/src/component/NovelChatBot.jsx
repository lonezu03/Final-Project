import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Send, Bot, X, Book, Star } from "lucide-react";
import { useTheme } from '../context/ThemeContext';

const API_KEY = "AIzaSyAAP-1OqLhEfCiJrWNH_xmXB2dVp2f-Df4";
const MODEL_NAME = "gemini-2.5-flash-lite";

const genAI = new GoogleGenerativeAI(API_KEY);

const NovelChatBot = () => {
  const { isDarkMode } = useTheme();
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "🎉 Xin chào! Tôi là trợ lý ảo thông minh của website truyện với khả năng tìm kiếm toàn diện!\n\n🔍 Tôi có thể giúp bạn:\n📚 Tìm truyện theo thể loại cụ thể\n⭐ Gợi ý truyện hay nhất, hot nhất\n👤 Tìm truyện theo tác giả yêu thích\n📊 Lọc theo đánh giá, số chương, lượt xem\n✅ Tìm truyện hoàn thành hoặc đang cập nhật\n🆕 Khám phá truyện mới nhất\n\n💡 Thử hỏi: \"Gợi ý truyện hot\", \"Truyện [thể loại] hay nhất\", \"Truyện của [tác giả]\", \"Truyện hoàn thành nhiều chương\"...",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Lấy dữ liệu novels từ Redux store
  const novels = useSelector((state) => state.novels.novels || []);
  console.log("Novels data from Redux:", novels);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Kiểm tra nếu không có dữ liệu novels
      if (!novels || novels.length === 0) {
        const noDataMessage = {
          sender: "bot",
          text: "Hiện tại chưa có dữ liệu truyện nào trong hệ thống. Vui lòng thử lại sau khi dữ liệu đã được tải.",
        };
        setMessages((prev) => [...prev, noDataMessage]);
        setIsLoading(false);
        return;
      }

      const chat = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      // Tạo context từ dữ liệu novels với thông tin chi tiết - chỉ 10 truyện đầu để test
      const limitedNovels = novels.filter(novel => novel && novel.title).slice(0, 10);
      const novelContext = limitedNovels
        .map((novel) => {
          const rating = novel.rating ? parseFloat(novel.rating).toFixed(1) : "Chưa có đánh giá";
          const categories = novel.categories && novel.categories.length > 0
            ? novel.categories
                .filter(cat => cat && cat.categoryName)
                .map(cat => cat.categoryName)
                .join(", ")
            : "Chưa phân loại";
          const authors = novel.authors && novel.authors.length > 0
            ? novel.authors
                .filter(author => author && author.authorName)
                .map(author => author.authorName)
                .join(", ")
            : "Chưa có tác giả";
          
          const status = novel.status || "Không xác định";
          const totalChapters = novel.totalChapters || 0;
          const viewCount = novel.viewCount || 0;
          const description = novel.description && novel.description.trim() 
            ? novel.description.substring(0, 150) + (novel.description.length > 150 ? "..." : "")
            : "Chưa có mô tả";
          
          return `[${novel.idNovel}] "${novel.title}"
- Tác giả: ${authors}
- Thể loại: ${categories}
- Đánh giá: ${rating}/5.0 sao
- Trạng thái: ${status}
- Số chương: ${totalChapters}
- Lượt xem: ${viewCount.toLocaleString()}
- Mô tả: ${description}`;
        })
        .join("\n\n");

      // Tạo danh sách keywords từ dữ liệu thực tế - chỉ từ limitedNovels
      const allCategories = [...new Set(
        limitedNovels.flatMap(novel =>
          novel.categories
            ? novel.categories
                .filter(cat => cat && cat.categoryName)
                .map(cat => cat.categoryName.toLowerCase())
            : []
        )
      )].filter(cat => cat); // Lọc bỏ các giá trị falsy

      const allAuthors = [...new Set(
        limitedNovels.flatMap(novel =>
          novel.authors
            ? novel.authors
                .filter(author => author && author.authorName)
                .map(author => author.authorName.toLowerCase())
            : []
        )
      )].filter(author => author); // Lọc bỏ các giá trị falsy

      const availableTitles = limitedNovels.map(novel => `"${novel.title}"`).join(", ");

      const keywordsList = [
        `TÊN TRUYỆN CÓ SẴN: ${availableTitles}`,
        `THỂ LOẠI: ${allCategories.join(", ")}`,
        `TÁC GIẢ: ${allAuthors.join(", ")}`,
        "TÌM KIẾM: hot, hay nhất, đánh giá cao, rating cao, mới nhất, hoàn thành, đang cập nhật, nhiều chương, phổ biến"
      ].join(" | ");

      const prompt = `Bạn là một trợ lý thông minh cho website đọc truyện online. 

⚠️ QUAN TRỌNG: BẠN CHỈ ĐƯỢC SỬ DỤNG ĐÚNG THÔNG TIN TỪ DANH SÁCH TRUYỆN DƯỚI ĐÂY. KHÔNG ĐƯỢC TỰ TẠO TÊN TRUYỆN, TÁC GIẢ HAY THÔNG TIN KHÁC.

DANH SÁCH ${limitedNovels.length} TRUYỆN CÓ SẴN TRONG HỆ THỐNG:

${novelContext}

${keywordsList}

HỆ THỐNG ĐÁNH GIÁ:
- Rating từ 1.0 đến 5.0 sao
- Truyện "hot" = rating >= 4.0 và lượt xem cao
- Truyện "hay nhất" = rating cao nhất
- Truyện "phổ biến" = lượt xem cao nhất

QUY TẮC NGHIÊM NGẶT:
1. CHỈ sử dụng tên truyện từ danh sách trên (VÍ DỤ: nếu có "Doraemon" trong danh sách thì chỉ gợi ý "Doraemon", không tự tạo "Nobita phiêu lưu ký")
2. CHỈ sử dụng tác giả từ danh sách trên
3. CHỈ sử dụng thông tin rating, số chương, trạng thái từ danh sách trên
4. Nếu không tìm thấy truyện phù hợp với yêu cầu, hãy gợi ý những truyện CÓ SẴN có rating cao nhất
5. LUÔN kiểm tra lại tên truyện bạn gợi ý có trong danh sách hay không

Người dùng hỏi: ${input}

Hãy trả lời dựa CHÍNH XÁC trên dữ liệu trên, không tự bịa thêm:`;

      console.log("Novel count being sent to AI:", limitedNovels.length);
      console.log("Sample novels:", limitedNovels.slice(0, 3).map(n => n.title));

      const result = await chat.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const response = await result.response;
      const text = response.text();
      
      console.log("Gemini response:", text); // Debug log

      // Tìm tất cả truyện xuất hiện trong câu trả lời và hiển thị với thông tin chi tiết
      let botResponse = text;
      const foundNovels = [];

      // Tìm các truyện được đề cập trong câu trả lời
      limitedNovels
        .filter(novel => novel && novel.title) // Lọc novel hợp lệ
        .forEach((novel) => {
          if (text.toLowerCase().includes(novel.title.toLowerCase())) {
            foundNovels.push(novel);
          }
        });

      // Nếu không tìm thấy truyện cụ thể, tìm theo từ khóa và yêu cầu đặc biệt
      if (foundNovels.length === 0) {
        const inputLower = input.toLowerCase();
        const textLower = text.toLowerCase();
        let matchingNovels = [];

        // 1. Tìm theo thể loại
        const validNovels = limitedNovels.filter(novel => novel && novel.title);
        
        allCategories.forEach((category) => {
          if (category && (inputLower.includes(category) || textLower.includes(category))) {
            validNovels.forEach((novel) => {
              const categories = novel.categories || [];
              const hasCategory = categories.some(cat => 
                cat && cat.categoryName && cat.categoryName.toLowerCase().includes(category)
              );
              if (hasCategory && !matchingNovels.some((fn) => fn.idNovel === novel.idNovel)) {
                matchingNovels.push(novel);
              }
            });
          }
        });

        // 2. Tìm theo tác giả
        allAuthors.forEach((author) => {
          if (author && (inputLower.includes(author) || textLower.includes(author))) {
            validNovels.forEach((novel) => {
              const authors = novel.authors || [];
              const hasAuthor = authors.some(auth => 
                auth && auth.authorName && auth.authorName.toLowerCase().includes(author)
              );
              if (hasAuthor && !matchingNovels.some((fn) => fn.idNovel === novel.idNovel)) {
                matchingNovels.push(novel);
              }
            });
          }
        });

        // 3. Xử lý các yêu cầu đặc biệt
        if (inputLower.includes("hot") || inputLower.includes("hay") || 
            inputLower.includes("đánh giá cao") || inputLower.includes("rating cao")) {
          // Truyện có rating cao (>= 4.0)
          matchingNovels = validNovels.filter(novel => 
            novel.rating && parseFloat(novel.rating) >= 4.0
          );
          // Nếu không có truyện nào >= 4.0, lấy những truyện có rating cao nhất
          if (matchingNovels.length === 0) {
            matchingNovels = validNovels.filter(novel => novel.rating && parseFloat(novel.rating) > 0);
          }
        } else if (inputLower.includes("mới nhất") || inputLower.includes("vừa ra")) {
          // Truyện mới nhất
          matchingNovels = [...validNovels];
        } else if (inputLower.includes("hoàn thành")) {
          // Truyện đã hoàn thành
          matchingNovels = validNovels.filter(novel => 
            novel.status && novel.status.toUpperCase() === 'COMPLETED'
          );
        } else if (inputLower.includes("đang cập nhật") || inputLower.includes("ongoing")) {
          // Truyện đang cập nhật
          matchingNovels = validNovels.filter(novel => 
            !novel.status || novel.status.toUpperCase() !== 'COMPLETED'
          );
        } else if (inputLower.includes("nhiều chương")) {
          // Truyện có nhiều chương
          matchingNovels = validNovels.filter(novel => 
            novel.totalChapters && novel.totalChapters > 50
          );
        } else if (inputLower.includes("phổ biến") || inputLower.includes("lượt xem")) {
          // Truyện phổ biến (theo lượt xem)
          matchingNovels = validNovels.filter(novel => 
            novel.viewCount && novel.viewCount > 1000
          );
        }

        // Nếu vẫn không tìm thấy, lấy tất cả truyện có rating > 0
        if (matchingNovels.length === 0) {
          matchingNovels = validNovels.filter(novel => 
            novel.rating && parseFloat(novel.rating) > 0
          );
          // Nếu vẫn không có, lấy tất cả truyện hợp lệ
          if (matchingNovels.length === 0) {
            matchingNovels = validNovels;
          }
        }

        // Xử lý sắp xếp theo yêu cầu
        if (matchingNovels.length > 0) {
          if (inputLower.includes("hay nhất") || inputLower.includes("đánh giá cao") || 
              inputLower.includes("rating cao") || inputLower.includes("hot")) {
            // Sắp xếp theo rating giảm dần
            matchingNovels.sort((a, b) => {
              const ratingA = parseFloat(a.rating || "0");
              const ratingB = parseFloat(b.rating || "0");
              return ratingB - ratingA;
            });
            foundNovels.push(...matchingNovels.slice(0, 3));
          } else if (inputLower.includes("mới nhất") || inputLower.includes("vừa ra")) {
            // Sắp xếp theo ngày tạo hoặc ID giảm dần
            matchingNovels.sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
              }
              return b.idNovel.localeCompare(a.idNovel);
            });
            foundNovels.push(...matchingNovels.slice(0, 3));
          } else if (inputLower.includes("phổ biến") || inputLower.includes("lượt xem")) {
            // Sắp xếp theo lượt xem giảm dần
            matchingNovels.sort((a, b) => {
              const viewA = a.viewCount || 0;
              const viewB = b.viewCount || 0;
              return viewB - viewA;
            });
            foundNovels.push(...matchingNovels.slice(0, 3));
          } else if (inputLower.includes("nhiều chương")) {
            // Sắp xếp theo số chương giảm dần
            matchingNovels.sort((a, b) => {
              const chaptersA = a.totalChapters || 0;
              const chaptersB = b.totalChapters || 0;
              return chaptersB - chaptersA;
            });
            foundNovels.push(...matchingNovels.slice(0, 3));
          } else {
            // Mặc định sắp xếp theo rating, sau đó theo lượt xem
            matchingNovels.sort((a, b) => {
              const ratingA = parseFloat(a.rating || "0");
              const ratingB = parseFloat(b.rating || "0");
              if (ratingB !== ratingA) return ratingB - ratingA;
              
              const viewA = a.viewCount || 0;
              const viewB = b.viewCount || 0;
              return viewB - viewA;
            });
            foundNovels.push(...matchingNovels.slice(0, 5));
          }
        }
      }

      // Nếu vẫn không tìm thấy gì, lấy những truyện tốt nhất
      if (foundNovels.length === 0) {
        const validNovels = novels.filter(novel => novel && novel.title);
        const bestNovels = validNovels
          .filter(novel => novel.rating && parseFloat(novel.rating) > 0)
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        
        if (bestNovels.length > 0) {
          foundNovels.push(...bestNovels.slice(0, 3));
        } else if (validNovels.length > 0) {
          foundNovels.push(...validNovels.slice(0, 3));
        }
      }

      // Tạo response với links cho tên truyện
      let replaced = false;
      let elements = [text];
      limitedNovels
        .filter(novel => novel && novel.title) // Lọc bỏ novel không hợp lệ
        .forEach((novel) => {
          elements = elements.flatMap((el) => {
            if (typeof el === "string") {
              const novelTitle = novel.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex characters
              const parts = el.split(new RegExp(`(${novelTitle})`, "gi"));
              if (parts.length > 1) replaced = true;
              return parts.map((part, idx) =>
                part.toLowerCase() === novel.title.toLowerCase() ? (
                  <Link
                    key={novel.idNovel + "-" + idx}
                    to={`/novel/${novel.idNovel}`}
                    className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'} hover:underline font-bold`}
                    onClick={() => setIsChatting(false)}
                  >
                    {part}
                  </Link>
                ) : (
                  part
                )
              );
            }
            return el;
          });
        });

      // Tạo component hiển thị truyện với thông tin chi tiết đầy đủ
      const novelCards = foundNovels
        .filter(novel => novel && novel.title) // Đảm bảo novel hợp lệ
        .map((novel) => {
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
          const viewCount = novel.viewCount ? novel.viewCount.toLocaleString() : "0";

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
                  {novel.title}
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
                    {novel.totalChapters || 0} chương
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
                  {novel.description && (
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} truncate max-w-[100px]`}>
                      {novel.description.substring(0, 20)}...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      });

      if (replaced) {
        botResponse = (
          <div>
            <div className="mb-2">{elements}</div>
            {foundNovels.length > 0 && (
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  Truyện liên quan:
                </p>
                {novelCards}
              </div>
            )}
          </div>
        );
      } else if (foundNovels.length > 0) {
        botResponse = (
          <div>
            <div className="mb-2">{text}</div>
            <div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Truyện liên quan:</p>
              {novelCards}
            </div>
          </div>
        );
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
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 z-50 animate-bounce"
        aria-label="Mở hộp thoại chat"
      >
        <Bot size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl z-50 border flex flex-col overflow-hidden max-h-[calc(100vh-2rem)]`}>
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} />
          </div>
          <h3 className="font-bold text-lg">Trợ lý đọc truyện</h3>
        </div>
        <div className="flex items-center gap-1">
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
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
            disabled={isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovelChatBot;
