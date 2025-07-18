package com.example.demo.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
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

	public Map<String, Integer> statisticAmountByTime(SortDate type, String daymonthYear) {
		 Map<String, Integer> result = new LinkedHashMap<>();

		    // Parse ngày đầu vào một cách an toàn
		    if (daymonthYear == null || daymonthYear.isEmpty()) {
		        throw new IllegalArgumentException("daymonthYear must not be null or empty");
		    }

		    // Hỗ trợ tự động parse kể cả khi truyền vào dạng "2025", "2025-07", "2025-07-01"
		    LocalDate date;
		    try {
		        if (daymonthYear.length() == 4) {
		            date = LocalDate.parse(daymonthYear + "-01-01"); // chỉ có năm
		        } else if (daymonthYear.length() == 7) {
		            date = LocalDate.parse(daymonthYear + "-01"); // chỉ có tháng
		        } else {
		            date = LocalDate.parse(daymonthYear); // đủ yyyy-MM-dd
		        }
		    } catch (DateTimeParseException e) {
		        throw new IllegalArgumentException("Invalid date format. Expect yyyy, yyyy-MM, or yyyy-MM-dd");
		    }

		    switch (type) {
		        case DAY -> {
		            // Lấy 7 ngày trong tuần chứa ngày được truyền
		            LocalDate startOfWeek = date.with(DayOfWeek.MONDAY);
		            for (int i = 0; i < 7; i++) {
		                LocalDate currentDay = startOfWeek.plusDays(i);
		                String key = currentDay.toString(); // yyyy-MM-dd
		                Integer sum = historyDepositRepository.statisticAmountByDay(key);
		                result.put(key, sum);
		            }
		            return result;
		        }

		        case MONTH -> {
		            // Lấy từng ngày trong tháng chứa ngày truyền vào
		            int year = date.getYear();
		            int month = date.getMonthValue();
		            int daysInMonth = YearMonth.of(year, month).lengthOfMonth();
		            for (int day = 1; day <= daysInMonth; day++) {
		                String key = String.format("%d-%02d-%02d", year, month, day);
		                Integer sum = historyDepositRepository.statisticAmountByDay(key);
		                result.put(key, sum);
		            }
		            return result;
		        }

		        case YEAR -> {
		            // Lấy từng tháng trong năm chứa ngày truyền vào
		            int year = date.getYear();
		            for (int month = 1; month <= 12; month++) {
		                String key = String.format("%d-%02d", year, month);
		                Integer sum = historyDepositRepository.statisticAmountByMonth(key);
		                result.put(key, sum);
		            }
		            return result;
		        }

		        case YEAR_RANGE -> {
		            // Trả về danh sách các năm và tổng tiền của từng năm
		            List<Object[]> rawData = historyDepositRepository.statisticAmountByYear();
		            for (Object[] row : rawData) {
		                String year = (String) row[0];
		                Integer sum = ((Number) row[1]).intValue();
		                result.put(year, sum);
		            }
		            return result;
		        }

		        
		        
		        case QUARTER -> {
		            // Lấy theo quý trên toàn bộ thời gian có dữ liệu
		            String pattern = "%Y-%m";
		            List<Object[]> rawData = historyDepositRepository.statisticAmountByTime(pattern);
		            for (Object[] row : rawData) {
		                String key = (String) row[0]; // yyyy-MM
		                Integer sum = ((Number) row[1]).intValue();
		                int month = Integer.parseInt(key.split("-")[1]);
		                int quarter = (month - 1) / 3 + 1;
		                String yearStr = key.split("-")[0];
		                String quarterKey = "Q" + quarter + "/" + yearStr;
		                result.merge(quarterKey, sum, Integer::sum);
		            }
		            return result;
		        }

		        default -> throw new IllegalArgumentException("Invalid SortDate: " + type);
		    }
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
