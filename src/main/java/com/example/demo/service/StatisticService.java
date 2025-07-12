package com.example.demo.service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.respone.StatisticNovel;
import com.example.demo.entity.Author;
import com.example.demo.entity.Category;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.Novel;
import com.example.demo.entity.ReviewNovel;
import com.example.demo.entity.Transaction;
import com.example.demo.enums.SortDate;
import com.example.demo.enums.SortDirection;
import com.example.demo.enums.SortField;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.IHistoryDepositRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StatisticService {
	
	IUserRepository userRepository;
	INovelRepository novelRepository;
	IChapterRepository chapterRepository;
	IHistoryDepositRepository historyDepositRepository;
	
	public List<StatisticNovel> statisticNovel(Integer top, SortField sortBy, SortDirection direction){
		List<Novel> novels= novelRepository.findAll();
		List<StatisticNovel> statisticNovels= novels.stream().map( novel -> {
			Integer totalView= novel.getChapters().stream().mapToInt(Chapter::getViewChapter).sum();
			
			Integer totalInteract = novel.getChapters().stream()
	                .mapToInt(chapter -> chapter.getComments().size())
	                .sum();
			
			Integer totalReview=novel.getReviewNovels().size();
			
	        Double avgRating = novel.getReviewNovels().stream()
	                .mapToInt(ReviewNovel::getRating) 
	                .average()
	                .orElse(0.0); 
			
	        Integer totalChapter=novel.getChapters().size();
	        
	        Integer totalCoinSpend = novel.getChapters().stream()
	        	    .flatMap(chapter -> chapter.getTransactions().stream())
	        	    .filter(t -> t.getStatusDeposit() == StatusDeposit.SUCCESS)
	        	    .mapToInt(Transaction::getAmountCoin)
	        	    .sum();

	        
			List<String> nameAuthor=novel.getAuthors().stream().map(Author::getNameAuthor).toList();
			List<String> category=novel.getCategories().stream().map(Category::getNameCategory).toList();
			return StatisticNovel.builder()
					 			.idNovel(novel.getIdNovel())
					 			.nameNovel(novel.getNameNovel())
					 	        .totalView(totalView)
					 	        .nameAuthors(nameAuthor)
					 	        .categorys(category)
					 	        .totalInteract(totalInteract)
					 	        .totalReview(totalReview)
					 	        .avgRating(avgRating)
					 	        .totalChapter(totalChapter)
					 	        .totalCoinSpend(totalCoinSpend)
					 	        .build();			  
			  
	    })
		.sorted(getComparator(sortBy, direction))
		.limit(top) // 🔥 Giới hạn số lượng kết quả
		.collect(Collectors.toList());
		return statisticNovels;
		
	}

	public Map<String, Integer> statisticAmountByTime(SortDate type) {
	    String pattern;

	    switch (type) {
	        case DAY -> pattern = "%Y-%m-%d";
	        case MONTH, QUARTER -> pattern = "%Y-%m";  // QUARTER sẽ xử lý thêm phía dưới
	        case YEAR -> pattern = "%Y";
	        default -> throw new IllegalArgumentException("Invalid SortDate: " + type);
	    }

	    List<Object[]> rawData = historyDepositRepository.statisticAmountByTime(pattern);
	    rawData.forEach(row -> log.info("Raw row: {}", Arrays.toString(row)));

	    Map<String, Integer> result = new LinkedHashMap<>();

	    for (Object[] row : rawData) {
	        String key = (String) row[0];
	        Integer sum = ((Number) row[1]).intValue();

	        if (type == SortDate.QUARTER) {
	            int month = Integer.parseInt(key.split("-")[1]);
	            int quarter = (month - 1) / 3 + 1;
	            String year = key.split("-")[0];
	            key = "Q" + quarter + "/" + year;
	        }

	        result.merge(key, sum, Integer::sum);
	    }

	    return result;
	}

	private Comparator<StatisticNovel> getComparator(SortField sortBy, SortDirection direction) {
	    Comparator<StatisticNovel> comparator = switch (sortBy) {
	        case TOTAL_VIEW -> Comparator.comparingInt(StatisticNovel::getTotalView);
	        case TOTAL_INTERACT -> Comparator.comparingInt(StatisticNovel::getTotalInteract);
	        case TOTAL_REVIEW -> Comparator.comparingInt(StatisticNovel::getTotalReview);
	        case AVG_RATING -> Comparator.comparingDouble(StatisticNovel::getAvgRating);
	        case TOTAL_CHAPTER -> Comparator.comparingInt(StatisticNovel::getTotalChapter);
	        case TOTAL_COIN_SPEND -> Comparator.comparingInt(StatisticNovel::getTotalCoinSpend);
	    };

	    return direction == SortDirection.DESC ? comparator.reversed() : comparator;
	}


	
}
