// src/components/CanvasTextRenderer.jsx
import React, { useRef, useEffect, useCallback } from 'react';

const CanvasTextRenderer = ({
  text,
  fontSize = 20,
  fontFamily = 'Tahoma',
  lineHeightFactor = 1.8, // Đây là lineHeight factor (ví dụ: 1.8 không phải pixel)
  theme = 'xam-nhat',
  containerWidth, // Bắt buộc truyền vào từ component cha
}) => {
  const canvasRef = useRef(null);

  const getColors = () => {
    let textColor, canvasBackgroundColor;
    if (theme === 'den') {
      textColor = '#e5e7eb'; // Tailwind gray-200
      canvasBackgroundColor = '#111827'; // Tailwind gray-900
    } else if (theme === 'trang') {
      textColor = '#1f2937'; // Tailwind gray-800
      canvasBackgroundColor = '#ffffff'; // white
    } else { // xam-nhat (default) hoặc các theme khác
      textColor = '#374151'; // Tailwind gray-700
      canvasBackgroundColor = '#f3f4f6'; // Tailwind gray-100
    }
    return { textColor, canvasBackgroundColor };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text || !containerWidth || containerWidth <= 0) {
        if(canvas && !text) { // Nếu có canvas nhưng không có text, xóa canvas
            const ctx = canvas.getContext('2d');
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.height = 0; // Reset height
        }
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentFontSize = parseInt(fontSize, 10);
    const fontStyle = `${currentFontSize}px ${fontFamily}`;
    const { textColor, canvasBackgroundColor } = getColors();
    const actualLineHeight = currentFontSize * lineHeightFactor;
    const canvasPadding = 5; // Padding nhỏ bên trong canvas để text không bị sát mép

    // Đặt chiều rộng canvas dựa trên containerWidth được truyền vào
    // Chiều rộng vẽ text sẽ là containerWidth trừ đi padding của canvas
    const drawingWidth = containerWidth - (canvasPadding * 2);
    canvas.width = containerWidth; // Canvas vật lý chiếm full width

    // Xử lý ngắt dòng cho text
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    ctx.font = fontStyle; // Cần đặt font trước khi đo text

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + word + (i === words.length - 1 ? '' : ' '); // Không thêm space cho từ cuối cùng của dòng
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > drawingWidth && i > 0 && currentLine !== '') { // i > 0 để từ đầu tiên không bị ngắt ngay
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim()); // Thêm dòng cuối cùng

    // Tính toán chiều cao canvas cần thiết
    // Thêm một chút không gian ở dưới cùng (ví dụ: nửa line height)
    const calculatedCanvasHeight = (lines.length * actualLineHeight) + (canvasPadding * 2) + (actualLineHeight / 2);
    canvas.height = calculatedCanvasHeight;

    // Vẽ lại nền canvas
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ lại text
    ctx.fillStyle = textColor;
    ctx.font = fontStyle; // Đặt lại font vì thay đổi kích thước canvas có thể reset context
    ctx.textBaseline = 'top'; // Quan trọng: căn chỉnh text từ đỉnh

    lines.forEach((line, index) => {
      // Vẽ text với padding
      ctx.fillText(line, canvasPadding, canvasPadding + (index * actualLineHeight));
    });

  }, [text, fontSize, fontFamily, lineHeightFactor, theme, containerWidth]);

  useEffect(() => {
    // Vẽ khi component mount hoặc khi các dependencies của draw thay đổi
    draw();
  }, [draw]); // draw là một hàm đã được useCallback

  // Canvas sẽ tự động co giãn theo chiều rộng của thẻ cha nếu được style đúng
  // và chiều cao sẽ được tính toán động.
  return (
    <canvas
        ref={canvasRef}
        className="chapter-canvas-segment" // Thêm class để có thể style nếu cần
        style={{ display: 'block', width: '100%' }} // Hiển thị như block và chiếm full width
    />
  );
};

export default CanvasTextRenderer;