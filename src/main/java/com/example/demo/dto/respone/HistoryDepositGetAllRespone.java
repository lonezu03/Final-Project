package com.example.demo.dto.respone;

import java.time.LocalDateTime;

import com.example.demo.enums.Role;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistoryDepositGetAllRespone {
	String idHistoryDeposit;

	LocalDateTime dateCreate;

	Integer amountDeposit;

	Integer coinDeposit;

	Double voucher;

	StatusDeposit statusDeposit;

	TypeDeposit typeDeposit;

	LocalDateTime dateUpdate;

	LocalDateTime dateDelete;

	String emailUser;

	String avatarUser;
	
	Role role;
	
	String userNameUser;

	String detail;
}
