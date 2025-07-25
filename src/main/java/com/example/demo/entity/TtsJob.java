package com.example.demo.entity;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "tts_jobs")
@Data
public class TtsJob {
	@Id
    private String id;

    private String status; // PENDING, PROCESSING, ASSEMBLING, COMPLETED, FAILED

    @Column(length = 500)
    private String finalAudioUrl; // URL Cloudinary của file cuối cùng


    
    
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "audio_blob", columnDefinition = "LONGBLOB")
    private byte[] audioBlob;

    
    private String errorMessage;

    private Date createdAt;

    private String idChapter;
    
    @OneToMany(mappedBy = "parentJob", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<TtsSubJob> subJobs = new HashSet<>();

}
