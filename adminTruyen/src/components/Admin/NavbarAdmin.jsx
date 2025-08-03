import { BellIcon, ChevronsLeft, LogOut, Moon, Search, Settings, Sun, User, Calendar, Eye, X } from "lucide-react";
import React, { useState, useEffect } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { logoutUser, getAllReport } from "@/redux/userSlice";
import AdminReportListener from "./AdminReportListener";

const NavbarAdmin = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser, allReports, reportsLoading } = useSelector((state) => state.user) || {};

    // State để quản lý thông báo real-time
    const [notifications, setNotifications] = useState([
        // {
        //     id: 1,
        //     type: 'story',
        //     title: '✨ Truyện mới được thêm',
        //     message: 'Tác giả Nguyễn Văn An đã thêm truyện "Kiếm Đạo Độc Tôn"',
        //     time: '2 phút trước',
        //     isNew: true
        // },
        // {
        //     id: 2,
        //     type: 'comment',
        //     title: '💬 Bình luận mới',
        //     message: 'Người dùng reader123 đã bình luận truyện "Ma Đạo Tổ Sư"',
        //     time: '5 phút trước',
        //     isNew: true
        // },
        // {
        //     id: 3,
        //     type: 'review',
        //     title: '⭐ Đánh giá mới',
        //     message: 'Truyện "Douluo Đại Lục" nhận được đánh giá 5 sao',
        //     time: '10 phút trước',
        //     isNew: false
        // }
    ]);

    const [notificationCount, setNotificationCount] = useState(0);

    // State để quản lý dialog preview
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Xử lý thông báo mới từ WebSocket
    const handleNewReport = (report) => {
        console.log('🔔 Received new report in NavbarAdmin:', report);
        
        const newNotification = {
            id: report.id || Date.now(),
            type: 'report',
            title: '🚨 Báo cáo mới từ người dùng',
            message: report.content || 'Có báo cáo mới từ người dùng',
            time: report.createdAt || new Date().toISOString(),
            isNew: true,
            data: {
                ...report,
                fullContent: report.content,
                statusReport: report.statusReport,
                userNameUser: report.reporterEmail,
                createAt: report.createdAt || new Date().toISOString()
            }
        };

        // Thêm báo cáo mới vào đầu danh sách, tránh duplicate
        setNotifications(prev => {
            const existingIndex = prev.findIndex(n => n.id === newNotification.id);
            if (existingIndex !== -1) {
                // Nếu báo cáo đã tồn tại, cập nhật nó
                const updated = [...prev];
                updated[existingIndex] = newNotification;
                return updated;
            }
            // Nếu chưa tồn tại, thêm vào đầu danh sách
            return [newNotification, ...prev];
        });
        
        setNotificationCount(prev => prev + 1);
        
        // Hiển thị browser notification nếu được phép
        if (Notification.permission === 'granted') {
            const notificationBody = report.content?.length > 50 
                ? `${report.content.substring(0, 50)}...` 
                : report.content;
                
            new Notification('📩 Báo cáo mới từ người dùng', {
                body: notificationBody || 'Có báo cáo mới cần xử lý',
                icon: '/letter-t.png',
                tag: 'admin-report-' + newNotification.id,
                requireInteraction: true
            });
        }
    };

    // Yêu cầu quyền notification khi component mount
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Load báo cáo khi component mount
    useEffect(() => {
        if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER')) {
            dispatch(getAllReport());
        }
    }, [dispatch, currentUser]);

    // Chuyển đổi báo cáo từ API thành notifications khi allReports thay đổi
    useEffect(() => {
        if (allReports && allReports.length > 0) {
            const reportsAsNotifications = allReports.map(report => ({
                id: report.id,
                type: 'report',
                title: '📋 Báo cáo từ người dùng',
                message: report.content || 'Không có nội dung',
                time: report.createdAt,
                isNew: false, // Báo cáo cũ không đánh dấu là mới
                data: {
                    ...report,
                    fullContent: report.content,
                    statusReport: report.statusReport,
                    userNameUser: report.reporterEmail,
                    createAt: report.createdAt
                }
            }));

            // Sắp xếp theo thời gian tạo (mới nhất trước)
            reportsAsNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));
            
            setNotifications(reportsAsNotifications);
            setNotificationCount(0); // Báo cáo cũ không tính vào số thông báo chưa đọc
        }
    }, [allReports]);

    const handleNotificationClick = (notification) => {
        // Đánh dấu là đã đọc
        setNotifications(prev => 
            prev.map(n => 
                n.id === notification.id 
                    ? { ...n, isNew: false }
                    : n
            )
        );
        
        // Giảm số lượng thông báo chưa đọc
        if (notification.isNew) {
            setNotificationCount(prev => Math.max(0, prev - 1));
        }

        // Mở dialog preview
        setSelectedNotification(notification);
        setIsDialogOpen(true);
    };

    const handlePreviewNotification = (notification, event) => {
        // Ngăn event bubbling để không trigger dropdown close
        event.stopPropagation();
        
        // Mở dialog preview mà không đánh dấu đã đọc
        setSelectedNotification(notification);
        setIsDialogOpen(true);
    };

    const formatNotificationTime = (timeString) => {
        if (timeString === 'Vừa xong') return timeString;
        
        // Nếu là timestamp thì format lại
        try {
            const date = new Date(timeString);
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            
            if (diffInMinutes < 1) return 'Vừa xong';
            if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
            return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
        } catch {
            return timeString;
        }
    };

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
        <>
            {/* WebSocket Listener */}
            <AdminReportListener onNewReport={handleNewReport} />
            
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
                {/* <div className="relative hidden md:flex">
                    <div className="flex items-center gap-4 rounded-2xl border-2 border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-red-50/80 px-6 py-3 backdrop-blur-sm transition-all duration-300 focus-within:border-orange-400 focus-within:from-orange-100/90 focus-within:to-red-100/90 focus-within:shadow-xl focus-within:scale-105 dark:border-slate-700/60 dark:from-slate-800/80 dark:to-slate-700/80 dark:focus-within:border-orange-500 dark:focus-within:from-slate-700/90 dark:focus-within:to-slate-600/90">
                        <Search className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                        <input
                            type="text"
                            placeholder={currentUser?.role === 'MANAGER' ? 
                                "Tìm kiếm người dùng, truyện, giao dịch..." : 
                                "Tìm kiếm tác giả, truyện, bình luận..."
                            }
                            className="w-72 bg-transparent text-sm font-medium text-slate-900 placeholder:text-orange-400/70 focus:outline-none dark:text-slate-100 dark:placeholder:text-orange-400/50"
                        />
                    </div>
                </div> */}
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
                            {notificationCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-lg animate-pulse">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}
                            <span className="sr-only">Thông báo</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-96 rounded-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/95"
                    >
                        <DropdownMenuLabel className="text-sm font-bold text-orange-700 dark:text-orange-300 px-6 py-4 border-b border-orange-200/30 dark:border-orange-700/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    🔔 Thông báo 
                                    {notificationCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {notificationCount}
                                        </span>
                                    )}
                                </div>
                                {currentUser?.role === 'MANAGER' && (
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                        MANAGER
                                    </span>
                                )}
                            </div>
                        </DropdownMenuLabel>
                        <div className="max-h-80 overflow-y-auto">
                            {reportsLoading ? (
                                <div className="p-6 text-center">
                                    <div className="inline-flex items-center justify-center w-8 h-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400"></div>
                                    <div className="mt-3 text-sm text-orange-600 dark:text-orange-400">Đang tải báo cáo...</div>
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <DropdownMenuItem 
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "group flex flex-col items-start gap-2 p-6 cursor-pointer transition-all duration-200 relative",
                                            notification.isNew 
                                                ? "bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-800/30" 
                                                : "hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20"
                                        )}
                                    >
                                        {/* Preview Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handlePreviewNotification(notification, e)}
                                            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-200"
                                        >
                                            <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        </Button>

                                        <div className="flex w-full items-center justify-between pr-10">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold",
                                                    notification.isNew 
                                                        ? "text-blue-700 dark:text-blue-300" 
                                                        : "text-orange-700 dark:text-orange-300"
                                                )}>
                                                    {notification.title}
                                                </span>
                                                {notification.isNew && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                )}
                                            </div>
                                            <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                                                {formatNotificationTime(notification.time)}
                                            </span>
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </span>
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    <div className="text-4xl mb-2">🔔</div>
                                    <div className="text-sm">Không có thông báo nào</div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-orange-200/30 dark:border-orange-700/30">
                            <button 
                                onClick={() => setNotificationCount(0)}
                                className="w-full text-center text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200"
                            >
                                {notificationCount > 0 ? 'Đánh dấu tất cả đã đọc' : 'Xem tất cả thông báo'} →
                            </button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer">
                        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-orange-100/80 to-red-100/80 p-3 transition-all duration-300 hover:from-orange-200/90 hover:to-red-200/90 hover:shadow-xl hover:scale-105 dark:from-orange-900/30 dark:to-red-900/30 dark:hover:from-orange-800/40 dark:hover:to-red-800/40 border border-orange-200/50 dark:border-orange-700/30">
                            <Avatar className="h-10 w-10 ring-3 ring-orange-300/50 dark:ring-orange-600/50 shadow-lg">
                                <AvatarImage src={currentUser?.avatarUser || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUspugOXub65sbxVHOEaD-JEKC8NNWgkWhlg&s"} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-lg">
                                    {currentUser?.userNameUser?.charAt(0) || "A"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "hidden flex-col items-start lg:flex",
                                !collapsed && "md:hidden lg:flex"
                            )}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                        {currentUser?.userNameUser || "Admin"}
                                    </span>
                                    {currentUser?.role === 'MANAGER' && (
                                        <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                            MANAGER
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                                        {currentUser?.emailUser || "admin@example.com"}
                                    </span>
                                    {currentUser?.coin !== undefined && (
                                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                                            {currentUser.coin.toLocaleString()} 💰
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent 
                        align="end" 
                        className="w-80 rounded-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/95"
                    >
                        <DropdownMenuLabel className="px-6 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 ring-2 ring-orange-300/50 dark:ring-orange-600/50">
                                    <AvatarImage src={currentUser?.avatarUser || "https://github.com/shadcn.png"} />
                                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold">
                                        {currentUser?.userNameUser?.charAt(0) || "A"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                            {currentUser?.userNameUser || "Admin"}
                                        </span>
                                        {currentUser?.role === 'MANAGER' && (
                                            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-semibold">
                                                MANAGER
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                                        {currentUser?.emailUser || "admin@example.com"}
                                    </span>
                                    {currentUser?.coin !== undefined && (
                                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold mt-1 w-fit">
                                            💰 {currentUser.coin.toLocaleString()} coin
                                        </span>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-700 dark:to-red-700 h-px" />
                        
                        {/* User Stats */}
                        {(currentUser?.chapterBought?.length > 0 || currentUser?.historyRead?.length > 0) && (
                            <>
                                <div className="px-6 py-3 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20">
                                    <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">📊 Thống kê</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {currentUser?.chapterBought?.length > 0 && (
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {currentUser.chapterBought.length}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">Chương đã mua</div>
                                            </div>
                                        )}
                                        {currentUser?.historyRead?.length > 0 && (
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {currentUser.historyRead.length}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">Truyện đã đọc</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenuSeparator className="bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-700 dark:to-red-700 h-px" />
                            </>
                        )}
                        
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

        {/* Notification Preview Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl rounded-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/95">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold text-orange-700 dark:text-orange-300">
                        {selectedNotification?.title}
                        {selectedNotification?.isNew && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse">
                                MỚI
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-sm text-orange-500 dark:text-orange-400">
                        <Calendar className="h-4 w-4" />
                        {formatNotificationTime(selectedNotification?.time)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Notification Content */}
                    <div className="rounded-xl bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 p-6">
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3">
                            📄 Nội dung chi tiết:
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {selectedNotification?.message}
                        </p>
                    </div>

                    {/* Additional Data if available */}
                    {selectedNotification?.data && (
                        <div className="rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 p-6">
                            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
                                🔍 Thông tin bổ sung:
                            </h4>
                            <div className="space-y-2">
                                {selectedNotification.data.statusReport && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loại báo cáo:</span>
                                        <span className={cn(
                                            "text-xs px-2 py-1 rounded-full font-semibold",
                                            selectedNotification.data.statusReport === 'BUG' 
                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                : selectedNotification.data.statusReport === 'CONTRIBUTE'
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                        )}>
                                            {selectedNotification.data.statusReport === 'BUG' ? '🐛 Lỗi' :
                                             selectedNotification.data.statusReport === 'CONTRIBUTE' ? '🤝 Đóng góp' : '📋 Báo cáo'}
                                        </span>
                                    </div>
                                )}
                                {selectedNotification.data.userNameUser && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Người gửi:</span>
                                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full font-semibold">
                                            👤 {selectedNotification.data.userNameUser}
                                        </span>
                                    </div>
                                )}
                                {selectedNotification.data.createAt && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Thời gian tạo:</span>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">
                                            {new Date(selectedNotification.data.createAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-orange-200/30 dark:border-orange-700/30">
                        <div className="flex items-center gap-2">
                            {selectedNotification?.type === 'report' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigate('/admin/reports');
                                        setIsDialogOpen(false);
                                    }}
                                    className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 border-orange-200 text-orange-700 dark:from-orange-900/30 dark:to-red-900/30 dark:hover:from-orange-800/40 dark:hover:to-red-800/40 dark:border-orange-700/30 dark:text-orange-300"
                                >
                                    📋 Quản lý báo cáo
                                </Button>
                            )}
                        </div>
                        <Button
                            onClick={() => setIsDialogOpen(false)}
                            className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600 dark:text-slate-300"
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default NavbarAdmin;
