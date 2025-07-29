package com.example.demo.dto.respone;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class PermissionRespone {
	Integer idPermission;

	String method;

	String endPoint;

	String type;

	boolean whiteList;
}
