package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.example.demo.dto.request.ChapterCreationRequest;
import com.example.demo.dto.request.ChapterUpdateRequest;
import com.example.demo.dto.respone.ChapterBoughtRespone;
import com.example.demo.dto.respone.ChapterRespone;

import com.example.demo.entity.Chapter;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface IChapterMapper {

	@Mapping(target = "novel", ignore = true)
	Chapter toChapter(ChapterCreationRequest request);

	@Mapping(target = "novel", ignore = true)
	Chapter toChapterUpdate(ChapterUpdateRequest request);

	@Mapping(source = "novel.idNovel", target = "novel")
	ChapterRespone toChapterRespone(Chapter chapter);

	@Mapping(target = "novel", ignore = true)
	void updateChapter(ChapterUpdateRequest request, @MappingTarget Chapter chapter);
 
	Chapter toChapterbyChapter(Chapter chapter);
	
    ChapterBoughtRespone toChapterBoughtRespone(Chapter chapter);

}
