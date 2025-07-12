package com.example.demo.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.User;
import com.example.demo.enums.StatusDeposit;

import java.util.List;


public interface IHistoryDepositRepository extends JpaRepository<HistoryDeposit, String> {

	List<HistoryDeposit> findByUser(User user);
	List<HistoryDeposit> findByUser_IdUserAndDetailInAndStatusDeposit(
		    String userId,
		    List<String> detail,
		    StatusDeposit statusDeposit
		);
	List<HistoryDeposit> findByStatusDeposit(StatusDeposit statusDeposit);

	@Query("""
		    SELECT FUNCTION('DATE_FORMAT', h.dateCreate, :pattern) AS timeGroup, SUM(h.amountDeposit)
		    FROM HistoryDeposit h
		    WHERE h.statusDeposit = 'SUCCESS'
		      AND h.typeDeposit = 'BUY_COIN'
		    GROUP BY FUNCTION('DATE_FORMAT', h.dateCreate, :pattern)
		    ORDER BY timeGroup
		""")
		List<Object[]> statisticAmountByTime(@Param("pattern") String pattern);

}
