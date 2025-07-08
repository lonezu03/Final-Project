package com.example.demo.mapper;

import org.mapstruct.Mapper;

import com.example.demo.dto.request.TransactionCreationRequest;
import com.example.demo.entity.Transaction;

@Mapper(componentModel = "spring")
public interface ITransactionMapper {

	Transaction toTransaction(TransactionCreationRequest request);
}
