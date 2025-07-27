import { BellIcon, ChevronsLeft, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/redux/userSlice";

const NavbarAdmin = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user) || {};

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    const getThemeIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="h-6 w-6 transition-all text-amber-500" />;
            case 'dark':
                return <Moon className="h-6 w-6 transition-all text-slate-400" />;
            default:
                return (
                    <>
                        <Sun className="h-6 w-6 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 text-amber-500" />
                        <Moon className="absolute h-6 w-6 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 text-slate-400" />
                    </>
                );
        }
    };

    return (
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-orange-200/50 bg-white/90 backdrop-blur-xl px-8 shadow-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-900/90">
            {/* Left Side */}
            <div className="flex items-center gap-6">
                {/* Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-12 w-12 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-orange-100 hover:to-red-100 hover:scale-105 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 shadow-lg hover:shadow-xl"
                >
                    <ChevronsLeft 
                        className={cn(
                            "h-6 w-6 transition-transform duration-300 text-orange-600 dark:text-orange-400",
                            collapsed && "rotate-180"
                        )} 
                    />
                </Button>

                {/* Search Bar */}
                <div className="relative hidden md:flex">
                    <div className="flex items-center gap-4 rounded-2xl border-2 border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-red-50/80 px-6 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-orange-400 focus-within:from-orange-100/90 focus-within:to-red-100/90 focus-within:shadow-xl focus-within:scale-105 dark:border-slate-700/60 dark:from-slate-800/80 dark:to-slate-700/80 dark:focus-within:border-orange-500 dark:focus-within:from-slate-700/90 dark:focus-within:to-slate-600/90">
                        <Search className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tác giả, truyện, bình luận..."
                            className="w-72 bg-transparent text-sm font-medium text-slate-900 placeholder:text-orange-400/70 focus:outline-none dark:text-slate-100 dark:placeholder:text-orange-400/50"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                {/* Home Page Link */}
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-100 to-red-100 px-6 py-3 font-semibold text-orange-700 transition-all duration-300 hover:from-orange-200 hover:to-red-200 hover:shadow-xl hover:scale-105 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-300 dark:hover:from-orange-800/40 dark:hover:to-red-800/40 border border-orange-200/50 dark:border-orange-700/30"
                >
                    <img
                        className="h-6 w-6 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12"
                        src="/letter-t.png"
                        alt="Home"
                    />
                    <span className={cn(
                        "hidden text-sm font-bold transition-all duration-300 lg:block",
                        !collapsed && "md:hidden lg:block"
                    )}>
                        Trang chủ
                    </span>
                </a>

                {/* Theme Toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-amber-100 hover:to-yellow-100 hover:scale-105 dark:hover:from-amber-900/20 dark:hover:to-yellow-900/20 shadow-lg hover:shadow-xl"
                        >
                            {getThemeIcon()}
                            <span className="sr-only">Chuyển đổi theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-52 rounded-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/95"
                    >
                        <DropdownMenuLabel className="text-sm font-bold text-orange-700 dark:text-orange-300 px-4 py-3">
                            Chọn theme
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-700 dark:to-red-700 h-px" />
                        <DropdownMenuItem
                            onClick={() => setTheme("light")}
                            className={cn(
                                "flex items-center gap-3 rounded-xl m-2 p-3 transition-all duration-200 font-medium",
                                theme === "light" 
                                    ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/50 dark:to-red-900/50 dark:text-orange-300" 
                                    : "hover:bg-orange-50/50 dark:hover:bg-orange-900/20"
                            )}
                        >
                            <Sun className="h-5 w-5" />
                            Sáng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setTheme("dark")}
                            className={cn(
                                "flex items-center gap-3 rounded-xl m-2 p-3 transition-all duration-200 font-medium",
                                theme === "dark" 
                                    ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/50 dark:to-red-900/50 dark:text-orange-300" 
                                    : "hover:bg-orange-50/50 dark:hover:bg-orange-900/20"
                            )}
                        >
                            <Moon className="h-5 w-5" />
                            Tối
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setTheme("system")}
                            className={cn(
                                "flex items-center gap-3 rounded-xl m-2 p-3 transition-all duration-200 font-medium",
                                theme === "system" 
                                    ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/50 dark:to-red-900/50 dark:text-orange-300" 
                                    : "hover:bg-orange-50/50 dark:hover:bg-orange-900/20"
                            )}
                        >
                            <Settings className="h-5 w-5" />
                            Hệ thống
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notification */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-12 w-12 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-red-100 hover:to-pink-100 hover:scale-105 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 shadow-lg hover:shadow-xl"
                        >
                            <BellIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            {/* Notification Badge */}
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-lg animate-pulse">
                                3
                            </span>
                            <span className="sr-only">Thông báo</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-96 rounded-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/95"
                    >
                        <DropdownMenuLabel className="text-sm font-bold text-orange-700 dark:text-orange-300 px-6 py-4 border-b border-orange-200/30 dark:border-orange-700/30">
                            🔔 Thông báo mới
                        </DropdownMenuLabel>
                        <div className="max-h-80 overflow-y-auto">
                            <DropdownMenuItem className="flex flex-col items-start gap-2 p-6 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-200">
                                <div className="flex w-full items-center justify-between">
                                    <span className="font-bold text-orange-700 dark:text-orange-300">✨ Truyện mới được thêm</span>
                                    <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">2 phút trước</span>
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Tác giả <strong>Nguyễn Văn An</strong> đã thêm truyện <em>"Kiếm Đạo Độc Tôn"</em>
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-2 p-6 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-200">
                                <div className="flex w-full items-center justify-between">
                                    <span className="font-bold text-orange-700 dark:text-orange-300">💬 Bình luận mới</span>
                                    <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">5 phút trước</span>
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Người dùng <strong>reader123</strong> đã bình luận truyện <em>"Ma Đạo Tổ Sư"</em>
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-2 p-6 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-200">
                                <div className="flex w-full items-center justify-between">
                                    <span className="font-bold text-orange-700 dark:text-orange-300">⭐ Đánh giá mới</span>
                                    <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">10 phút trước</span>
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Truyện <em>"Douluo Đại Lục"</em> nhận được đánh giá 5 sao
                                </span>
                            </DropdownMenuItem>
                        </div>
                        <div className="p-4 border-t border-orange-200/30 dark:border-orange-700/30">
                            <button className="w-full text-center text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200">
                                Xem tất cả thông báo →
                            </button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer">
                        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-orange-100/80 to-red-100/80 p-3 transition-all duration-300 hover:from-orange-200/90 hover:to-red-200/90 hover:shadow-xl hover:scale-105 dark:from-orange-900/30 dark:to-red-900/30 dark:hover:from-orange-800/40 dark:hover:to-red-800/40 border border-orange-200/50 dark:border-orange-700/30">
                            <Avatar className="h-10 w-10 ring-3 ring-orange-300/50 dark:ring-orange-600/50 shadow-lg">
                                <AvatarImage src={currentUser?.avatar || "https://github.com/shadcn.png"} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-lg">
                                    {currentUser?.nameUser?.charAt(0) || "A"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "hidden flex-col items-start lg:flex",
                                !collapsed && "md:hidden lg:flex"
                            )}>
                                <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                    {currentUser?.nameUser || "Admin"}
                                </span>
                                <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                                    {currentUser?.email || "admin@example.com"}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent 
                        align="end" 
                        className="w-64 rounded-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/95"
                    >
                        <DropdownMenuLabel className="text-sm font-bold text-orange-700 dark:text-orange-300 px-6 py-4">
                            👤 Tài khoản của tôi
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-700 dark:to-red-700 h-px" />
                        <DropdownMenuItem className="flex items-center gap-3 rounded-xl m-2 p-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 font-medium">
                            <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-orange-700 dark:text-orange-300">Hồ sơ</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 rounded-xl m-2 p-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 font-medium">
                            <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-orange-700 dark:text-orange-300">Cài đặt</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gradient-to-r from-red-200 to-pink-200 dark:from-red-700 dark:to-pink-700 h-px my-2" />
                        <DropdownMenuItem 
                            onClick={handleLogout}
                            className="flex items-center gap-3 rounded-xl m-2 p-4 transition-all duration-200 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 dark:text-red-400 dark:hover:from-red-950/50 dark:hover:to-pink-950/50 dark:hover:text-red-300 font-medium"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>🚪 Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default NavbarAdmin;
