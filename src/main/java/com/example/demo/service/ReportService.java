package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.ReportCreationRequest;
import com.example.demo.dto.request.ReportUpdateRequest;
import com.example.demo.entity.Report;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.enums.StatusProcessingStatus;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.repository.IUserRepository;
import com.example.demo.repository.ReportRepository;

@Service
public class ReportService {
	@Autowired
	private ReportRepository reportRepository;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	@Autowired 
	private IUserRepository userRepository;
	
	public void handleReport(ReportCreationRequest request, String reporterEmail) {
		Report report = new Report();
		report.setContent(request.getContent());
		report.setStatusReport(request.getStatusReport());
		report.setReporterEmail(reporterEmail);
		report.setStatusProcessingStatus(StatusProcessingStatus.NEW);
		report.setCreatedAt(LocalDateTime.now());
		reportRepository.save(report);

		 List<User> admins = userRepository.findAllByRole(Role.ADMIN);
	        for (User admin : admins) {
	            String email = admin.getEmailUser();
	            messagingTemplate.convertAndSendToUser(email, "/queue/report", report);
	        }
	}
	
	public List<Report> getReports(){
		return reportRepository.findAll();
	}
	
	public Report updateReport(ReportUpdateRequest request) {
		Report report=reportRepository.findById(request.getId()).orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_EXISTS));
		report.setContent(report.getContent());
		report.setStatusProcessingStatus(request.getStatusProcessingStatus());
		report.setStatusReport(request.getStatusReport());
		report.setUpdateAt(LocalDateTime.now());
		report=reportRepository.save(report);
		return report;
	}
	
	public Report deleteReport(Long idReport) {
		Report report=reportRepository.findById(idReport).orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_EXISTS));
		report.setUpdateAt(LocalDateTime.now());
		report.setDeleteAt(LocalDateTime.now());
		report=reportRepository.save(report);
		return report;
	}
}
