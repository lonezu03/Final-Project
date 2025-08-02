package com.example.demo.entity;

import java.time.LocalDateTime;

import com.example.demo.enums.StatusReport;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "report")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content",length = 5000)
    private String content;

    private String reporterEmail; 
    
	@Enumerated(EnumType.STRING)
    private StatusReport statusReport;

    private LocalDateTime createdAt;
}
