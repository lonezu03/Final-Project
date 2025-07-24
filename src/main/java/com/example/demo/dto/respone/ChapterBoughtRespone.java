package com.example.demo.dto.respone;

import java.time.LocalDateTime;
import java.util.List;

import com.example.demo.enums.Status;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
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

}
