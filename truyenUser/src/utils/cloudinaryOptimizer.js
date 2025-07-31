/**
 * Tối ưu hóa URL Cloudinary bằng cách thêm f_auto,q_auto
 * để fix lỗi tua audio/video và cải thiện performance
 */
export const optimizeCloudinaryUrl = (url, type = 'auto') => {
  if (!url || typeof url !== 'string') return url;
  
  // Kiểm tra nếu là URL Cloudinary
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  
  // Kiểm tra xem đã có f_auto,q_auto chưa
  if (url.includes('f_auto') && url.includes('q_auto')) {
    return url;
  }
  
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;
    
    const beforeUpload = url.substring(0, uploadIndex + 8); // Include '/upload/'
    const afterUpload = url.substring(uploadIndex + 8);
    
    let optimizationParams = 'f_auto,q_auto';
    
    // Thêm tối ưu hóa đặc biệt cho audio
    if (type === 'audio') {
      optimizationParams = 'f_auto,q_auto'; // Giữ đơn giản cho audio
    }
    
    // Kiểm tra xem có version number (vXXXXXXXXXX) hay không
    const versionMatch = afterUpload.match(/^v\d+\//);
    if (versionMatch) {
      // Nếu có version number, chèn transformations trước version
      return `${beforeUpload}${optimizationParams}/${afterUpload}`;
    }
    
    // Kiểm tra transformations hiện có (không phải version number)
    const hasExistingTransforms = afterUpload.match(/^[a-z_,]+\//);
    
    if (hasExistingTransforms) {
      // Nếu đã có transforms, thêm vào đầu
      return `${beforeUpload}${optimizationParams},${afterUpload}`;
    } else {
      // Nếu chưa có transforms, thêm transforms với dấu /
      return `${beforeUpload}${optimizationParams}/${afterUpload}`;
    }
  } catch (error) {
    console.warn('⚠️ Error optimizing Cloudinary URL:', error);
    return url;
  }
};

/**
 * Tối ưu hóa URL Cloudinary cho audio
 */
export const optimizeCloudinaryAudioUrl = (url) => {
  return optimizeCloudinaryUrl(url, 'audio');
};

/**
 * Tối ưu hóa URL Cloudinary cho hình ảnh
 */
export const optimizeCloudinaryImageUrl = (url) => {
  return optimizeCloudinaryUrl(url, 'image');
};
