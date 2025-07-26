package com.example.demo.dto.respone;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChapterBoughtRespone {

	String idChapter;
	String titleChapter;
	Long indexChapter;
	LocalDateTime dateBuy;
	
	LocalDateTime dayRentAmount;
}
