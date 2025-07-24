package com.example.demo.dto.respone;

import java.util.ArrayList;
import java.util.List;

import com.example.demo.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NovelBoughtRespone {
	
	String idNovel;
	String nameNovel;
	String descriptionNovel;
	String imageNovel;
	Status statusNovel;
	List<ChapterBoughtRespone> chapterBoughtRespone=new ArrayList<>();
}
