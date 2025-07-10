package com.example.demo.controller;

import com.example.demo.dto.request.ShippingOrderRequest;
import com.example.demo.dto.request.ZaloPayCallback;
import com.example.demo.dto.request.ZaloPayRequest;
import com.example.demo.dto.request.ZaloPayWrapperRequest;
import com.example.demo.dto.respone.ZaloPayPaymentResponse;
import com.example.demo.dto.respone.ZaloPayResponseData;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.service.HistoryDepositService;
import com.example.demo.service.ZaloPayService;
import com.example.demo.util.ZaloPayUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.io.UnsupportedEncodingException;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.net.URI;

import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ZaloPayController {
	ZaloPayService zaloPayService;
	ObjectMapper objectMapper;
	HistoryDepositService historyDepositService;
//	Shipping shipping;
	/**
	 * Tạo đơn hàng thanh toán qua ZaloPay và trả về URL thanh toán.
	 *
	 * @param request Thông tin yêu cầu thanh toán từ client (bao gồm thông tin đơn
	 *                hàng, số tiền, mô tả,...).
	 * @return Đường dẫn (URL) để người dùng thực hiện thanh toán qua ZaloPay.
	 * @throws JsonProcessingException      Nếu xảy ra lỗi khi xử lý JSON.
	 * @throws UnsupportedEncodingException Nếu xảy ra lỗi khi giải mã chuỗi.
	 */
	@PostMapping("/create")
	public ZaloPayPaymentResponse createPaymentOrder(@RequestBody ZaloPayRequest request)
			throws JsonProcessingException, UnsupportedEncodingException {

		ZaloPayPaymentResponse responseEntity = zaloPayService.createPaymentOrderupdate(request);

		return responseEntity;
	}

	@PostMapping("/callbackk")
	public void callbackZaloPay() {
		zaloPayService.checkCallback();
	}

	@GetMapping("/callback")
	public ResponseEntity<Void> handleRedirectAfterPayment(@RequestParam String idHistoryDeposit) {
		log.info("✅ Redirect sau thanh toán từ ZaloPay. ID lịch sử: {}", idHistoryDeposit);
		historyDepositService.updateHistoryDeposit(idHistoryDeposit, StatusDeposit.SUCCESS);
		// Redirect đến trang thành công của frontend
		URI redirectUri = URI.create("https://webtruyen-git-fontend-phan-thanh-vus-projects.vercel.app/payment/callback-success");
		HttpHeaders headers = new HttpHeaders();
		headers.setLocation(redirectUri);

		return new ResponseEntity<>(headers, HttpStatus.FOUND); // 302 redirect
	}

}
