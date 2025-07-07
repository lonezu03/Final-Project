package com.example.demo.dto.request;

import java.util.Date;

import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryDepositCreationRequest {
	
	Integer amountDeposit;
	Integer coinDeposit;
	Double voucher;
	StatusDeposit statusDeposit;
	TypeDeposit typeDeposit;
	String detail;
	
	String idUser;
}
