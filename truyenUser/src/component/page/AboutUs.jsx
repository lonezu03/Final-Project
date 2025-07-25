import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Award, 
  Globe, 
  Heart,
  Star,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Play,
  Quote,
  Shield,
  Rocket,
  Lightbulb,
  Gift
} from 'lucide-react';

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState('mission');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true });

  const stats = [
    { number: 1000000, suffix: '+', label: 'Người đọc', icon: Users, color: 'blue' },
    { number: 50000, suffix: '+', label: 'Truyện', icon: BookOpen, color: 'green' },
    { number: 99, suffix: '%', label: 'Hài lòng', icon: Heart, color: 'red' },
    { number: 24, suffix: '/7', label: 'Hỗ trợ', icon: Shield, color: 'purple' }
  ];

  const team = [
    {
      name: 'Nguyễn Văn An',
      role: 'CEO & Founder',
      avatar: '/api/placeholder/150/150',
      quote: 'Tạo ra nền tảng đọc truyện tốt nhất Việt Nam',
      social: ['linkedin', 'twitter']
    },
    {
      name: 'Trần Thị Bình',
      role: 'CTO',
      avatar: '/api/placeholder/150/150',
      quote: 'Công nghệ phục vụ trải nghiệm người dùng',
      social: ['github', 'linkedin']
    },
    {
      name: 'Lê Văn Cường',
      role: 'Head of Content',
      avatar: '/api/placeholder/150/150',
      quote: 'Chất lượng nội dung là ưu tiên hàng đầu',
      social: ['twitter', 'instagram']
    },
    {
      name: 'Phạm Thị Dung',
      role: 'Head of Design',
      avatar: '/api/placeholder/150/150',
      quote: 'Thiết kế đẹp tạo nên trải nghiệm tuyệt vời',
      social: ['dribbble', 'behance']
    }
  ];

  const achievements = [
    {
      year: '2020',
      title: 'Thành lập công ty',
      description: 'Bắt đầu hành trình với đội ngũ 5 người',
      icon: Rocket,
      color: 'blue'
    },
    {
      year: '2021',
      title: 'Ra mắt nền tảng',
      description: '100,000 người dùng đầu tiên',
      icon: Star,
      color: 'yellow'
    },
    {
      year: '2022',
      title: 'Mở rộng quy mô',
      description: 'Đạt 500,000 người dùng hoạt động',
      icon: TrendingUp,
      color: 'green'
    },
    {
      year: '2023',
      title: 'Giải thưởng lớn',
      description: 'Top 10 ứng dụng của năm',
      icon: Award,
      color: 'purple'
    },
    {
      year: '2024',
      title: 'Triệu người dùng',
      description: 'Cột mốc 1 triệu người dùng',
      icon: Target,
      color: 'red'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Đam mê',
      description: 'Chúng tôi yêu những câu chuyện và tin rằng mỗi truyện đều có sức mạnh thay đổi cuộc sống.',
      color: 'red'
    },
    {
      icon: Users,
      title: 'Cộng đồng',
      description: 'Xây dựng cộng đồng đọc giả năng động, nơi mọi người chia sẻ niềm đam mê văn học.',
      color: 'blue'
    },
    {
      icon: Lightbulb,
      title: 'Sáng tạo',
      description: 'Luôn đổi mới và tìm kiếm những cách thức mới để mang đến trải nghiệm tốt nhất.',
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Tin cậy',
      description: 'Đảm bảo chất lượng nội dung và bảo vệ quyền lợi của cả tác giả lẫn độc giả.',
      color: 'green'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Minh Hoàng',
      role: 'Độc giả thân thiết',
      content: 'Ứng dụng tuyệt vời! Giao diện đẹp, kho truyện phong phú. Tôi đã đọc hơn 50 cuốn truyện ở đây.',
      rating: 5,
      avatar: '/api/placeholder/80/80'
    },
    {
      name: 'Trần Thị Lan',
      role: 'Tác giả',
      content: 'Nền tảng hỗ trợ tác giả rất tốt. Thu nhập ổn định và có cộng đồng độc giả nhiệt tình.',
      rating: 5,
      avatar: '/api/placeholder/80/80'
    },
    {
      name: 'Lê Văn Đức',
      role: 'Người dùng mới',
      content: 'Mới sử dụng 1 tháng nhưng đã rất ấn tượng. Gợi ý truyện chuẩn xác, đọc rất nghiện.',
      rating: 5,
      avatar: '/api/placeholder/80/80'
    }
  ];

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
      transition: { duration: 1, ease: "easeOut" }
    }
  };

  // Counter animation
  const Counter = ({ end, duration = 2 }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);
    const isInView = useInView(countRef, { once: true });

    useEffect(() => {
      if (isInView) {
        let startTime;
        const animate = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
    }, [isInView, end, duration]);

    return <span ref={countRef}>{count.toLocaleString()}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white py-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * 600,
                opacity: 0,
                scale: 0
              }}
              animate={{
                y: -100,
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            >
              {i % 3 === 0 ? (
                <BookOpen className="w-4 h-4 text-white" />
              ) : i % 3 === 1 ? (
                <Heart className="w-4 h-4 text-pink-300" />
              ) : (
                <Star className="w-4 h-4 text-yellow-300" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <motion.div variants={heroVariants}>
            <motion.div
              className="flex justify-center mb-8"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <motion.div
                  className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                  animate={{ 
                    rotate: 360,
                    boxShadow: [
                      "0 0 20px rgba(255,255,255,0.3)",
                      "0 0 40px rgba(255,255,255,0.5)",
                      "0 0 20px rgba(255,255,255,0.3)"
                    ]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    boxShadow: { duration: 2, repeat: Infinity }
                  }}
                >
                  <BookOpen className="w-12 h-12 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              variants={itemVariants}
            >
              Về chúng tôi
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto"
              variants={itemVariants}
            >
              Chúng tôi là đội ngũ đam mê văn học, tận tâm mang đến cho bạn{' '}
              <motion.span
                className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent font-bold"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                trải nghiệm đọc truyện tuyệt vời nhất
              </motion.span>
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4"
              variants={itemVariants}
            >
              <motion.button 
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Khám phá ngay
                <ArrowRight className="inline ml-2 w-5 h-5" />
              </motion.button>
              <motion.button 
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Xem video giới thiệu
                <Play className="inline ml-2 w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-20 bg-white"
        ref={statsRef}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-16"
            variants={itemVariants}
          >
            Những con số ấn tượng
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.1, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 text-white rounded-full mb-6 shadow-lg`}
                  whileHover={{ 
                    rotate: 360,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-10 h-10" />
                </motion.div>
                <motion.div
                  className="text-4xl md:text-5xl font-bold text-gray-800 mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                >
                  {isStatsInView && <Counter end={stat.number} />}
                  {stat.suffix}
                </motion.div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Mission, Vision, Values */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-blue-50 to-purple-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-16"
            variants={itemVariants}
          >
            Giá trị cốt lõi
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-${value.color}-500 to-${value.color}-600 text-white rounded-full mb-6`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <value.icon className="w-8 h-8" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Timeline */}
      <motion.section 
        className="py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-16"
            variants={itemVariants}
          >
            Hành trình phát triển
          </motion.h2>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            
            <div className="space-y-16">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                  variants={itemVariants}
                  whileInView={{ x: 0, opacity: 1 }}
                  initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <motion.div
                      className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center mb-4">
                        <motion.div
                          className={`w-12 h-12 bg-gradient-to-r from-${achievement.color}-500 to-${achievement.color}-600 text-white rounded-full flex items-center justify-center mr-4`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <achievement.icon className="w-6 h-6" />
                        </motion.div>
                        <span className="text-2xl font-bold text-blue-600">{achievement.year}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{achievement.title}</h3>
                      <p className="text-gray-600">{achievement.description}</p>
                    </motion.div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <motion.div
                    className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-4 border-blue-500 rounded-full shadow-lg"
                    whileHover={{ scale: 1.5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-purple-50 to-blue-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-16"
            variants={itemVariants}
          >
            Đội ngũ của chúng tôi
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="relative mb-6"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="w-4 h-4 text-yellow-800" />
                  </motion.div>
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                <motion.p 
                  className="text-gray-600 text-sm italic"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  "{member.quote}"
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-16"
            variants={itemVariants}
          >
            Người dùng nói gì về chúng tôi
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="text-6xl text-blue-200 mb-4"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Quote className="w-12 h-12" />
                </motion.div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex mt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + i * 0.1 }}
                    >
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div variants={itemVariants}>
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 360, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Gift className="w-10 h-10" />
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Hãy cùng chúng tôi viết nên câu chuyện của bạn
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Tham gia cộng đồng hơn 1 triệu người yêu văn học. Khám phá thế giới truyện tranh và tiểu thuyết vô tận.
            </p>
            
            <motion.button
              className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              Bắt đầu đọc ngay
              <Sparkles className="inline ml-2 w-6 h-6" />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutUs;
