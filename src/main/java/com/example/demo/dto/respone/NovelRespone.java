package com.example.demo.dto.respone;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonInclude;

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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NovelRespone {
	String idNovel;
	String publicIDNovel;
	String nameNovel;
	String descriptionNovel;
	Integer totalChapter;
	String rating;
	String statusNovel;
	String imageNovel;
	Integer totalFollower;
	Integer totalView;
	Boolean isFollow;
	
	
	Set<AuthorResponeForNovel> authors ;
	
	Set<CategoryRespone> categories;
	
//	Set<ChapterRespone> chapters; 
}
