package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.HistoryNotify;

public interface IHistoryNotifyRepository extends JpaRepository<HistoryNotify, String>{

	List<HistoryNotify> findByIsNotifyFalse();
}
