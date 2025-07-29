package com.example.demo.dto.respone;

import java.util.HashSet;
import java.util.Set;

import com.example.demo.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleUserRespone {
	Long idRoleUser;

	Role role; 
	
	Set<PermissionRespone> permissionRespones=new HashSet<>();
}
