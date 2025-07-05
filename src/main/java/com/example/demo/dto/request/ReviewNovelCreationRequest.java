package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewNovelCreationRequest {
	
	private String idUser;
	
	private String idNovel;
	
	private Short rating;
	
	private String reviewMC;

	private String reviewSC;
	
	private String reviewWorld;
	
	private String reviewPersonal;
}
