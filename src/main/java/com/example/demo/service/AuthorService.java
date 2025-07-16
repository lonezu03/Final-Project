package com.example.demo.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.AuthorCreationRequest;
import com.example.demo.dto.request.AuthorUpdateRequest;
import com.example.demo.dto.respone.AuthorRespone;
import com.example.demo.dto.respone.NovelRespone;
import com.example.demo.dto.respone.NovelResponeForAuthor;
import com.example.demo.dto.respone.UploadFileRespone;
import com.example.demo.entity.Author;
import com.example.demo.entity.Novel;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IAuthorMapper;
import com.example.demo.mapper.INovelMapper;
import com.example.demo.repository.IAuthorRepository;
import com.example.demo.repository.INovelRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthorService {
	INovelRepository novelRepository;
	IAuthorMapper authorMapper;
	IAuthorRepository authorRepository;
	UploadFileService uploadFileService;
	INovelMapper novelMapper;
/**
 * Lấy danh sách tất cả tác giả cùng với thông tin liên quan (nếu có).
 *
 * @return danh sách tác giả dưới dạng AuthorRespone
 * @throws AppException nếu có lỗi không xác định trong quá trình truy xuất
 */
	public List<AuthorRespone> getAll() {
		try {
			  List<Author> authors = authorRepository.findAllWithNovels();

			    return authors.stream()
			            .map(author -> {
			                // 1. Map các trường cơ bản của Author trước
			                AuthorRespone respone = authorMapper.toAuthorRespone(author);


			                return respone;
			            })
			            .collect(Collectors.toList());
		} catch (Exception e) {
			e.printStackTrace();
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	  
	}


/**
 * Lấy thông tin chi tiết của một tác giả theo ID.
 *
 * @param idAuthor ID của tác giả cần lấy
 * @return thông tin tác giả dưới dạng AuthorRespone
 * @throws AppException nếu tác giả không tồn tại
 */
	public AuthorRespone getAuthor(String idAuthor) {
		Author author = authorRepository.findById(idAuthor).get();
		Set<Novel> novels = author.getNovels();
		AuthorRespone authorRespone = authorMapper.toAuthorRespone(author);

		log.info(novels.isEmpty() + "haha");
//		Set<NovelResponeForAuthor> novelResponeForAuthors=novels.stream().map(t -> )
//		authorRespone.setNovels(novels);
		return authorRespone;
	}

/**
 * Tạo mới một tác giả, có thể kèm theo ảnh chân dung và danh sách truyện liên quan.
 *
 * @param request thông tin yêu cầu tạo tác giả
 * @param file file ảnh đại diện của tác giả (nếu có)
 * @return tác giả vừa được tạo dưới dạng AuthorRespone
 * @throws IOException nếu có lỗi khi upload file ảnh
 */
	public AuthorRespone createAuthor(AuthorCreationRequest request, MultipartFile file) throws IOException {
		Author author = authorMapper.toAuthor(request);

		if (request.getDobAuthor()!=null) {
			long year=ChronoUnit.YEARS.between(request.getDobAuthor(), LocalDate.now());

			
			if (request.getDobAuthor().isAfter(LocalDate.now()) || year<18) {
				log.info("old"+year);

				throw new AppException(ErrorCode.DOB_CANNOT_BE_NOW);
			}
		}
		
		

		
		if (file != null && !file.isEmpty()) {
			UploadFileRespone uploadFileRespone = uploadFileService.uploadFile(file);
			author.setImageAuthor(uploadFileRespone.getUrl());
			author.setPublicIDAuthor(uploadFileRespone.getPublic_id());
		}

		Set<Novel> novels = new HashSet<>(novelRepository.findAllById(request.getNovels()));
		author = authorRepository.save(author);

		for (Novel novel : novels) {
			novel.getAuthors().add(author);
			novelRepository.save(novel);
		}

		return authorMapper.toAuthorRespone(author);
	}
/**
 * Cập nhật thông tin của tác giả, bao gồm cập nhật ảnh đại diện (nếu có) 
 * và cập nhật các truyện liên quan.
 *
 * @param request thông tin yêu cầu cập nhật tác giả
 * @param file file ảnh mới của tác giả (nếu có)
 * @return tác giả sau khi được cập nhật dưới dạng AuthorRespone
 * @throws IOException nếu có lỗi khi xử lý file
 */
	public AuthorRespone updateAuthor(AuthorUpdateRequest request, MultipartFile file) throws IOException {

		Author author=authorRepository.findById(request.getIdAuthor()).orElseThrow(() -> new AppException(ErrorCode.AUTHOR_NOT_EXISTED));
		 
		if (request.getDobAuthor()!=null) {
			long year=ChronoUnit.YEARS.between(request.getDobAuthor(), LocalDate.now());

			
			if (request.getDobAuthor().isAfter(LocalDate.now()) || year<18) {
				log.info("old"+year);

				throw new AppException(ErrorCode.DOB_CANNOT_BE_NOW);
			}
		}
		
		authorMapper.updateAuthor(request,author);
		
		 
		 
		 
		if (file != null && !file.isEmpty()) {

			if (author.getPublicIDAuthor() != null && !author.getPublicIDAuthor().isEmpty()) {
				uploadFileService.deleteImage(author.getPublicIDAuthor());
			}

			UploadFileRespone uploadFileRespone = uploadFileService.uploadFile(file);

			author.setImageAuthor(uploadFileRespone.getUrl());
			author.setPublicIDAuthor(uploadFileRespone.getPublic_id());
		}
		author = authorRepository.save(author);

		if (request.getNovels()!=null && !request.getNovels().isEmpty()) {
			Set<Novel> novels = new HashSet<>(novelRepository.findAllById(request.getNovels()));
			for (Novel novel : novels) {
				novel.getAuthors().add(author);
				novelRepository.save(novel);
			}
		}

		return authorMapper.toAuthorRespone(author);
	}
/**
 * Xoá tác giả khỏi hệ thống theo ID. 
 * Trước khi xoá sẽ xoá liên kết giữa tác giả và các truyện, 
 * đồng thời xoá ảnh đại diện nếu có.
 *
 * @param idAuthor ID của tác giả cần xoá
 * @return ID của tác giả đã bị xoá
 * @throws AppException nếu tác giả không tồn tại hoặc có ràng buộc không thể xoá
 */
	@Transactional
	public String deleteById(String idAuthor) {
		try {
			Author author = authorRepository.findById(idAuthor)
	                .orElseThrow(() -> new AppException(ErrorCode.AUTHOR_NOT_EXISTED));

	        // Xóa liên kết giữa Author và Novel từ cả hai phía
	        for (Novel novel : new HashSet<>(author.getNovels())) {
	            novel.getAuthors().remove(author); // xóa Author khỏi Novel (bên sở hữu)
	        }
	        author.getNovels().clear(); // xóa Novel khỏi Author (bên bị phụ thuộc)

	        // Sau đó xóa ảnh nếu có
	        if (author.getPublicIDAuthor() != null && !author.getPublicIDAuthor().isEmpty()) {
	            uploadFileService.deleteImage(author.getPublicIDAuthor());
	        }

	        // Xóa Author
	        authorRepository.deleteById(idAuthor);

	        return idAuthor;
	    } catch (Exception e) {
	        e.printStackTrace();
	        throw new AppException(ErrorCode.DELETE_CONTRAINT);
	    }
	}
}
