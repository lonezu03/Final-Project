package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Comment;
import java.util.List;


@Repository
public interface ICommentRepository extends JpaRepository<Comment, Integer>,JpaSpecificationExecutor<Comment>{
	List<Comment> findByChapter_IdChapter(String idChapter); 
	
	List<Comment> findByUser_IdUser(String user);
	
	@Query("SELECT c FROM Comment c WHERE c.chapter.novel.idNovel = :idNovel")
	List<Comment> findAllByNovelId(@Param("idNovel") String idNovel);

}
