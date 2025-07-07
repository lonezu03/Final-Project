package com.example.demo.dto.request;

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
public class HistoryDepositUpdateRequest {
	String idHistoryDeposit;
	StatusDeposit statusDeposit;
}
