package com.example.demo.service;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.RoleUserAddPermission;
import com.example.demo.dto.request.RoleUserRemovePermission;
import com.example.demo.dto.respone.PermissionRespone;
import com.example.demo.dto.respone.RoleUserRespone;
import com.example.demo.entity.Permission;
import com.example.demo.entity.RoleUser;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IPermissionMapper;
import com.example.demo.mapper.IRoleUserMapper;
import com.example.demo.repository.IPermissionRepository;
import com.example.demo.repository.IRoleUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleUserPermissionService {

	IRoleUserRepository roleUserRepository;
	IRoleUserMapper roleUserMapper;
	IPermissionRepository permissionRepository;
	IPermissionMapper permissionMapper;
	public List<RoleUserRespone> getAllRole() {
		List<RoleUserRespone> roleUsers=roleUserRepository.findAll().stream().map(t -> {
			RoleUserRespone respone= roleUserMapper.toRoleUserRespone(t);
			Set<Permission> permissions=t.getPermissions();
			for (Permission permission : permissions) {
				PermissionRespone permissionRespone=permissionMapper.toPermissionRespone(permission);
				respone.getPermissionRespones().add(permissionRespone);
			}
			return respone;
		}).toList();
		
		return roleUsers;
	}
	
	public List<PermissionRespone> getAllPermission(){
		List<PermissionRespone> permissionRespones=permissionRepository.findAll().stream().map(t -> permissionMapper.toPermissionRespone(t)).toList();
		return permissionRespones;
	}
	
	public RoleUserRespone addPermissionToRole(RoleUserAddPermission permission) {
		RoleUser roleUser=roleUserRepository.findById(permission.getIdRole()).orElseThrow(() ->  new AppException(ErrorCode.ROLE_USER_NOT_EXISTS));
		Permission per=permissionRepository.findById(permission.getIdPermission()).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_EXISTS));
		
		roleUser.getPermissions().add(per);
		per.getRoles().add(roleUser);
		roleUserRepository.save(roleUser);
		permissionRepository.save(per);
		return roleUserMapper.toRoleUserRespone(roleUser);
		
	}
	
	public RoleUserRespone removePermissionToRole(RoleUserRemovePermission permission) {
		RoleUser roleUser=roleUserRepository.findById(permission.getIdRole()).orElseThrow(() ->  new AppException(ErrorCode.ROLE_USER_NOT_EXISTS));
		Permission per=permissionRepository.findById(permission.getIdPermission()).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_EXISTS));
		
		roleUser.getPermissions().remove(per);
		per.getRoles().remove(roleUser);
		roleUserRepository.save(roleUser);
		permissionRepository.save(per);
		return roleUserMapper.toRoleUserRespone(roleUser);
		
	}
	
	public PermissionRespone whiteListPermission(Integer idPermission) {
		Permission per=permissionRepository.findById(idPermission).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_EXISTS));
		
		per.setWhiteList(true);
		
		permissionRepository.save(per);
		return permissionMapper.toPermissionRespone(per);
		
	}
	
	
	public PermissionRespone unWhiteListPermission(Integer idPermission) {
		Permission per=permissionRepository.findById(idPermission).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_EXISTS));
		
		per.setWhiteList(false);
		
		permissionRepository.save(per);
		return permissionMapper.toPermissionRespone(per);
		
	}
}
