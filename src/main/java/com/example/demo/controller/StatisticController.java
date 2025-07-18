package com.example.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.dto.respone.StatisticNovel;
import com.example.demo.enums.SortDate;
import com.example.demo.enums.SortDirection;
import com.example.demo.enums.SortField;
import com.example.demo.service.StatisticService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/statistic")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StatisticController {

	StatisticService statisticService;
	
	@GetMapping("/novel")
	public ApiRespone<List<StatisticNovel>> statisticNovel( @RequestParam(defaultValue = "10") int top,
	        @RequestParam(defaultValue = "TOTAL_VIEW") SortField sortBy,
	        @RequestParam(defaultValue = "DESC") SortDirection direction) {
		return ApiRespone.<List<StatisticNovel>>builder().result(statisticService.statisticNovel(top,sortBy,direction)).build();
	}

	@GetMapping("/amount")
	public ApiRespone<Map<String, Integer>> statisticAmount(@RequestParam SortDate type,@RequestParam(required = false) String monthYear) {

	    Map<String, Integer> data = statisticService.statisticAmountByTime(type, monthYear);
	    ApiRespone<Map<String, Integer>> response = ApiRespone.<Map<String, Integer>>builder()
	            .result(data)
	            .build();
	    return response;
	}


    
}
