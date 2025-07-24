package com.example.demo.dto.respone;

import java.util.HashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRespone {

	UserRespone user;
	
	Map<String, NovelBoughtRespone> novelBought=new HashMap<>();
}
