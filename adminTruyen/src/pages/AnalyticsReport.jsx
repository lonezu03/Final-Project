import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNovelStatistics, getAmountStatistics } from '../redux/statisticSlice';

// Import các component từ Recharts
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, LabelList
} from 'recharts';

// Sửa lại cách import icon cho đúng, đây là nguyên nhân gây lỗi trước đó
import Package from 'lucide-react/dist/esm/icons/package';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Star from 'lucide-react/dist/esm/icons/star';

const AnalyticsReport = () => {
    const dispatch = useDispatch();
    
    // Lấy dữ liệu từ Redux store
    const { 
        novelStats, 
        amountStats, 
        loadingNovelStats, 
        loadingAmountStats, 
        error 
    } = useSelector((state) => state.statistics);

    // State để quản lý các lựa chọn của người dùng
    const [novelSortBy, setNovelSortBy] = useState('totalView');
    const [amountType, setAmountType] = useState('MONTH');

    // Gọi API khi component được tải hoặc khi lựa chọn thay đổi
   useEffect(() => {
    // Chuyển đổi camelCase (frontend) thành UPPER_SNAKE_CASE (backend yêu cầu)
    const sortByForAPI = novelSortBy.replace(/([A-Z])/g, '_$1').toUpperCase();
    
    const novelParams = { top: 10, sortBy: sortByForAPI, direction: 'DESC' };
    dispatch(getNovelStatistics(novelParams));
}, [dispatch, novelSortBy]);

    useEffect(() => {
        dispatch(getAmountStatistics(amountType));
    }, [dispatch, amountType]);

    // Hàm định dạng số cho dễ đọc
    const formatNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    // Chuẩn bị dữ liệu cho biểu đồ doanh thu
    const overviewData = Object.entries(amountStats || {}).map(([key, value]) => ({
        name: key,
        total: value
    }));

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
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Báo cáo & Thống kê</h1>
            
            {/* Các thẻ thống kê nhanh */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-5 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Tổng số truyện (BXH)</p>
                        <p className="text-3xl font-bold text-gray-900">{novelStats.length}</p>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Package size={24} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Tổng lượt xem (Top 10)</p>
                        <p className="text-3xl font-bold text-gray-900">{formatNumber(totalViews)}</p>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            {/* Phần biểu đồ */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* Biểu đồ doanh thu */}
                <div className="col-span-1 lg:col-span-4 bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <p className="font-bold text-lg text-gray-800">Tổng quan doanh thu</p>
                        <select value={amountType} onChange={(e) => setAmountType(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="DAY">Theo Ngày</option>
                            <option value="MONTH">Theo Tháng</option>
                            <option value="YEAR">Theo Năm</option>
                        </select>
                    </div>
                    {loadingAmountStats ? <div className="h-[300px] flex justify-center items-center text-gray-500">Đang tải dữ liệu...</div> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={overviewData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#6b7280" tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 12 }} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <Tooltip formatter={(value) => [value.toLocaleString(), 'Doanh thu']} contentStyle={{ borderRadius: '0.5rem' }} />
                                <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Biểu đồ Top Truyện - Cột Đứng */}
                 <div className="col-span-1 lg:col-span-3 bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <p className="font-bold text-lg text-gray-800">Top 5 Truyện</p>
                        <select value={novelSortBy} onChange={(e) => setNovelSortBy(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500">
                             <option value="totalView">Xem nhiều</option>
                            <option value="totalInteract">Tương tác</option>
                            <option value="avgRating">Đánh giá</option>
                            <option value="totalChapter">Số chương</option>
                        </select>
                    </div>
                     {loadingNovelStats ? <div className="h-[300px] flex justify-center items-center text-gray-500">Đang tải...</div> : (
                        <ResponsiveContainer width="100%" height={300}>
                            {/* Chuyển về biểu đồ cột ngang để dễ đọc tên */}
                            <BarChart 
    data={topNovelsData} 
    layout="vertical" 
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>
    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
    <XAxis type="number" tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 12, fill: '#6b7280' }} />
    <YAxis 
        type="category" 
        dataKey="name" 
        width={80} 
        tick={{ fontSize: 10, fill: '#6b7280' }}
    />
    <Tooltip 
        cursor={{ fill: '#f3f4f6' }} 
        formatter={(value, name) => [value.toLocaleString(), name]}
    />
    <Legend verticalAlign="top" height={36} />
    <Bar 
        dataKey={novelSortBy} // Kiểm tra giá trị này
        fill="#8884d8" 
        radius={[0, 8, 8, 0]} // Bo tròn góc phải cho cột ngang
        barSize={20} // Đặt kích thước cố định cho thanh bar
    >
        <LabelList 
            dataKey={novelSortBy} 
            position="right" 
            formatter={(value) => formatNumber(value)}
            style={{ fontSize: '10px', fill: '#4a5568' }}
        />
    </Bar>
</BarChart>

                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            
            {/* Bảng chi tiết Top 10 Truyện */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                 <h2 className="text-xl font-bold mb-4 text-gray-800">Bảng xếp hạng chi tiết (Top 10)</h2>
                 {loadingNovelStats ? <div className="text-center py-4 text-gray-500">Đang tải...</div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên truyện</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt xem</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tương tác</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(novelStats || []).map((novel, index) => (
                                    <tr key={novel.idNovel} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{novel.nameNovel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{novel.nameAuthors?.join(', ') || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{novel.totalView?.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{novel.totalInteract?.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1">
                                            <Star size={14} className="text-yellow-400 fill-current" /> 
                                            {novel.avgRating?.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AnalyticsReport;