package com.example.demo.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistoryNotify {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	String idHistoryNotify;
	
	Date dateNotify;
	
	Boolean isNotify;
	
	String nameNovel;
	
	String titleChapter;
	
	@ManyToOne
	@JoinColumn(name = "idUser", nullable = false)
	User user;

}
