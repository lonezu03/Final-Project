package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Chapter;
import com.example.demo.entity.Novel;

import java.util.List;
import java.util.Optional;


@Repository
public interface IChapterRepository extends JpaRepository<Chapter, String>{
	Chapter findByTitleChapter(String titleChapter);
	boolean existsByTitleChapter(String titleChapter);
	
	List<Chapter> findByNovel_IdNovel(String idNovel);
	
	/**
     * Tìm chương cuối cùng (có chapterNumber lớn nhất) của một truyện.
     * 'Top' hoặc 'First' kết hợp với 'OrderBy...Desc' là một pattern rất hiệu quả
     * để lấy dòng có giá trị lớn nhất mà không cần tải toàn bộ danh sách.
     */
    Optional<Chapter> findTopByNovelOrderByIndexChapterDesc(Novel novel);

}
