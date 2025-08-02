import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { reportSupport } from '../../redux/userSlice';
import { 
  MessageCircle, 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  Send,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  Zap,
  Heart,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SupportPage = () => {
  const dispatch = useDispatch();
  const { currentUser, loading, error } = useSelector((state) => state.user);
  
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: currentUser?.emailUser || '',
    category: 'general',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Cập nhật email khi user thay đổi
  useEffect(() => {
    if (currentUser?.emailUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.emailUser
      }));
    }
  }, [currentUser]);

  const categories = [
    { id: 'general', name: 'Câu hỏi chung', icon: HelpCircle, color: 'blue' },
    { id: 'account', name: 'Tài khoản', icon: Users, color: 'green' },
    { id: 'payment', name: 'Thanh toán', icon: Zap, color: 'yellow' },
    { id: 'technical', name: 'Kỹ thuật', icon: AlertCircle, color: 'red' }
  ];

  const faqs = [
    {
      question: 'Làm thế nào để nạp tiền vào tài khoản?',
      answer: 'Bạn có thể nạp tiền qua các phương thức: chuyển khoản ngân hàng, ví điện tử MoMo, ZaloPay hoặc thẻ cào điện thoại.',
      category: 'payment'
    },
    {
      question: 'Tại sao tôi không thể đọc được chương mới?',
      answer: 'Có thể do chương đó yêu cầu mua hoặc tài khoản của bạn chưa đủ điều kiện. Vui lòng kiểm tra số dư và quyền truy cập.',
      category: 'technical'
    },
    {
      question: 'Làm thế nào để thay đổi thông tin cá nhân?',
      answer: 'Vào Cài đặt cá nhân > Thông tin tài khoản để cập nhật thông tin của bạn.',
      category: 'account'
    },
    {
      question: 'Tôi quên mật khẩu, phải làm sao?',
      answer: 'Nhấn "Quên mật khẩu" ở trang đăng nhập và làm theo hướng dẫn gửi về email của bạn.',
      category: 'account'
    }
  ];

  const stats = [
    { number: '24/7', label: 'Hỗ trợ', icon: Clock },
    { number: '99.9%', label: 'Độ hài lòng', icon: Star },
    { number: '<2h', label: 'Thời gian phản hồi', icon: MessageCircle },
    { number: '50K+', label: 'Người dùng hỗ trợ', icon: Users }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.subject || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      // Tạo nội dung báo cáo bao gồm email trong content
      const reportContent = `
EMAIL LIÊN HỆ: ${formData.email}
HỌ TÊN: ${formData.name}
DANH MỤC: ${categories.find(cat => cat.id === formData.category)?.name || formData.category}
TIÊU ĐỀ: ${formData.subject}

NỘI DUNG:
${formData.message}
      `.trim();

      // Map category to statusReport enum values
      const categoryToStatusMap = {
        'technical': 'BUG',        // Lỗi kỹ thuật -> BUG
        'general': 'CONTRIBUTE',   // Câu hỏi chung -> CONTRIBUTE  
        'account': 'REPORT',       // Tài khoản -> REPORT
        'payment': 'REPORT'        // Thanh toán -> REPORT
      };

      const statusReport = categoryToStatusMap[formData.category] || 'REPORT';

      // Gửi báo cáo qua API - theo đúng schema API (content + statusReport)
      await dispatch(reportSupport({
        content: reportContent,
        statusReport: statusReport
      })).unwrap();

      // Hiển thị thành công
      setIsSubmitted(true);
      toast.success('Gửi yêu cầu hỗ trợ thành công!');
      
      // Reset form sau 3 giây
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: currentUser?.emailUser || '',
          category: 'general',
          subject: '',
          message: ''
        });
        setSelectedCategory('general');
      }, 3000);

    } catch (error) {
      console.error('Error sending support request:', error);
      toast.error(error || 'Có lỗi xảy ra khi gửi yêu cầu hỗ trợ!');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const heroVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * 400,
                scale: 0
              }}
              animate={{
                y: -100,
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <motion.div variants={heroVariants}>
            <div className="flex justify-center mb-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Heart className="w-16 h-16 text-pink-300" />
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-3 h-3 text-yellow-800" />
                </motion.div>
              </motion.div>
            </div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6"
              variants={itemVariants}
            >
              Chúng tôi ở đây để{' '}
              <motion.span
                className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                hỗ trợ bạn
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-blue-100"
              variants={itemVariants}
            >
              Đội ngũ chăm sóc khách hàng 24/7 sẵn sàng giải đáp mọi thắc mắc
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              variants={itemVariants}
            >
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                Gửi yêu cầu hỗ trợ
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300">
                Xem FAQ
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-8 h-8" />
                </motion.div>
                <motion.div
                  className="text-3xl font-bold text-gray-800 mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Support Form & FAQ Section */}
      <motion.section 
        className="py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Support Form */}
            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mb-4"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <MessageCircle className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Gửi yêu cầu hỗ trợ</h3>
                  <p className="text-gray-600">Chúng tôi sẽ phản hồi trong vòng 2 giờ</p>
                </div>

                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Category Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Danh mục</label>
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map((category) => (
                            <motion.button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setFormData({ ...formData, category: category.id });
                              }}
                              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                                selectedCategory === category.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <category.icon className="w-5 h-5 mx-auto mb-1" />
                              <div className="text-sm font-medium">{category.name}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Error Display */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-red-700 text-sm">{error}</span>
                        </motion.div>
                      )}

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                          required
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${
                          loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg'
                        } text-white`}
                        whileHover={loading ? {} : { scale: 1.02 }}
                        whileTap={loading ? {} : { scale: 0.98 }}
                      >
                        {loading ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <span>Đang gửi...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>Gửi yêu cầu</span>
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-500 rounded-full mb-4"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle className="w-10 h-10" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Gửi thành công!</h3>
                      <p className="text-gray-600">Chúng tôi sẽ phản hồi bạn sớm nhất có thể.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full mb-4"
                    whileHover={{ scale: 1.1, rotate: -10 }}
                  >
                    <HelpCircle className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Câu hỏi thường gặp</h3>
                  <p className="text-gray-600">Tìm câu trả lời nhanh chóng</p>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.button
                        className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-300 flex justify-between items-center"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        whileHover={{ scale: 1.01 }}
                      >
                        <span className="font-medium text-gray-800">{faq.question}</span>
                        <motion.div
                          animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 py-4 text-gray-600 bg-white">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact Info */}
      <motion.section 
        className="py-16 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-4xl font-bold text-gray-800 mb-12"
            variants={itemVariants}
          >
            Liên hệ trực tiếp
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Mail, title: 'Email', info: 'phanthanhvu8548@gmail.com', color: 'blue' },
              { icon: Phone, title: 'Hotline', info: '1900 123 456', color: 'green' },
              { icon: Clock, title: 'Giờ làm việc', info: '24/7 - Mọi lúc', color: 'purple' }
            ].map((contact, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-${contact.color}-500 to-${contact.color}-600 text-white rounded-full mb-4`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <contact.icon className="w-8 h-8" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{contact.title}</h3>
                <p className="text-gray-600">{contact.info}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default SupportPage;
