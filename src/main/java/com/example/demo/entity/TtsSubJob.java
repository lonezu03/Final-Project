package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "tts_sub_jobs")
@Data
public class TtsSubJob {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY) // tự động tăng
	private Long id;


	@Column(nullable = false)
	private int jobOrder; // Thứ tự để ghép file

	private String status; // PENDING, PROCESSING, COMPLETED, FAILED

	@Column(columnDefinition = "TEXT")
	private String textChunk;

	@Column(length = 500)
	private String tempAudioUrl; // URL tạm từ FPT.AI

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_job_id", nullable = false)
	private TtsJob parentJob;
}
