package com.example.demo.dto.respone;

import java.util.List;

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
public class CommentRespone {
	String idComment;

	String contentComment;

	Integer likeComment;

	Boolean isLike;
	
	Boolean isDislike;
	
	Integer dislikeComment;
	
	String userName;
	
	String idUser;
	
	String urlImage;
	
	List<CommentRespone> replyComments;
	
	List<CommetLikeRespone> likes;
	
	List<CommetDislikeRespone> dislikes;

}
