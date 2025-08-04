import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X, 
  Check, 
  Settings,
  Filter,
  Trash2,
  Eye,
  Calendar,
  User,
  Mail,
  FileText,
  RefreshCw
} from 'lucide-react';
import { getAllReport, updateReport, deleteReport } from '@/redux/userSlice';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

const ReportManagement = () => {
  const dispatch = useDispatch();
  const { allReports, reportsLoading, reportUpdateLoading, reportDeleteLoading } = useSelector((state) => state.user);

  // Filter states
  const [statusReportFilter, setStatusReportFilter] = useState('ALL');
  const [statusProcessingFilter, setStatusProcessingFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Dialog states
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState({
    content: '',
    statusReport: '',
    statusProcessingStatus: ''
  });

  // Load reports when component mounts
  useEffect(() => {
    dispatch(getAllReport());
  }, [dispatch]);

  // Status configurations
  const statusReportConfig = {
    'BUG': { label: '🐛 Lỗi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    'REPORT': { label: '📋 Báo cáo', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    'CONTRIBUTE': { label: '🤝 Đóng góp', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
  };

  const statusProcessingConfig = {
    'NEW': { label: '🆕 Mới', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: AlertCircle },
    'WORKING': { label: '⚙️ Đang xử lý', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: Settings },
    'DONE': { label: '✅ Hoàn thành', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
    'IGNORE': { label: '❌ Bỏ qua', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', icon: X }
  };

  // Filter reports
  const filteredReports = allReports?.filter(report => {
    // Lọc theo statusReport
    if (statusReportFilter !== 'ALL' && report.statusReport !== statusReportFilter) {
      return false;
    }
    
    // Lọc theo statusProcessingStatus
    if (statusProcessingFilter !== 'ALL' && report.statusProcessingStatus !== statusProcessingFilter) {
      return false;
    }

    // Lọc theo search term
    if (searchTerm && !report.content?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !report.reporterEmail?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Lọc theo ngày - chỉ hiển thị báo cáo trong khoảng thời gian được chọn
    if (startDate || endDate) {
      // Thử các field name có thể có
      const reportDateValue = report.createdAt || report.createAt || report.createTime || report.createdTime;
      
      // Nếu không có date field nào hoặc date không hợp lệ, bỏ qua báo cáo này
      if (!reportDateValue) {
        return false;
      }
      
      let reportDate;
      try {
        // Xử lý date format từ Java (array) hoặc string
        if (Array.isArray(reportDateValue) && reportDateValue.length >= 3) {
          reportDate = new Date(
            reportDateValue[0], 
            reportDateValue[1] - 1, 
            reportDateValue[2], 
            reportDateValue[3] || 0, 
            reportDateValue[4] || 0, 
            reportDateValue[5] || 0
          );
          reportDate.setHours(reportDate.getHours() + 7); // UTC+7
        } else {
          reportDate = new Date(reportDateValue);
        }
        
        // Kiểm tra date hợp lệ
        if (isNaN(reportDate.getTime())) {
          return false;
        }
      } catch (error) {
        return false;
      }
      
      // Chỉ lấy phần ngày (bỏ qua giờ) để so sánh
      const reportDateOnly = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
      
      if (startDate) {
        const start = new Date(startDate);
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        if (reportDateOnly < startDateOnly) {
          return false;
        }
      }
      
      if (endDate) {
        const end = new Date(endDate);
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        if (reportDateOnly > endDateOnly) {
          return false;
        }
      }
    }

    // Không hiển thị báo cáo đã xóa
    if (report.deleteAt) {
      return false;
    }

    return true;
  }) || [];

  // Quick status update functions
  const handleQuickStatusUpdate = async (report, newStatus) => {
    try {
      await dispatch(updateReport({
        id: report.id,
        content: report.content,
        statusReport: report.statusReport,
        statusProcessingStatus: newStatus
      })).unwrap();
      
      toast.success(`Đã cập nhật trạng thái báo cáo thành ${statusProcessingConfig[newStatus].label}`);
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + error);
    }
  };

  // Delete report function
  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      try {
        await dispatch(deleteReport(reportId)).unwrap();
        toast.success('Đã xóa báo cáo thành công');
      } catch (error) {
        toast.error('Lỗi khi xóa báo cáo: ' + error);
      }
    }
  };

  // View detail function
  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setIsDetailDialogOpen(true);
  };

  // Edit report function
  const handleEditReport = (report) => {
    setSelectedReport(report);
    setEditForm({
      content: report.content || '',
      statusReport: report.statusReport || '',
      statusProcessingStatus: report.statusProcessingStatus || ''
    });
    setIsEditDialogOpen(true);
  };

  // Submit edit form
  const handleSubmitEdit = async () => {
    try {
      await dispatch(updateReport({
        id: selectedReport.id,
        content: editForm.content,
        statusReport: editForm.statusReport,
        statusProcessingStatus: editForm.statusProcessingStatus
      })).unwrap();
      
      toast.success('Đã cập nhật báo cáo thành công');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Lỗi khi cập nhật báo cáo: ' + error);
    }
  };

  // Format date - Handle array format from Java LocalDateTime
  const formatDate = (dateInput) => {
    if (!dateInput) return 'Không có dữ liệu';
    
    try {
      let date;
      // If it's an array [year, month, day, hour, minute, second, nanosecond]
      if (Array.isArray(dateInput) && dateInput.length >= 3) {
        // LocalDateTime từ Java: [year, month, day, hour, minute, second, nanosecond]
        // Month trong JavaScript Date bắt đầu từ 0, nên trừ 1
        date = new Date(
          dateInput[0], 
          dateInput[1] - 1, 
          dateInput[2], 
          dateInput[3] || 0, 
          dateInput[4] || 0, 
          dateInput[5] || 0
        );
        // Cộng thêm 7 giờ để chuyển từ UTC sang UTC+7 (múi giờ Việt Nam)
        date.setHours(date.getHours() + 7);
      } else {
        // Fallback for string format
        date = new Date(dateInput);
      }
      
      // Kiểm tra date hợp lệ
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return 'Lỗi định dạng ngày';
    }
  };

  // Get status counts for dashboard
  const getStatusCounts = () => {
    return {
      total: filteredReports.length,
      new: filteredReports.filter(r => r.statusProcessingStatus === 'NEW').length,
      working: filteredReports.filter(r => r.statusProcessingStatus === 'WORKING').length,
      done: filteredReports.filter(r => r.statusProcessingStatus === 'DONE').length,
      ignore: filteredReports.filter(r => r.statusProcessingStatus === 'IGNORE').length
    };
  };

  const statusCounts = getStatusCounts();

  // Pagination logic
  const totalItems = filteredReports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageReports = filteredReports.slice(startIndex, endIndex);

  // Reset current page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusReportFilter, statusProcessingFilter, searchTerm, startDate, endDate]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📋 Quản lý báo cáo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Xử lý và quản lý các báo cáo từ người dùng
          </p>
        </div>
        <Button
          onClick={() => dispatch(getAllReport())}
          disabled={reportsLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${reportsLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng cộng</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mới</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.new}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang xử lý</p>
              <p className="text-2xl font-bold text-orange-600">{statusCounts.working}</p>
            </div>
            <Settings className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.done}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bỏ qua</p>
              <p className="text-2xl font-bold text-gray-600">{statusCounts.ignore}</p>
            </div>
            <X className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Bộ lọc:</span>
          </div>

          <Select value={statusReportFilter} onValueChange={setStatusReportFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Loại báo cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="BUG">🐛 Lỗi</SelectItem>
              <SelectItem value="REPORT">📋 Báo cáo</SelectItem>
              <SelectItem value="CONTRIBUTE">🤝 Đóng góp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusProcessingFilter} onValueChange={setStatusProcessingFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái xử lý" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="NEW">🆕 Mới</SelectItem>
              <SelectItem value="WORKING">⚙️ Đang xử lý</SelectItem>
              <SelectItem value="DONE">✅ Hoàn thành</SelectItem>
              <SelectItem value="IGNORE">❌ Bỏ qua</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="🔍 Tìm kiếm theo nội dung hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Từ ngày:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
              title="Chọn ngày bắt đầu để lọc báo cáo"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Đến ngày:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
              title="Chọn ngày kết thúc để lọc báo cáo"
            />
          </div>

          {/* Clear all filters button */}
          {(statusReportFilter !== 'ALL' || statusProcessingFilter !== 'ALL' || searchTerm || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusReportFilter('ALL');
                setStatusProcessingFilter('ALL');
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
              }}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              Xóa tất cả bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {/* List Header with pagination info */}
        {!reportsLoading && filteredReports.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                📊 Tìm thấy <span className="font-semibold text-blue-600">{totalItems}</span> báo cáo
                {totalPages > 1 && (
                  <span> • Trang {currentPage}/{totalPages}</span>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {itemsPerPage} báo cáo/trang
                </div>
              )}
            </div>
          </div>
        )}

        {reportsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Không có báo cáo nào</p>
          </div>
        ) : (
          <>
            {/* Reports List */}
            <AnimatePresence>
              {currentPageReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header with badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={statusReportConfig[report.statusReport]?.color}>
                        {statusReportConfig[report.statusReport]?.label}
                      </Badge>
                      <Badge className={statusProcessingConfig[report.statusProcessingStatus]?.color}>
                        {statusProcessingConfig[report.statusProcessingStatus]?.label}
                      </Badge>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.createdAt || report.createAt || report.createTime || report.createdTime)}
                      </div>
                    </div>

                    {/* Reporter info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{report.reporterEmail}</span>
                    </div>

                    {/* Content preview */}
                    <div className="text-gray-800 dark:text-gray-200">
                      <p className="line-clamp-2">
                        {report.content || 'Không có nội dung'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Quick status buttons */}
                    {report.statusProcessingStatus === 'NEW' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStatusUpdate(report, 'WORKING')}
                          disabled={reportUpdateLoading}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStatusUpdate(report, 'DONE')}
                          disabled={reportUpdateLoading}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStatusUpdate(report, 'IGNORE')}
                          disabled={reportUpdateLoading}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* View detail */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetail(report)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditReport(report)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={reportDeleteLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} trong số {totalItems} báo cáo
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2"
                  >
                    ← Trước
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrentPage = page === currentPage;
                      
                      // Show only 5 pages around current page
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[40px] ${isCurrentPage ? 'bg-blue-600 text-white' : ''}`}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2"
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo #{selectedReport?.id}</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết về báo cáo này
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại báo cáo</label>
                  <Badge className={`mt-1 ${statusReportConfig[selectedReport.statusReport]?.color}`}>
                    {statusReportConfig[selectedReport.statusReport]?.label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái xử lý</label>
                  <Badge className={`mt-1 ${statusProcessingConfig[selectedReport.statusProcessingStatus]?.color}`}>
                    {statusProcessingConfig[selectedReport.statusProcessingStatus]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email người gửi</label>
                <p className="mt-1 text-gray-800 dark:text-gray-200">{selectedReport.reporterEmail}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {selectedReport.content || 'Không có nội dung'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <label className="font-medium">Ngày tạo:</label>
                  <p>{formatDate(selectedReport.createdAt || selectedReport.createAt || selectedReport.createTime || selectedReport.createdTime)}</p>
                </div>
                <div>
                  <label className="font-medium">Ngày cập nhật:</label>
                  <p>{formatDate(selectedReport.updateAt || selectedReport.updatedAt || selectedReport.updateTime || selectedReport.updatedTime)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa báo cáo #{selectedReport?.id}</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin báo cáo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại báo cáo</label>
                <Select value={editForm.statusReport} onValueChange={(value) => setEditForm({...editForm, statusReport: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUG">🐛 Lỗi</SelectItem>
                    <SelectItem value="REPORT">📋 Báo cáo</SelectItem>
                    <SelectItem value="CONTRIBUTE">🤝 Đóng góp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái xử lý</label>
                <Select value={editForm.statusProcessingStatus} onValueChange={(value) => setEditForm({...editForm, statusProcessingStatus: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">🆕 Mới</SelectItem>
                    <SelectItem value="WORKING">⚙️ Đang xử lý</SelectItem>
                    <SelectItem value="DONE">✅ Hoàn thành</SelectItem>
                    <SelectItem value="IGNORE">❌ Bỏ qua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung</label>
              <Textarea
                className="mt-1"
                rows={6}
                value={editForm.content}
                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                placeholder="Nhập nội dung báo cáo..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmitEdit} disabled={reportUpdateLoading}>
                {reportUpdateLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportManagement;
