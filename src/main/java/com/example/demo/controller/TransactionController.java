package com.example.demo.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.ConfirmTransactionRequest;
import com.example.demo.dto.request.TransactionCreationRequest;
import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.service.TransactionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TransactionController {

	TransactionService transactionService;
	
	@PostMapping("/createTransaction")
	public ApiRespone<Boolean> createTransaction(@RequestBody TransactionCreationRequest request) {
		//TODO: process POST request
		
		return ApiRespone.<Boolean>builder().result(transactionService.createTransactions(request.getIdUser(), request)).build();
	}
	
	
	@PostMapping("/confirmTransactions")
	public ApiRespone<Boolean> confirmTransactions(@RequestBody ConfirmTransactionRequest request) {
		//TODO: process POST request
		
		return ApiRespone.<Boolean>builder().result(transactionService.confirmTransactions(request.getIdUser(), request.getListIdChapter())).build();
	}
}
