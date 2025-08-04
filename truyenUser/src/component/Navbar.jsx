// Navbar.js
import React, { useState, useEffect } from "react";
import { Search, UserCircle2, Settings, BookOpen, LogOut, Filter as FilterIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from './AuthModal';
import SettingsSidebar from './SettingsSidebar';
import FilterSidebar from './FilterSidebar'; // Đường dẫn đến component FilterSidebar
import { auth as firebaseAuthInstance } from '../firebase-config'; // Đổi tên để rõ ràng hơn
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useTheme } from '../context/ThemeContext';

// *** THÊM IMPORT CHO REDUX ***
import { useDispatch, useSelector } from "react-redux";
import { searchNovels, clearSearchedNovels } from "../redux/novelSlice";
import { logoutUser, loadUserFromStorage, selectCurrentUser } from "../redux/userSlice";


// Hàm helper để tạo slug (giữ nguyên)
const createSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const menuItems = [
  // {
  //   label: "Thể loại",
  //   basePath: "/category",
  //   subItems: ["Tiên Hiệp", "Huyền Huyễn", "Khoa Huyễn", "Đô Thị", "Đồng Nhân", "Dã Sử", "Kỳ Ảo", "Truyện Teen"]
  // },
  // {
  //   label: "Bối cảnh thế giới",
  //   basePath: "/world",
  //   subItems: ["Chư Thiên Vạn Giới", "Dị Tộc Luyện Tinh", "Tiên Lữ Kỳ Duyên", "Mạt Thế Nguy Cơ", "Hậu Môn Thế Gia"]
  // },
  // {
  //   label: "Lưu phái",
  //   basePath: "/style",
  //   subItems: ["Sau Màn", "Mỹ Thực", "Ngọt Sủng", "Xuyên Không", "Tùy Thân", "Bàn Thờ", "Hệ Thống"]
  // },
  // {
  //   label: "Danh sách",
  //   basePath: "/list",
  //   subItems: ["Truyện Dịch", "Truyện Convert", "Truyện Full", "Truyện Hot"]
  // },
];

const Navbar = () => {
  const { isDarkMode } = useTheme();
  const [activeMenu, setActiveMenu] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSettingsSidebarOpen, setSettingsSidebarOpen] = useState(false);
  const currentUser = useSelector((state) => state.user?.currentUser || null);
const [isFilterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy currentUser từ Redux store
  const reduxCurrentUser = useSelector(selectCurrentUser);
  // Nếu bạn vẫn muốn dùng Firebase Auth để quản lý trạng thái đăng nhập ở Navbar thì có thể giữ lại
  const [firebaseUser, setFirebaseUser] = useState(null);


  useEffect(() => {
    // Đồng bộ trạng thái từ Firebase Auth (nếu bạn vẫn dùng song song)
    const unsubscribeFirebase = onAuthStateChanged(firebaseAuthInstance, (user) => {
      setFirebaseUser(user ? user : null);
      // Nếu bạn muốn Redux state được cập nhật dựa trên Firebase Auth khi tải trang
      // (ví dụ: khi người dùng đã login Firebase từ phiên trước)
      // bạn có thể dispatch action login/load user ở đây.
      // Tuy nhiên, logic loadUserFromStorage trong userSlice đã làm việc này với localStorage.
    });

    // Load user từ localStorage khi component mount (nếu chưa có trong Redux state)
    // Điều này quan trọng nếu Redux state bị reset khi refresh trang.
    if (!reduxCurrentUser) {
      dispatch(loadUserFromStorage());
    }

    return () => {
      unsubscribeFirebase();
    };
  }, [dispatch, reduxCurrentUser]); // Thêm reduxCurrentUser để tránh vòng lặp nếu logic phức tạp hơn

  // Quyết định currentUser để hiển thị dựa trên Redux hoặc Firebase (tùy theo logic chính của bạn)
  // Ưu tiên Redux currentUser nếu nó có giá trị, nếu không thì có thể dùng firebaseUser
  const displayUser = reduxCurrentUser || firebaseUser;


  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      console.log('=== NAVBAR SEARCH DEBUG ===');
      console.log('Original query:', query);
      
      const searchCriteria = {};
      let remainingQuery = query;
      
      // Tách các phần author: và category: ra khỏi query
      const parts = query.split(/\s+/);
      const authorNames = [];
      const categoryNames = [];
      const otherParts = [];
      
      let isAuthor = false;
      let isCategory = false;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (part.toLowerCase().startsWith('author:')) {
          isAuthor = true;
          isCategory = false;
          const authorPart = part.substring(7); // Bỏ "author:"
          if (authorPart) {
            authorNames.push(authorPart);
          }
        } else if (part.toLowerCase().startsWith('category:')) {
          isCategory = true;
          isAuthor = false;
          const categoryPart = part.substring(9); // Bỏ "category:"
          if (categoryPart) {
            categoryNames.push(categoryPart);
          }
        } else if (isAuthor) {
          // Tiếp tục thu thập tên tác giả
          if (part.toLowerCase().startsWith('category:')) {
            isCategory = true;
            isAuthor = false;
            const categoryPart = part.substring(9);
            if (categoryPart) {
              categoryNames.push(categoryPart);
            }
          } else {
            authorNames.push(part);
          }
        } else if (isCategory) {
          // Tiếp tục thu thập tên thể loại
          if (part.toLowerCase().startsWith('author:')) {
            isAuthor = true;
            isCategory = false;
            const authorPart = part.substring(7);
            if (authorPart) {
              authorNames.push(authorPart);
            }
          } else {
            categoryNames.push(part);
          }
        } else {
          // Phần bình thường (tên truyện)
          otherParts.push(part);
        }
      }
      
      // Ghép lại tên tác giả và thể loại
      if (authorNames.length > 0) {
        searchCriteria.authorNames = [authorNames.join(' ')];
      }
      
      if (categoryNames.length > 0) {
        searchCriteria.categoryNames = [categoryNames.join(' ')];
      }
      
      // Phần còn lại là tên truyện
      if (otherParts.length > 0) {
        searchCriteria.nameNovel = otherParts.join(' ');
        searchCriteria.nameOperator = "CONTAINS";
      }
      
      console.log('Parsed parts:', { authorNames, categoryNames, otherParts });
      console.log('Final searchCriteria:', searchCriteria);

      const paginationAndSortParams = {
        page: 0,
        size: 20,
      };
      
      dispatch(clearSearchedNovels());
      dispatch(searchNovels({ searchCriteria, paginationAndSortParams }));
      
      // Tạo URL với các tham số đầy đủ
      const urlParams = new URLSearchParams();
      if (searchCriteria.nameNovel) urlParams.append('q', searchCriteria.nameNovel);
      if (searchCriteria.authorNames) {
        urlParams.append('authors', searchCriteria.authorNames.join(','));
      }
      if (searchCriteria.categoryNames) {
        urlParams.append('categories', searchCriteria.categoryNames.join(','));
      }
      
      const finalUrl = `/search-results?${urlParams.toString()}`;
      console.log('Navigate to URL:', finalUrl);
      console.log('=== END NAVBAR SEARCH DEBUG ===');
      
      navigate(finalUrl);
      setSearchQuery("");
      setIsSearchActive(false);
    }
  };

  const handleAuthSuccess = (userFromAuthModal) => { // userFromAuthModal là user từ Firebase hoặc API của bạn
    console.log("Authentication successful in Navbar for user:", userFromAuthModal);
    // Redux state sẽ được cập nhật bởi action loginUser... trong AuthModal hoặc userSlice
    // Chỉ cần đóng modal ở đây
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Logout khỏi Firebase (nếu đang đăng nhập bằng Firebase)
      if (firebaseAuthInstance.currentUser) {
        await firebaseSignOut(firebaseAuthInstance);
        console.log("Firebase user signed out successfully.");
      }

      // Dispatch action logout của Redux để xóa token và currentUser trong Redux state và localStorage
      dispatch(logoutUser());
      console.log("Redux logout action dispatched.");

      setSettingsSidebarOpen(false); // Đóng sidebar cài đặt nếu đang mở
      
      // Reload trang để clear hết cache và force gọi lại API
      window.location.reload();
    } catch (error) {
      console.error("Error during logout: ", error);
      // Nếu có lỗi vẫn reload để đảm bảo clear cache
      window.location.reload();
    }
  };

  return (
    <div className={` top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white border-b border-gray-700' 
        : 'bg-blue-900 text-white'
    }`}>
      <div className="container mx-auto flex items-center justify-between py-4 px-6 relative">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <BookOpen className="text-2xl font-bold mr-2" size={28} />
          <span className="text-2xl font-bold">TRUYỆN CHỮ</span>
        </Link>

        {/* Menu */}
        <div className="hidden md:flex space-x-8">
          {menuItems.map((menu, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setActiveMenu(index)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className={`transition-colors duration-200 ${
                isDarkMode 
                  ? 'hover:text-blue-400' 
                  : 'hover:text-gray-300'
              }`}>
                {menu.label}
              </button>
              {activeMenu === index && (
                <div className={`absolute top-full left-0 shadow-lg py-4 px-6 w-max z-20 grid grid-cols-2 gap-x-8 gap-y-3 rounded-md transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-blue-900'
                }`}>
                  {menu.subItems.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={`${menu.basePath}/${createSlug(subItem)}`}
                      className={`whitespace-nowrap transition-colors duration-200 ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-blue-400 hover:underline' 
                          : 'text-white hover:underline'
                      }`}
                      onClick={() => setActiveMenu(null)}
                    >
                      {subItem}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Search Bar & Icons */}
        <div className="flex space-x-3 sm:space-x-4 items-center">
          <div className="flex items-center w-32 sm:w-40 md:w-64 relative">
            {isSearchActive && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="px-3 sm:px-4 py-2 w-full bg-blue-800 text-white rounded-md placeholder-gray-300 text-sm"
                placeholder="Tên truyện, author:tác giả, category:thể loại"
              />
            )}
            
            <Search
              className="text-lg sm:text-xl cursor-pointer hover:text-gray-300 absolute right-0 top-1/2 transform -translate-y-1/2 mr-2"
              size={18}
              onClick={() => {
                if (isSearchActive && searchQuery.trim()) {
                    handleSearch();
                } else {
                    setIsSearchActive(!isSearchActive);
                }
              }}
            />
          </div>

          {/* User & Settings Icons - Sử dụng displayUser (ưu tiên Redux currentUser) */}
          {displayUser ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-xs sm:text-sm hidden sm:block max-w-[100px] truncate" title={currentUser?.userNameUser}>
                {currentUser?.userNameUser}
              </span>
              <button onClick={handleLogout} title="Đăng xuất" className="hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <UserCircle2
              className="text-lg sm:text-xl cursor-pointer hover:text-gray-300"
              size={20}
              onClick={() => setAuthModalOpen(true)}
              title="Đăng nhập / Đăng ký"
            />
          )}
           <button
          onClick={() => setFilterSidebarOpen(true)}
          className="p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none"
          title="Bộ lọc"
        >
          <FilterIcon size={20} />
        </button>
          <Settings
            className="text-lg sm:text-xl cursor-pointer hover:text-gray-300"
            size={20}
            onClick={() => setSettingsSidebarOpen(true)}
            title="Cài đặt"
          />
        </div>
      </div>
 <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setFilterSidebarOpen(false)}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <SettingsSidebar
        isOpen={isSettingsSidebarOpen}
        onClose={() => setSettingsSidebarOpen(false)}
        userLoggedIn={!!displayUser} // Dùng displayUser
        username={displayUser?.displayName || displayUser?.emailUser || displayUser?.email} // Dùng displayUser
        onLogoutClick={handleLogout}
      />
    </div>
  );
};

export default Navbar;