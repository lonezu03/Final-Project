package com.example.demo.dto.request;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.demo.enums.TypeTransaction;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionCreationRequest {
	private String idUser;
	private List<ChapterAndPriceRequest> chapterAndPrice =new ArrayList<>();
	private LocalDateTime dateEndRent;
	private TypeTransaction typeTransaction;
	
}
