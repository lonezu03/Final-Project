package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Novel;
import com.example.demo.entity.ReviewNovel;
import com.example.demo.entity.ReviewNovelId;
import com.example.demo.entity.User;
import com.example.demo.util.NovelRatingProjection;

import java.util.List;

@Repository
public interface IReviewNovelRepository extends JpaRepository<ReviewNovel, ReviewNovelId> {
	List<ReviewNovel> findByNovel(Novel novel);

	@Query("SELECT r.novel.id AS idNovel, AVG(r.rating) AS avgRating " + "FROM ReviewNovel r " + "GROUP BY r.novel.id")
	List<NovelRatingProjection> findAverageRatingForAllNovels();

	@Query("SELECT AVG(r.rating) FROM ReviewNovel r WHERE r.novel.id = :idNovel")
	Double findAverageRatingByNovelId(@Param("idNovel") String idNovel);

	@Query("SELECT r.novel.id AS idNovel, AVG(r.rating) AS avgRating " + "FROM ReviewNovel r "
			+ "WHERE r.novel.id IN :novelIds " + "GROUP BY r.novel.id")
	List<NovelRatingProjection> findAverageRatingByNovelIds(@Param("novelIds") List<String> novelIds);

	boolean existsByUserAndNovel(User user, Novel novel);

}
