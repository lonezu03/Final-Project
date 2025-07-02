// Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserCircle2, Settings, BookOpen, LogOut,Filter as FilterIcon } from "lucide-react";
import AuthModal from './AuthModal';
import SettingsSidebar from './SettingsSidebar';
import { auth as firebaseAuthInstance } from '../firebase-config'; // Đổi tên để rõ ràng hơn
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import FilterSidebar from './FilterSidebar'; // Đường dẫn đến component FilterSidebar

// *** THÊM IMPORT CHO REDUX ***
import { useDispatch, useSelector } // Thêm useSelector nếu cần lấy state từ Redux (ví dụ: để đồng bộ currentUser)
from "react-redux";
import { searchNovels, clearSearchedNovels } from "../redux/novelSlice"; // Đường dẫn đến novelSlice
import { logoutUser, loadUserFromStorage, selectCurrentUser } from "../redux/userSlice"; // Import action logout và selector

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
  {
    label: "Thể loại",
    basePath: "/category",
    subItems: ["Tiên Hiệp", "Huyền Huyễn", "Khoa Huyễn", "Đô Thị", "Đồng Nhân", "Dã Sử", "Kỳ Ảo", "Truyện Teen"]
  },
  {
    label: "Bối cảnh thế giới",
    basePath: "/world",
    subItems: ["Chư Thiên Vạn Giới", "Dị Tộc Luyện Tinh", "Tiên Lữ Kỳ Duyên", "Mạt Thế Nguy Cơ", "Hậu Môn Thế Gia"]
  },
  {
    label: "Lưu phái",
    basePath: "/style",
    subItems: ["Sau Màn", "Mỹ Thực", "Ngọt Sủng", "Xuyên Không", "Tùy Thân", "Bàn Thờ", "Hệ Thống"]
  },
  {
    label: "Danh sách",
    basePath: "/list",
    subItems: ["Truyện Dịch", "Truyện Convert", "Truyện Full", "Truyện Hot"]
  },
];

const Navbar = () => {
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
      const searchCriteria = {
        nameNovel: query,
        nameOperator: "CONTAINS",
      };
      const paginationAndSortParams = {
        page: 0,
        size: 20,
      };
      dispatch(clearSearchedNovels());
      dispatch(searchNovels({ searchCriteria, paginationAndSortParams }));
      navigate(`/search-results?q=${encodeURIComponent(query)}`);
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
      navigate('/'); // Điều hướng về trang chủ sau khi logout
    } catch (error) {
      console.error("Error during logout: ", error);
    }
  };

  return (
    <div className="bg-blue-900 text-white">
      <div className="container mx-auto flex items-center justify-between py-4 px-6 relative">
        {/* Logo */}
        <Link to="/" className="flex items-center">
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
              <button className="hover:text-gray-300">{menu.label}</button>
              {activeMenu === index && (
                <div className="absolute top-full left-0 bg-blue-900 shadow-lg py-4 px-6 w-max z-20 grid grid-cols-2 gap-x-8 gap-y-3">
                  {menu.subItems.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={`${menu.basePath}/${createSlug(subItem)}`}
                      className="whitespace-nowrap hover:underline text-white"
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
                placeholder="Tìm kiếm..."
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
              <span className="text-xs sm:text-sm hidden sm:block max-w-[100px] truncate" title={currentUser.userNameUser}>
                {currentUser.userNameUser}
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