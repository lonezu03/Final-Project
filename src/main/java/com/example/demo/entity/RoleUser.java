package com.example.demo.entity;


import java.util.HashSet;
import java.util.Set;

import com.example.demo.enums.Role;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "role_user")
public class RoleUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long idRoleUser;
    
    @Column(name = "role",nullable = false)
    @Enumerated(EnumType.STRING)
    Role role;
    
    @ManyToMany(mappedBy = "roles")
	Set<Permission> permissions=new HashSet<>();

}
