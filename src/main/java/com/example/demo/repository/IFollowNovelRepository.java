package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.FollowNovel;
import com.example.demo.entity.FollowNovelId;

public interface IFollowNovelRepository extends JpaRepository<FollowNovel, FollowNovelId>{
	List<FollowNovel> findByNovel_IdNovel(String idNovel);
	List<FollowNovel> findByUserIdUser(String idUser);
}
