package com.example.demo.controller;

import com.example.demo.dto.request.ShippingOrderRequest;
import com.example.demo.dto.request.ZaloPayCallback;
import com.example.demo.dto.request.ZaloPayRequest;
import com.example.demo.dto.request.ZaloPayWrapperRequest;
import com.example.demo.dto.respone.ZaloPayPaymentResponse;
import com.example.demo.dto.respone.ZaloPayResponseData;
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
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

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

	@PostMapping("/call")
	public ResponseEntity<String> handleZaloPayCallback(@RequestBody Map<String, Object> payload) {
//		log.info("✅ Redirect sau thanh toán từ ZaloPay");
//
//		return ResponseEntity.ok("Thanh toán ZaloPay thành công! Cảm ơn bạn.");
		
		log.info("✅ Nhận callback từ ZaloPay: {}", payload);

	    // (Optional) Xác minh MAC nếu ZaloPay gửi kèm
	    // String mac = (String) payload.get("mac");
	    // Verify MAC here if needed

	    // Xử lý logic cập nhật trạng thái đơn hàng tại đây, ví dụ:
	    String appTransId = (String) payload.get("app_trans_id");
	    String returnCode = (String) payload.get("return_code");

	    if ("1".equals(returnCode)) {
	        log.info("✅ Thanh toán thành công cho giao dịch {}", appTransId);
	        // Update DB, gửi thông báo, v.v.
	    } else {
	        log.warn("❌ Thanh toán thất bại, return_code={}", returnCode);
	    }

	    // ZaloPay yêu cầu trả về JSON có key "return_code"
	    return ResponseEntity.ok("{\"return_code\": 1}");

	}

	@GetMapping("/callback-success")
	public ResponseEntity<String> handleRedirectAfterPayment(@RequestParam("idHistoryDeposit") String idHistoryDeposit) {
	    log.info("✅ Redirect sau thanh toán từ ZaloPay. ID lịch sử: {}", idHistoryDeposit);

	    // Tùy logic của bạn: có thể load thêm thông tin giao dịch từ DB nếu cần
	    return ResponseEntity.ok("Thanh toán thành công! Mã lịch sử nạp: " + idHistoryDeposit);
	}


	// @RequestParam("embed_data") String embedDataStr
	// @GetMapping("/callback")
	// public ResponseEntity<?> handleCallback(@RequestParam("shipping_order")
	// String shippingOrderStr) {
	// try {
	// String decoded = URLDecoder.decode(shippingOrderStr, StandardCharsets.UTF_8);
	// ShippingOrderRequest request = objectMapper.readValue(decoded,
	// ShippingOrderRequest.class);
	// log.info(request.toString());
	// // Gửi sang GHN
	// ResponseEntity<?> ghnRes = shipping.createOrder(request);
	// return ResponseEntity.ok("Tạo đơn GHN thành công: " + ghnRes.getBody());
	// } catch (Exception e) {
	// e.printStackTrace();
	// return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi: " +
	// e.getMessage());
	// }
	// }

	@GetMapping("/call")
	public void handleCallback() {
		zaloPayService.checkCallback();
	}
}
