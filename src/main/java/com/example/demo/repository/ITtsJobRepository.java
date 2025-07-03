package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.TtsJob;

public interface ITtsJobRepository extends JpaRepository<TtsJob, String>{
    Optional<TtsJob> findByIdChapter(String idChapter);

}
