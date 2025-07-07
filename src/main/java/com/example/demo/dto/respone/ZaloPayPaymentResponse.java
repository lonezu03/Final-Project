package com.example.demo.dto.respone;

import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ZaloPayPaymentResponse {
    private Map<String, JsonNode> zaloPayResponse;
	private String historyDepositId;
}
