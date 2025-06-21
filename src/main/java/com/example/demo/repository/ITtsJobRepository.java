package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.TtsJob;

public interface ITtsJobRepository extends JpaRepository<TtsJob, String>{

}
