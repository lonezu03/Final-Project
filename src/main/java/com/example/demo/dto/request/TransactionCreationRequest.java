package com.example.demo.dto.request;

import java.time.LocalDateTime;
import java.util.List;

import com.example.demo.enums.TypeTransaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionCreationRequest {
	private String idUser;
	private List<String> idChapters;
	private LocalDateTime dateEndRent;
	private Integer amountCoin;
	private TypeTransaction typeTransaction;
}
