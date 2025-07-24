package com.example.demo.dto.respone;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserRespone {
	String idUser;

	String userNameUser;

	String emailUser;

	String avatarUser;

	String token;

	LocalDateTime dobUser;

	String publicIdAvartarUser;

	Integer coin;

	String role;


	List<CommentRespone> commentRespones;
	List<String> chapterBought;
	List<HistoryReadNovelRespone> historyRead;
	
	List<HistoryDepositRespone> historyDeposit;

}
