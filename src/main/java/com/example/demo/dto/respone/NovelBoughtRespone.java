package com.example.demo.dto.respone;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NovelBoughtRespone {
	
	String idNovel;
	String nameNovel;
	String descriptionNovel;
	String imageNovel;
	LocalDateTime dateBuy;
	
	List<ChapterBoughtRespone> chapterBoughtRespone;
}
