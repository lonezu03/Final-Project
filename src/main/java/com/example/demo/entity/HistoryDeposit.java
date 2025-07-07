package com.example.demo.entity;

import java.time.LocalDateTime;
import java.util.Date;

import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistoryDeposit {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	String idHistoryDeposit;
	
	LocalDateTime dateCreate;
		
	Integer amountDeposit;
	
	Integer coinDeposit;
	
    @Column(name = "statusDeposit",nullable = false)
    @Enumerated(EnumType.STRING)
	StatusDeposit statusDeposit;
	
    @Column(name = "typeDeposit",nullable = false)
    @Enumerated(EnumType.STRING)
	TypeDeposit typeDeposit;
    
	String detail;
	
	Double voucher;
	
	LocalDateTime dateUpdate;
	
	LocalDateTime dateDelete;
	
	@ManyToOne
	@JoinColumn(name = "idUser", nullable = false)
	User user;

}
