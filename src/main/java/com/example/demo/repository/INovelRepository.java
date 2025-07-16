package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Novel;

@Repository
public interface INovelRepository extends JpaRepository<Novel, String>,JpaSpecificationExecutor<Novel>{
	
	default List<Novel> findAllWithoutDeleted() {
        return findAll((root, query, cb) -> cb.isNull(root.get("delete_at")));
    }
}
