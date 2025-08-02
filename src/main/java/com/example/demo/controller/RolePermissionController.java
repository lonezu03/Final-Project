package com.example.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.DeletePermissionRequest;
import com.example.demo.dto.request.RoleUserAddPermission;
import com.example.demo.dto.request.RoleUserRemovePermission;
import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.dto.respone.PermissionRespone;
import com.example.demo.dto.respone.RoleUserRespone;
import com.example.demo.service.RoleUserPermissionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/rolePermission")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RolePermissionController {

	RoleUserPermissionService roleUserService;
	
	@GetMapping("/getAllRole")
	public ApiRespone<List<RoleUserRespone>> getAllRole(){
		return ApiRespone.<List<RoleUserRespone>>builder().result(roleUserService.getAllRole()).build();
	}
	
	@GetMapping("/getAllPermission")
	public ApiRespone<List<PermissionRespone>> getAllPermission(){
		return ApiRespone.<List<PermissionRespone>>builder().result(roleUserService.getAllPermission()).build();
	}
	
	@PostMapping("/addPermissionToRole")
	public ApiRespone<RoleUserRespone> addPermissionToRole(@RequestBody RoleUserAddPermission permission){
		return ApiRespone.<RoleUserRespone>builder().result(roleUserService.addPermissionToRole(permission)).build();
	}
	
	@PostMapping("/removePermissionToRole")
	public ApiRespone<RoleUserRespone> removePermissionToRole(@RequestBody RoleUserRemovePermission permission){
		return ApiRespone.<RoleUserRespone>builder().result(roleUserService.removePermissionToRole(permission)).build();
	}
	
	@PutMapping(value = "/whiteListPermission/{idPermission}")
	public ApiRespone<PermissionRespone> whiteListPermission(@PathVariable Integer idPermission){
		return ApiRespone.<PermissionRespone>builder().result(roleUserService.whiteListPermission(idPermission)).build();
	}

	@PutMapping(value = "/unWhiteListPermission/{idPermission}")
	public ApiRespone<PermissionRespone> unWhiteListPermission(@PathVariable Integer idPermission){
		return ApiRespone.<PermissionRespone>builder().result(roleUserService.unWhiteListPermission(idPermission)).build();
	}
	
	@DeleteMapping("/deletePermission")
	public ApiRespone<Boolean> deletePermission(@RequestBody DeletePermissionRequest listPermission){
		return ApiRespone.<Boolean>builder().result(roleUserService.deletePermission(listPermission)).build();
	}
	
}
