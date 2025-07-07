package com.example.demo.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.User;

import java.util.List;


public interface IHistoryDepositRepository extends JpaRepository<HistoryDeposit, String> {

	List<HistoryDeposit> findByUser(User user);
}
