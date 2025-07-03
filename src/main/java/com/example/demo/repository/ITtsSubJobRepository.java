package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.TtsJob;
import com.example.demo.entity.TtsSubJob;

public interface ITtsSubJobRepository extends JpaRepository<TtsSubJob, Long> {
    List<TtsSubJob> findByParentJob(TtsJob parentJob);
    boolean existsByParentJobIdAndStatus(String parentJobId, String status);

}