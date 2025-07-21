package com.example.demo.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserForgotPasswordRequest {

	private String idUser;
	private String password;
}
