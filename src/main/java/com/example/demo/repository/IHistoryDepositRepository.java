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

//	@Query("""
//		    SELECT FUNCTION('DATE_FORMAT', h.dateCreate, :pattern) AS timeGroup, SUM(h.amountDeposit)
//		    FROM HistoryDeposit h
//		    WHERE h.statusDeposit = 'SUCCESS'
//		      AND h.typeDeposit = 'BUY_COIN'
//		    GROUP BY FUNCTION('DATE_FORMAT', h.dateCreate, :pattern)
//		    ORDER BY timeGroup
//		""")
//		List<Object[]> statisticAmountByTime(@Param("pattern") String pattern);
//
//		@Query(value = """
//		        SELECT IFNULL(SUM(amount_deposit), 0)
//		        FROM history_deposit
//		        WHERE DATE_FORMAT(date_create, '%Y-%m-%d') = :day
//		    """, nativeQuery = true)
//		    Integer statisticAmountByDay(@Param("day") String day);
	// Tổng tiền theo ngày với status SUCCESS
	@Query("""
	    SELECT SUM(h.amountDeposit)
	    FROM HistoryDeposit h
	    WHERE FUNCTION('DATE', h.dateCreate) = :date
	      AND h.statusDeposit = com.example.demo.enums.StatusDeposit.SUCCESS
	""")
	Integer statisticAmountByDay(@Param("date") String date);

	// Tổng tiền theo tháng với status SUCCESS (yyyy-MM)
	@Query("""
	    SELECT SUM(h.amountDeposit)
	    FROM HistoryDeposit h
	    WHERE FUNCTION('DATE_FORMAT', h.dateCreate, '%Y-%m') = :month
	      AND h.statusDeposit = com.example.demo.enums.StatusDeposit.SUCCESS
	""")
	Integer statisticAmountByMonth(@Param("month") String month);

	// Tổng tiền theo định dạng thời gian với status SUCCESS
	@Query("""
	    SELECT FUNCTION('DATE_FORMAT', h.dateCreate, :pattern), SUM(h.amountDeposit)
	    FROM HistoryDeposit h
	    WHERE h.statusDeposit = com.example.demo.enums.StatusDeposit.SUCCESS
	    GROUP BY FUNCTION('DATE_FORMAT', h.dateCreate, :pattern)
	""")
	List<Object[]> statisticAmountByTime(@Param("pattern") String pattern);

	// Query theo năm (sử dụng pattern %Y)
	@Query("""
	    SELECT FUNCTION('DATE_FORMAT', h.dateCreate, '%Y'), SUM(h.amountDeposit)
	    FROM HistoryDeposit h
	    WHERE h.statusDeposit = com.example.demo.enums.StatusDeposit.SUCCESS
	    GROUP BY FUNCTION('DATE_FORMAT', h.dateCreate, '%Y')
	    ORDER BY FUNCTION('DATE_FORMAT', h.dateCreate, '%Y')
	""")
	List<Object[]> statisticAmountByYear();

}
