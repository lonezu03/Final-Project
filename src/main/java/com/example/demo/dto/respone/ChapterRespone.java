package com.example.demo.dto.respone;

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
public class ChapterRespone {
	String idChapter;

	String titleChapter;

	String contentChapter;

	Integer viewChapter;

	Long indexChapter;
	
	String novel;
	
	String urlAudio;
	
	byte[] audioBlob;
	
	Integer coinPrice;

	Integer cointRentPrice;
	
	Integer dayRentAmount;
}
