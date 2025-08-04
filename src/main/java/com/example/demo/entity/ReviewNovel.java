package com.example.demo.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.example.demo.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewNovel {

	@EmbeddedId
	private ReviewNovelId id;

	@ManyToOne
	@MapsId("idUser")
	@JoinColumn(name = "id_User", nullable = false)
	private User user; 

	@ManyToOne
	@MapsId("idNovel")
	@JoinColumn(name = "id_Novel", nullable = false)
	private Novel novel;

	private Short rating;
	
	@Column(name = "reviewMC",length = 500)
	private String reviewMC;
	
	@Column(name = "reviewSC",length = 500)
	private String reviewSC;
	
	@Column(name = "reviewWorld",length = 500)
	private String reviewWorld;
	
	@Column(name = "reviewPersonal",length = 500)
	private String reviewPersonal;
	
	private LocalDateTime reviewTime;
}
