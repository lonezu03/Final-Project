package com.example.demo.dto.respone;

import java.time.LocalDateTime;

import com.example.demo.entity.ReviewNovelId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class ReviewNovelRespone {
	
	private ReviewNovelId id;
	
	private String avatarUser;
	
	private String userName;
	
	private Short rating;
	
	private String reviewMC;

	private String reviewSC;
	
	private String reviewWorld;
	
	private String reviewPersonal;
	
	private LocalDateTime reviewTime;
}
