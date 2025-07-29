package com.example.demo.entity;

import java.util.HashSet;
import java.util.Set;

import com.example.demo.enums.Role;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
public class Permission {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	Integer idPermission;
	
	String method;
	
	String endPoint;
	
	String type;
	
	@Column(nullable = false)
	boolean isWhiteList;
	
	@ManyToMany
	@JoinTable(
	    name = "permission_role_user",
	    joinColumns = @JoinColumn(name = "permission_id"),
	    inverseJoinColumns = @JoinColumn(name = "role_user_id")
	)
	Set<RoleUser> roles=new HashSet<>() ;


	
	@ManyToMany(mappedBy = "permissions")
	Set<User> users=new HashSet<>();
}
