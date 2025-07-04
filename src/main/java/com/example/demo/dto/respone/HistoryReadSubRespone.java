package com.example.demo.dto.respone;

import java.time.LocalDateTime;

import com.example.demo.entity.HistoryId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE)
public class HistoryReadSubRespone {
	 HistoryId id;

	String urlNovel;
	
	 String nameNovel;

	 String titleChapter;

	 Integer readPlace;
	
	 LocalDateTime readingTime;
}
