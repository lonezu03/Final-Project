package com.example.demo.dto.respone;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class StatisticNovel {

	private String idNovel;
	private String nameNovel;
	private Integer totalView;
	private List<String> nameAuthors;
	private List<String> categorys;
	private Integer totalInteract;
	private Integer totalReview;
	private Double avgRating;
	private Integer totalChapter;
	private Integer totalCoinSpend;
}
