import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Send, Bot, X, Book, Star } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import { GEMINI_CONFIG } from '../config/gemini';

const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.API_KEY);

const NovelChatBot = () => {
  const { isDarkMode } = useTheme();
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

      const chat = genAI.getGenerativeModel({ model: GEMINI_CONFIG.MODEL_NAME });
      
      // Tạo context từ dữ liệu novels với thông tin chi tiết - tối đa 100 truyện
      const limitedNovels = novels.filter(novel => novel && (novel.nameNovel || novel.title)).slice(0, 100);
      const novelContext = limitedNovels
        .map((novel) => {
          const title = novel.nameNovel || novel.title || "Chưa có tên";
          const rating = novel.rating ? parseFloat(novel.rating).toFixed(1) : "0";
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
          
          const status = novel.status || novel.statusNovel || "Không xác định";
          const totalChapters = novel.totalChapter || novel.totalChapters || 0;
          const viewCount = novel.totalView || novel.viewCount || 0;
          const description = (novel.descriptionNovel || novel.description) && (novel.descriptionNovel || novel.description).trim() 
            ? (novel.descriptionNovel || novel.description).substring(0, 200) + ((novel.descriptionNovel || novel.description).length > 200 ? "..." : "")
            : "Chưa có mô tả";

          return `[${novel.idNovel}] "${title}"
- Tác giả: ${authors}
- Thể loại: ${categories}
- Đánh giá: ${rating}/5.0 sao
- Trạng thái: ${status}
- Số chương: ${totalChapters}
- Lượt xem: ${viewCount.toLocaleString()}
- Mô tả: ${description}`;
        })
        .join("\n\n");

      // Tạo danh sách keywords từ dữ liệu thực tế
      const allCategories = [...new Set(
        limitedNovels.flatMap(novel =>
          novel.categories
            ? novel.categories
                .filter(cat => cat && cat.categoryName)
                .map(cat => cat.categoryName.toLowerCase())
            : []
        )
      )].filter(cat => cat);

      const allAuthors = [...new Set(
        limitedNovels.flatMap(novel =>
          novel.authors
            ? novel.authors
                .filter(author => author && author.authorName)
                .map(author => author.authorName.toLowerCase())
            : []
        )
      )].filter(author => author);

      const keywordsList = [
        `THỂ LOẠI CÓ SẴN: ${allCategories.join(", ")}`,
        `TÁC GIẢ CÓ SẴN: ${allAuthors.join(", ")}`,
        "TÌM KIẾM: hot, hay nhất, đánh giá cao, rating cao, mới nhất, hoàn thành, đang cập nhật, nhiều chương, phổ biến"
      ].join(" | ");

      const prompt = `Bạn là một trợ lý thông minh cho website đọc truyện online với khả năng tìm kiếm nâng cao và hiểu biết sâu về sở thích đọc truyện.

⚠️ QUAN TRỌNG: BẠN CHỈ ĐƯỢC SỬ DỤNG ĐÚNG THÔNG TIN TỪ DANH SÁCH TRUYỆN DƯỚI ĐÂY.

DANH SÁCH ${limitedNovels.length} TRUYỆN CÓ SẴN TRONG HỆ THỐNG:

${novelContext}

${keywordsList}

HỆ THỐNG ĐÁNH GIÁ VÀ TÌM KIẾM:
- Rating từ 0 đến 5.0 sao
- Truyện "hot" = rating >= 4.0 và lượt xem cao
- Truyện "hay nhất" = rating cao nhất  
- Truyện "phổ biến" = lượt xem cao nhất
- Truyện "mới nhất" = ID lớn nhất hoặc được tạo gần đây nhất
- Truyện "hoàn thành" = status là "COMPLETED"
- Truyện "đang cập nhật" = status khác "COMPLETED"
- Truyện "nhiều chương" = số chương > 50

CÁC LOẠI YÊU CẦU TÌM KIẾM CHỦ YẾU:

1. **TÌM THEO TÁC GIẢ:**
   - "truyện của [tên tác giả]" 
   - "tác giả [tên] viết gì hay"
   - "gợi ý truyện của [tác giả]"
   → Tìm tất cả truyện của tác giả đó, sắp xếp theo rating cao nhất

2. **TÌM THEO THỂ LOẠI:**
   - "thể loại [tên thể loại]"
   - "truyện [romance/hành động/kinh dị/...]" 
   - "tìm truyện [thể loại] hay nhất"
   → Tìm truyện thuộc thể loại đó, ưu tiên rating cao

3. **TÌM THEO SỞ THÍCH/MÔ TẢ:**
   - "tôi thích truyện về [chủ đề]"
   - "truyện có nội dung [mô tả]"
   - "gợi ý truyện [tính cách/tình huống cụ thể]"
   → Phân tích mô tả trong description để tìm truyện phù hợp

4. **TÌM KẾT HỢP:**
   - "truyện [thể loại] của tác giả [tên]"
   - "truyện [thể loại] có [đặc điểm]"
   → Kết hợp nhiều tiêu chí

5. **TÌM THEO TIÊU CHÍ ĐẶC BIỆT:**
   - "truyện hot", "hay nhất", "phổ biến"
   - "truyện hoàn thành", "nhiều chương"
   - "mới nhất", "đánh giá cao"

HƯỚNG DẪN PHÂN TÍCH YÊU CẦU:

🔍 **Bước 1: Nhận diện loại yêu cầu**
- Xác định người dùng muốn tìm theo tác giả, thể loại, mô tả sở thích hay kết hợp
- Trích xuất từ khóa chính (tên tác giả, thể loại, đặc điểm mong muốn)

🎯 **Bước 2: Áp dụng logic tìm kiếm phù hợp**
- **Tác giả**: Khớp chính xác tên trong trường "authors"
- **Thể loại**: Khớp trong trường "categories" 
- **Mô tả sở thích**: Phân tích description để tìm nội dung liên quan
- **Kết hợp**: Áp dụng nhiều điều kiện cùng lúc

⭐ **Bước 3: Sắp xếp kết quả**
- Ưu tiên rating cao, lượt xem nhiều
- Nếu có nhiều lựa chọn, chọn đa dạng thể loại
- Tối đa 5 truyện chất lượng nhất

NHIỆM VỤ:
1. Phân tích câu hỏi của người dùng để hiểu chính xác yêu cầu
2. Xác định loại tìm kiếm (tác giả/thể loại/sở thích/kết hợp)
3. Áp dụng logic tìm kiếm phù hợp với từng loại
4. Sắp xếp và chọn lọc kết quả tốt nhất
5. Trả về JSON chứa ID của các truyện phù hợp

QUY TẮC TRẢ VỀ:
1. CHỈ TRẢ LỜI BẰNG MỘT CHUỖI JSON HỢP LỆ.
2. Chuỗi JSON phải là một mảng chứa các ID của truyện tìm được (ví dụ: ["id_truyen_1", "id_truyen_2", "id_truyen_3"]).
3. Nếu không tìm thấy truyện nào phù hợp, hãy trả về một mảng rỗng [].
4. Tối đa 5 truyện trong mảng kết quả.
5. KHÔNG thêm bất kỳ text nào khác ngoài JSON.
6. Ưu tiên truyện có rating cao và phù hợp nhất với yêu cầu.

Người dùng hỏi: ${input}

JSON response:`;

      console.log("Novel count being sent to AI:", limitedNovels.length);
      console.log("Sample novels:", limitedNovels.slice(0, 3).map(n => n.nameNovel || n.title));

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
          </div>
        );
      } else {
        botResponse = "😔 Rất tiếc, tôi không tìm thấy truyện nào phù hợp với yêu cầu của bạn. Bạn có thể thử tìm với từ khóa khác nhé!\n\n💡 Thử hỏi: \"Gợi ý truyện hot\", \"Truyện romance hay nhất\", \"Truyện hoàn thành nhiều chương\"...";
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
