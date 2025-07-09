package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.FollowNovel;
import com.example.demo.entity.FollowNovelId;
import com.example.demo.entity.Novel;
import com.example.demo.entity.User;

public interface IFollowNovelRepository extends JpaRepository<FollowNovel, FollowNovelId>{
	List<FollowNovel> findByNovel_IdNovel(String idNovel);
	List<FollowNovel> findByUserIdUser(String idUser);
    Optional<FollowNovel> findByUserAndNovel(User user, Novel novel);
    boolean existsByUserAndNovel(User user, Novel novel);

}
