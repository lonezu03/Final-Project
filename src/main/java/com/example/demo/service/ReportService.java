package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.ReportCreationRequest;
import com.example.demo.entity.Report;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
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
}
