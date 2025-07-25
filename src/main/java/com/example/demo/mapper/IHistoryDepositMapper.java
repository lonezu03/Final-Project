package com.example.demo.mapper;

import org.mapstruct.Mapper;

import com.example.demo.dto.request.HistoryDepositCreationRequest;
import com.example.demo.dto.respone.HistoryDepositGetAllRespone;
import com.example.demo.dto.respone.HistoryDepositRespone;
import com.example.demo.entity.HistoryDeposit;

@Mapper(componentModel = "spring")
public interface IHistoryDepositMapper {

	HistoryDeposit toHistoryDeposit(HistoryDepositCreationRequest request);
	 
	HistoryDepositRespone toHistoryDepositRespone(HistoryDeposit historyDeposit);
	
	HistoryDepositGetAllRespone toHistoryDepositGetAllRespone(HistoryDeposit historyDeposit);

}  
   