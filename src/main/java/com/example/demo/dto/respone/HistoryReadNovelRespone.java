package com.example.demo.dto.respone;

import java.time.LocalDateTime;
import java.util.List;

import com.example.demo.entity.HistoryId;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@FieldDefaults(level =  AccessLevel.PRIVATE)
public class HistoryReadNovelRespone {

	String nameNovel;
//	String
	List<HistoryReadSubRespone> historyReadRespones;
}
