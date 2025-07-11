package com.example.demo.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.example.demo.enums.Role;
import com.example.demo.enums.Status;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
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
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	String idUser;

	String userNameUser;

	String passwordUser;

	String emailUser;

	String avatarUser;

    @Column(name = "role",nullable = false)
    @Enumerated(EnumType.STRING)
    Role role;
	
	LocalDateTime dobUser;

	String publicIdAvartarUser;

	Integer coin;
	
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "user", orphanRemoval = true)
    RefreshToken refreshToken;
	
	@OneToMany(mappedBy = "user",cascade = CascadeType.ALL,orphanRemoval = true)
	List<Comment> comments=new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	List<HistoryNotify> historyNotifies = new ArrayList<>();
	
	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	List<HistoryDeposit> historyDeposits = new ArrayList<>();

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	Set<CommentLike> likedComments = new HashSet<>();
	
	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	Set<CommentDislike> dislikedComments = new HashSet<>();
	
	@OneToMany(mappedBy = "user")
	List<Transaction> transactions;

}
