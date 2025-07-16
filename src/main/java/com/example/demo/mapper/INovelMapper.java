package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.example.demo.dto.request.NovelCreatationRequest;
import com.example.demo.dto.request.NovelUpdateRequest;
import com.example.demo.dto.respone.NovelRespone;
import com.example.demo.dto.respone.NovelResponeForAuthor;
import com.example.demo.entity.Novel;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface INovelMapper {
	@Mapping(target = "authors", ignore = true)
	Novel toNovel(NovelCreatationRequest request);

	void updateNovel(NovelUpdateRequest request,@MappingTarget Novel novel);
	
//	@Mapping(target = "authors", ignore = true)
	NovelRespone toNovelRespone(Novel novel);  
	
	NovelResponeForAuthor toNovelResponeForAuthor(Novel novel);
}
