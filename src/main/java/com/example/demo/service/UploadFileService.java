package com.example.demo.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.demo.dto.respone.UploadFileRespone;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý việc upload và xoá file (ảnh, âm thanh) thông qua Cloudinary.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UploadFileService {

    Cloudinary cloudinary;

    /**
     * Upload file hình ảnh (hoặc tương đương) lên Cloudinary.
     *
     * @param file MultipartFile cần upload
     * @return UploadFileRespone chứa public_id và URL của file đã upload
     * @throws IOException nếu có lỗi khi đọc file hoặc upload
     */
    public UploadFileRespone uploadFile(MultipartFile file) throws IOException {
        assert file.getOriginalFilename() != null;

        String publicValue = generatePublicValue(file.getOriginalFilename());

        String[] parts = getFileName(file.getOriginalFilename());

        String extension = parts[parts.length - 1];

        File fileUpload = convert(file);

        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                fileUpload,
                ObjectUtils.asMap("public_id", publicValue)
        );

        String public_ID = (String) uploadResult.get("public_id");
        String url = cloudinary.url().generate(StringUtils.join(publicValue, ".", extension));

        cleanDisk(fileUpload);

        return UploadFileRespone.builder().public_id(public_ID).url(url).build();
    }

    /**
     * Upload file âm thanh (ví dụ .mp3) lên Cloudinary.
     *
     * @param audioData byte[] chứa nội dung file âm thanh
     * @param publicId public_id mong muốn của file trên Cloudinary
     * @return URL an toàn (https) để truy cập file đã upload
     * @throws IOException nếu có lỗi khi upload
     */
    public String uploadAudio(byte[] audioData, String publicId) throws IOException {
        // resource_type = "video" is used for both audio and video files.
        Map uploadResult = cloudinary.uploader().upload(
                audioData,
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "video" // DÙNG "video" CHO FILE MP3
                )
        );

        // Lấy ra URL an toàn (https)
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Upload một hình ảnh từ chuỗi Base64 (đã có tiền tố "data:image/png;base64,") lên Cloudinary.
     *
     * @param base64String Chuỗi base64 đầy đủ của hình ảnh.
     * @return UploadFileRespone chứa public_id và URL của ảnh.
     * @throws IOException nếu có lỗi trong quá trình giải mã hoặc upload.
     */
    public UploadFileRespone uploadBase64Image(String base64String) throws IOException {
        log.info("Bắt đầu quá trình upload ảnh từ chuỗi Base64.");

        // 1. Kiểm tra và tách chuỗi Base64 thô
        if (base64String == null || !base64String.startsWith("data:image/")) {
            throw new IllegalArgumentException("Chuỗi Base64 không hợp lệ hoặc không phải là định dạng ảnh.");
        }
        // Tách phần tiền tố (ví dụ: "data:image/png;base64,") để lấy dữ liệu thô
        String[] parts = base64String.split(",");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Định dạng chuỗi Base64 không đúng.");
        }
        String rawBase64 = parts[1];

        // 2. Giải mã Base64 thành byte array
        byte[] imageBytes = Base64.getDecoder().decode(rawBase64);
        log.debug("Giải mã thành công Base64 thành byte array, kích thước: {} bytes.", imageBytes.length);

        // 3. Tạo một public_id duy nhất
        // Chúng ta không có tên file gốc, nên tạo một tên chung chung
        String publicValue = generatePublicValue("gemini-generated-image.png");

        // 4. Upload byte array lên Cloudinary
        // Đối với ảnh, resource_type mặc định là "image", nên không cần chỉ định rõ
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                imageBytes,
                ObjectUtils.asMap("public_id", publicValue)
        );

        String public_ID = (String) uploadResult.get("public_id");
        String url = (String) uploadResult.get("secure_url"); // Lấy secure_url để luôn là https

        log.info("Upload ảnh lên Cloudinary thành công. Public ID: '{}', URL: '{}'", public_ID, url);

        return UploadFileRespone.builder()
                .public_id(public_ID)
                .url(url)
                .build();
    }
    
    /**
     * Xóa ảnh đã upload theo public_id.
     *
     * @param publicID public_id của file cần xóa
     * @return "ok" nếu thành công
     * @throws AppException nếu có lỗi khi gọi Cloudinary
     */
    public String deleteImage(String publicID) {
        try {
            cloudinary.uploader().destroy(publicID, null);
            return "ok";
        } catch (IOException e) {
            throw new AppException(ErrorCode.ERROR_PUBLICID);
        }
    }

    /**
     * Chuyển MultipartFile thành file tạm trên ổ đĩa để upload lên Cloudinary.
     *
     * @param file MultipartFile
     * @return File đã ghi ra đĩa
     * @throws IOException nếu lỗi khi đọc/ghi
     */
    private File convert(MultipartFile file) throws IOException {
        assert file.getOriginalFilename() != null;
        String[] parts = getFileName(file.getOriginalFilename());

        File convFile = new File(StringUtils.join(generatePublicValue(file.getOriginalFilename()), parts[parts.length - 1]));
        try (InputStream is = file.getInputStream()) {
            Files.copy(is, convFile.toPath());
        }
        return convFile;
    }

    /**
     * Xóa file tạm trên ổ đĩa sau khi đã upload xong.
     *
     * @param file File cần xóa
     */
    private void cleanDisk(File file) {
        try {
            Path filePath = file.toPath();
            Files.delete(filePath);
        } catch (IOException e) {
            log.error("Error when clean disk ");
        }
    }

    /**
     * Tạo chuỗi public_id duy nhất cho file dựa vào tên gốc.
     *
     * @param originalName tên file ban đầu
     * @return public_id đã chuẩn hóa
     */
    public String generatePublicValue(String originalName) {
        String[] parts = getFileName(originalName);
        String fileName = parts[0];
        fileName = fileName.replaceAll("\\s", "_");
        return StringUtils.join(UUID.randomUUID().toString(), "_", fileName);
    }

    /**
     * Tách tên file thành mảng phần tử dựa theo dấu chấm.
     *
     * @param originalName tên gốc của file
     * @return mảng gồm tên file và phần mở rộng
     */
    public String[] getFileName(String originalName) {
        return originalName.split("\\.");
    }
}
