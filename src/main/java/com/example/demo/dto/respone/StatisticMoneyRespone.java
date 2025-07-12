package com.example.demo.dto.respone;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class StatisticMoneyRespone {

	private Date date;
	private Integer totalMoney;
	private Integer totalDeposit;
}
