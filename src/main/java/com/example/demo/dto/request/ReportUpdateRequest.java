package com.example.demo.dto.request;

import com.example.demo.enums.StatusProcessingStatus;
import com.example.demo.enums.StatusReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportUpdateRequest {
	private Long id;

	private String content;

	private StatusReport statusReport;

	private StatusProcessingStatus statusProcessingStatus;

}
