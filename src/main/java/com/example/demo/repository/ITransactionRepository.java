package com.example.demo.repository;

import com.example.demo.entity.Transaction;
import com.example.demo.enums.StatusDeposit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ITransactionRepository extends JpaRepository<Transaction, String> {

	List<Transaction> findByUser_IdUser(String idUser);

	List<Transaction> findByChapter_IdChapter(String idChapter);

	List<Transaction> findByUser_IdUserAndChapter_IdChapterInAndStatusDeposit(
			String userId, 
			List<String> chapterIds,
			StatusDeposit statusDeposit);

	List<Transaction> findByUser_IdUserAndStatusDeposit(String idUser, StatusDeposit statusDeposit);

}
