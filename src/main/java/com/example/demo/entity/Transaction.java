package com.example.demo.entity;

import java.time.LocalDateTime;
import java.util.Date;

import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;
import com.example.demo.enums.TypeTransaction;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private String idTransaction;
	
	@ManyToOne
	@JoinColumn(name = "id_User", nullable = false)
	private User user; 

	@ManyToOne
	@JoinColumn(name = "id_Chapter", nullable = false)
	private Chapter chapter;
	
	private LocalDateTime dateBuy;
	
	private LocalDateTime dateEndRent;
	
	private Integer amountCoin;
	  @Column(name = "statusDeposit",nullable = false)
	    @Enumerated(EnumType.STRING)
	private StatusDeposit statusDeposit;
	  @Column(name = "typeTransaction",nullable = false)
	    @Enumerated(EnumType.STRING)
	private TypeTransaction typeTransaction;
}
