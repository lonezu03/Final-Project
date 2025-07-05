package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.demo.dto.request.ReviewNovelCreationRequest;
import com.example.demo.dto.respone.ReviewNovelRespone;
import com.example.demo.entity.ReviewNovel;

@Mapper(componentModel = "spring")
public interface IReviewNovelMapper {

	ReviewNovel toReviewNovel(ReviewNovelCreationRequest request); 
	
	@Mapping(source = "user.userNameUser", target = "userName")
	@Mapping(source = "user.avatarUser", target = "avatarUser")
	ReviewNovelRespone toReviewNovelRespone(ReviewNovel reviewNovel); 
	
	void updateReviewNovel(ReviewNovel oldReviewNovel,@MappingTarget ReviewNovel newReviewNovel);
}
 