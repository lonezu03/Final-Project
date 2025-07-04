package com.example.demo.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.respone.HistoryReadNovelRespone;
import com.example.demo.dto.respone.HistoryReadSubRespone;
import com.example.demo.entity.HistoryId;
import com.example.demo.entity.HistoryRead;
import com.example.demo.entity.Novel;
import com.example.demo.mapper.IHistoryReadMapper;
import com.example.demo.repository.IHistoryReadRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class HistoryReadService {

	IHistoryReadRepository historyReadRepository;
	IUserRepository userRepository;
	IHistoryReadMapper historyReadMapper;
	
	public String deleteHistoryRead(HistoryId historyId) {
		historyReadRepository.deleteById(historyId);
		return historyId.getIdChapter()+" "+historyId.getIdUser();
	}
	
	public List<HistoryReadNovelRespone> getHistoryRead(String idUser) {
		return buildHistoryGroupedByNovel(historyReadRepository.findByIDUser(idUser)) ;
		
	}
	private List<HistoryReadNovelRespone> buildHistoryGroupedByNovel(List<HistoryRead> histories) {
	    return histories.stream()
	        .collect(Collectors.groupingBy(hr -> hr.getChapter().getNovel()))
	        .entrySet().stream()
	        .map((Map.Entry<Novel, List<HistoryRead>> entry) -> {
	            Novel novel = entry.getKey();
	            List<HistoryRead> chapterHistories = entry.getValue();

	            List<HistoryReadSubRespone> subs = chapterHistories.stream().map(hr -> {
	                HistoryReadSubRespone sub = historyReadMapper.toHistoryReadRespone(hr);
	                sub.setNameNovel(novel.getNameNovel());
	                sub.setUrlNovel(novel.getImageNovel());
	                sub.setTitleChapter(hr.getChapter().getTitleChapter());
	                return sub;
	            }).collect(Collectors.toList());

	            return HistoryReadNovelRespone.builder()
	                    .nameNovel(novel.getNameNovel())
	                    .historyReadRespones(subs)
	                    .build();
	        }).collect(Collectors.toList());
	}
}
