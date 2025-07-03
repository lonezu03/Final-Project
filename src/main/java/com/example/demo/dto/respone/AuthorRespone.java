package com.example.demo.dto.respone;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import com.example.demo.entity.Author;
import com.example.demo.entity.Novel;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.ManyToMany;
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
public class AuthorRespone {
	String idAuthor;

	String publicIDAuthor;
	String nameAuthor;
	String descriptionAuthor; 
	String nationalityAuthor;
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
	LocalDate dobAuthor;

	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
	LocalDate dodAuthor;


	String genderAuthor;
	String imageAuthor;
 
	Set<NovelResponeForAuthor> novels ;
}
