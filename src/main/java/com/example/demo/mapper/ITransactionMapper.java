package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.demo.dto.request.TransactionCreationRequest;
import com.example.demo.dto.respone.TransactionRespone;
import com.example.demo.entity.Transaction;

@Mapper(componentModel = "spring", uses = { IChapterMapper.class })
public interface ITransactionMapper {

	Transaction toTransaction(TransactionCreationRequest request);
	 
	TransactionRespone toTransactionRespone(Transaction transaction);  
}
 