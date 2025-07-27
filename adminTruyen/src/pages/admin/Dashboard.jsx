import { FooterAdmin } from "@/components/Admin/FooterAdmin";
import { useTheme } from "@/context/ThemeContext";
import { Package, PencilLine, Star, Trash, TrendingUp, Users, BookOpen, Eye, BarChart3, DollarSign } from "lucide-react";
import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart } from "recharts";
import AuthorManager from "./authorManager"
import NovelManager from "./NovelManagement";
import CategorisManagement from "./CategoryManagement";
import AnalyticsReport from "../AnalyticsReport";

const Dashboard = () => {
    const { theme } = useTheme();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-300">
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                                Bảng Điều Khiển Quản Trị
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 text-lg">
                                Chào mừng bạn quay trở lại với bảng điều khiển quản trị
                            </p>
                        </div>
                        
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
                            <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 min-w-[140px]">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                        <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Hoạt Động</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">98.5%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 min-w-[140px]">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Người Dùng</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">1,234</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 min-w-[140px]">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                        <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Truyện</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">856</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="animate-slide-up">
                    <AnalyticsReport />
                </div>
                
                {/* Footer */}
                <div className="mt-8">
                    <FooterAdmin/>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
