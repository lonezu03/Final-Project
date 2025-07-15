package com.example.demo.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;

@RestController
public class UptimeController {
	@RequestMapping(value = "/", method = RequestMethod.HEAD)
	public void head(HttpServletResponse response) {
	    response.setStatus(HttpServletResponse.SC_OK);
	}
}
