package com.example.demo.mapper;

import org.mapstruct.Mapper;

import com.example.demo.dto.respone.PermissionRespone;
import com.example.demo.entity.Permission;
 
@Mapper(componentModel = "spring")
public interface IPermissionMapper {
//	@Mapping(source =  "whiteList",target = "isWhiteList") 
	PermissionRespone toPermissionRespone(Permission permission);
}
 