package com.example.demo.mapper;

import org.mapstruct.Mapper;

import com.example.demo.dto.respone.RoleUserRespone;
import com.example.demo.entity.RoleUser;

@Mapper(componentModel = "spring")
public interface IRoleUserMapper {

	RoleUserRespone toRoleUserRespone(RoleUser roleUser);
}
