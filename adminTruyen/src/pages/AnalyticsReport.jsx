import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNovelStatistics, getAmountStatistics } from '../redux/statisticSlice';
import { useTheme } from '../context/ThemeContext';

// Import các component từ Recharts
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, LabelList
} from 'recharts';

// Import icons từ lucide-react
import { Package, TrendingUp, Star, BarChart3, PieChart, DollarSign } from 'lucide-react';

const AnalyticsReport = () => {
    const dispatch = useDispatch();
    const { theme } = useTheme();
    const { 
        novelStats, 
        amountStats, 
        loadingNovelStats, 
        loadingAmountStats, 
        error 
    } = useSelector((state) => state.statistics);

    const [novelSortBy, setNovelSortBy] = useState('totalView');
    const [amountType, setAmountType] = useState('MONTH');
    
    // Sử dụng state để lưu ngày tháng đầy đủ (YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

    // useEffect gọi API doanh thu (logic này của bạn đã đúng)
    useEffect(() => {
            const sortByForAPI = novelSortBy.replace(/([A-Z])/g, '_$1').toUpperCase();

        const amountParams = { type: amountType, monthYear: selectedDate };
        const novelParams = { top: 10, sortBy: sortByForAPI, direction: 'DESC' };

        dispatch(getAmountStatistics(amountParams));
        dispatch(getNovelStatistics(novelParams));

    }, [dispatch, amountType, selectedDate]);

    // Hàm định dạng số cho dễ đọc
    const formatNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    // Chuẩn bị dữ liệu cho biểu đồ doanh thu
    const overviewData = Object.entries(amountStats || {})
        .map(([key, value]) => {
            let label = key;
            // Nếu đang xem theo tháng, key sẽ là 'YYYY-MM-DD'
            // Chúng ta sẽ chỉ lấy phần ngày 'DD' để làm nhãn cho trục X
            if (amountType === 'MONTH' && key.includes('-')) {
                label = key.split('-')[2];
            }
            return {
                name: label,
                total: value === null ? 0 : value // Chuyển giá trị null thành 0
            };
        })
        // Sắp xếp lại để đảm bảo các ngày/tháng/năm luôn theo đúng thứ tự
        .sort((a, b) => {
             if (!a.name || !b.name) {
            return 0;
        }

        // Nếu cả hai name đều là số, sắp xếp theo số
        if (!isNaN(a.name) && !isNaN(b.name)) {
            return Number(a.name) - Number(b.name);
        }

        // Nếu là chuỗi, dùng localeCompare (bây giờ đã an toàn)
        // Chuyển cả hai về string để chắc chắn
        return String(a.name).localeCompare(String(b.name));
    });

    // Chuẩn bị dữ liệu cho biểu đồ top 5 truyện
    // Lọc dữ liệu để chỉ vẽ các truyện có giá trị khác 0
   const topNovelsData = (novelStats || [])
  .filter(novel => novel.totalView && novel.totalView > 0) // Kiểm tra xem totalView có giá trị hợp lệ và > 0
  .slice(0, 5)  // Lấy top 5 truyện
  .map(novel => ({
    name: novel.nameNovel.length > 15 ? `${novel.nameNovel.substring(0, 15)}...` : novel.nameNovel,
    [novelSortBy]: novel[novelSortBy] || 0  // Đảm bảo có giá trị hợp lệ cho các trường không có giá trị
  }));

console.log(topNovelsData); // Kiểm tra dữ liệu sau khi lọc



    
    // Tên hiển thị cho chú thích (Legend) và tooltip
    const prettySortByName = novelSortBy.replace(/TOTAL_|AVG_/g, '').replace('_', ' ').toLowerCase();

    // Tính toán tổng số lượt xem từ novelStats
    const totalViews = (novelStats || []).reduce((sum, novel) => sum + (novel.totalView || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 transition-all duration-300">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent mb-3">
                            Báo Cáo & Thống Kê
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 text-lg">
                            Phân tích dữ liệu và theo dõi hiệu suất hệ thống
                        </p>
                    </div>
                </div>
            
                {/* Các thẻ thống kê nhanh */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Số Truyện (BXH)</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{novelStats.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Lượt Xem (Top 10)</p>
                                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(totalViews)}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng Doanh Thu</p>
                                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                    {formatNumber(Object.values(amountStats || {}).reduce((sum, val) => sum + (val || 0), 0))}
                                </p>
                            </div>
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Trung Bình Đánh Giá</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {novelStats.length > 0 ? 
                                        (novelStats.reduce((sum, novel) => sum + (novel.avgRating || 0), 0) / novelStats.length).toFixed(1) 
                                        : '0.0'
                                    }
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần biểu đồ */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                    {/* Biểu đồ doanh thu */}
                    <div className="col-span-1 lg:col-span-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Tổng Quan Doanh Thu
                                </h3>
                                <div className="flex items-center gap-3">
                                    <select 
                                        value={amountType} 
                                        onChange={(e) => setAmountType(e.target.value)} 
                                        className="px-3 py-2 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                    >
                                        <option value="MONTH">Theo Tháng</option>
                                        <option value="YEAR">Theo Năm</option>
                                        <option value="DAY">Theo Ngày</option>
                                    </select>
                                    
                                    {/* Input chọn tháng, chỉ hiện khi amountType là 'MONTH' */}
                                    {amountType === 'MONTH' && (
                                        <input 
                                            type="month" 
                                            value={selectedDate.slice(0, 7)} 
                                            onChange={(e) => {
                                                setSelectedDate(`${e.target.value}-01`);
                                            }}
                                            className="px-3 py-2 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {loadingAmountStats ? (
                                <div className="h-[300px] flex justify-center items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span className="text-slate-600 dark:text-slate-300">Đang tải...</span>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={overviewData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#64748b" tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 12 }} />
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <Tooltip 
                                            formatter={(value) => [value.toLocaleString(), 'Doanh thu']} 
                                            contentStyle={{ 
                                                borderRadius: '0.75rem', 
                                                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }} 
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Biểu đồ Top Truyện - Cột Đứng */}
                    <div className="col-span-1 lg:col-span-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Top 5 Truyện
                                </h3>
                                <select 
                                    value={novelSortBy} 
                                    onChange={(e) => setNovelSortBy(e.target.value)} 
                                    className="px-3 py-2 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                >
                                    <option value="totalView">Xem Nhiều</option>
                                    <option value="totalInteract">Tương Tác</option>
                                    <option value="avgRating">Đánh Giá</option>
                                    <option value="totalChapter">Số Chương</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {loadingNovelStats ? (
                                <div className="h-[300px] flex justify-center items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span className="text-slate-600 dark:text-slate-300">Đang tải...</span>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart 
                                        data={topNovelsData} 
                                        layout="vertical" 
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis 
                                            type="category" 
                                            dataKey="name" 
                                            width={80} 
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f1f5f9' }} 
                                            formatter={(value, name) => [value.toLocaleString(), name]}
                                            contentStyle={{ 
                                                borderRadius: '0.75rem', 
                                                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar 
                                            dataKey={novelSortBy}
                                            fill="#3b82f6" 
                                            radius={[0, 8, 8, 0]}
                                            barSize={20}
                                        >
                                            <LabelList 
                                                dataKey={novelSortBy} 
                                                position="right" 
                                                formatter={(value) => formatNumber(value)}
                                                style={{ fontSize: '10px', fill: '#475569' }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            
                {/* Bảng chi tiết Top 10 Truyện */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Bảng Xếp Hạng Chi Tiết (Top 10)
                        </h2>
                    </div>
                    
                    {loadingNovelStats ? (
                        <div className="text-center py-8">
                            <div className="flex items-center justify-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-slate-600 dark:text-slate-300">Đang tải...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-200/50 dark:border-slate-700">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">#</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tên Truyện</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tác Giả</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Lượt Xem</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tương Tác</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Đánh Giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(novelStats || []).map((novel, index) => (
                                        <tr key={novel.idNovel} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{index + 1}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{novel.nameNovel}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{novel.nameAuthors?.join(', ') || 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{novel.totalView?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{novel.totalInteract?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                    <Star size={14} className="text-yellow-400 fill-current" /> 
                                                    {novel.avgRating?.toFixed(1)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReport;