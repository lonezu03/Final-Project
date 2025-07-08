package com.example.demo.service;

import com.example.demo.dto.request.HistoryDepositCreationRequest;
import com.example.demo.dto.request.ShippingOrderRequest;
import com.example.demo.dto.request.ZaloPayCallback;
import com.example.demo.dto.request.ZaloPayRequest;
import com.example.demo.dto.respone.HistoryDepositRespone;
import com.example.demo.dto.respone.ZaloPayPaymentResponse;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;
import com.example.demo.mapper.ZaloMapper;
import com.example.demo.repository.http.ZaloPayClient;
import com.example.demo.util.ZaloPayUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.NameValuePair;
import org.apache.http.message.BasicNameValuePair;
import org.cloudinary.json.JSONArray;
import org.cloudinary.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.RestTemplate;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ZaloPayService {
	ZaloMapper zaloMapper;
	ObjectMapper objectMapper;

	String ZALO_PAY_API_URL = "https://zlpdev-mi-zlpdemo.zalopay.vn/zlp-demo/v2/api/gateway";
	String APP_ID = "2553";
	String APP_KEY = "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL";
	String ZALO_PAY_SECRET_KEY = "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz";
	ZaloPayUtil zaloPayUtil;
	String key1 = "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL";
	String key2 = "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz";

	ZaloPayClient zaloPayClient;
	HistoryDepositService historyDepositService;

	public String getCurrentTimeString(String format) {
		Calendar cal = new GregorianCalendar(TimeZone.getTimeZone("GMT+7"));
		SimpleDateFormat fmt = new SimpleDateFormat(format);
		fmt.setCalendar(cal);
		return fmt.format(cal.getTimeInMillis());
	}

	public void checkCallback() {
		log.info("Log ra nè");
	}

	public void checkCallbackGet() {
		log.info("hihihihi");
	}

	// ResponseEntity<?>
	public ZaloPayPaymentResponse createPaymentOrderupdate(ZaloPayRequest user) throws JsonProcessingException {
		HttpHeaders headers = new HttpHeaders();
		headers.set("Content-Type", "application/x-www-form-urlencoded");

		String url = "https://webtruyen-e79mt48so-phan-thanh-vus-projects.vercel.app";

		int amount = user.getAmount();
		double voucherPercent = user.getVoucher() != null ? user.getVoucher() : 0.0;

		if (voucherPercent >= 100.0 || voucherPercent < 0.0) {
			throw new IllegalArgumentException("Voucher phần trăm không hợp lệ. Tối đa là 99.9%. Tối thiểu 0.0%");
		}

		double pricePerCoin = 1000 * (1 - voucherPercent / 100.0); // Giá 1 coin sau giảm
		int coinDeposit = (int) (amount / pricePerCoin);

		log.info("💰 Tính được coinDeposit = {}", coinDeposit);

		HistoryDepositCreationRequest request = HistoryDepositCreationRequest.builder().amountDeposit(amount)
				.coinDeposit(coinDeposit).voucher(user.getVoucher())
				.idUser(user.getIdUser()).statusDeposit(StatusDeposit.PENDING).typeDeposit(TypeDeposit.BUY_COIN)
				.detail(user.getOrderInfo()).build();

		HistoryDepositRespone depositRespone = historyDepositService.createHistoryDeposit(request);

		// Tạo embed_data JSON
		JSONObject embedData = new JSONObject();
		String redirectUrl = url + "/payment/callback-success?idHistoryDeposit="
				+ depositRespone.getIdHistoryDeposit();
		embedData.put("redirecturl", redirectUrl);

		embedData.put("callbackurl",
				url + "/api/payment/call");

		String embedDataStr = embedData.toString();
		log.info("📦 embed_data gửi đi: {}", embedDataStr);
		MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
		map.add("app_id", "2553");
		map.add("key1", key1);
		map.add("key2", key2);
		map.add("amount", user.getAmount() + "");
		map.add("app_user", "NovelWebsiteDemo");
		map.add("embed_data", embedDataStr);
		map.add("item",
				"[{\"itemid\":\"knb\",\"itemname\":\"kim nguyen bao\",\"itemprice\":198400,\"itemquantity\":1}]");
		map.add("description", user.getOrderInfo());
		map.add("more_param", "currency=VND&phone=0925226173");
		map.add("bankcode", "zalopayapp");
		String randum = String.valueOf(Math.random() * 1000000000);
		StringBuilder builder = new StringBuilder();
		builder.append("250411");
		builder.append("_");
		builder.append(randum);
		String data = "app_id=" + "2553" + "&app_trans_id=" + builder.toString() + "&..."; // Include other parameters
																							// here

		// Generate MAC
		String mac = zaloPayUtil.HMacHexStringEncode(zaloPayUtil.HMACSHA256, "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL", data);
		map.add("mac", mac);

		HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);

		RestTemplate restTemplate = new RestTemplate();
		ResponseEntity<?> response = restTemplate.exchange(
				"https://zlpdev-mi-zlpdemo.zalopay.vn/zlp-demo/v2/api/gateway", HttpMethod.POST, entity, String.class);

		// Parse response.getBody() từ String sang JsonNode
		ObjectMapper objectMapper = new ObjectMapper();
		JsonNode rootNode = objectMapper.readTree(response.getBody().toString());

		// Parse tiếp request_data và response_data vì chúng là chuỗi JSON lồng trong
		JsonNode requestData = objectMapper.readTree(rootNode.get("request_data").asText());
		JsonNode responseData = objectMapper.readTree(rootNode.get("response_data").asText());

		// Gộp vào 1 Map hoặc Object tùy bạn
		Map<String, JsonNode> zaloPayResponseMap = new HashMap<>();
		zaloPayResponseMap.put("request_data", requestData);
		zaloPayResponseMap.put("response_data", responseData);

		// Trả về cả phản hồi ZaloPay và id lịch sử
		ZaloPayPaymentResponse result = new ZaloPayPaymentResponse(zaloPayResponseMap,
				depositRespone.getIdHistoryDeposit());

		return result;
	}

	// public String createPaymentOrder(@RequestBody ZaloPayRequest request) throws
	// JsonProcessingException {
	// ResponseEntity<?> responseEntity =createPaymentOrderupdate(request);
	//
	// JsonNode rootNode =
	// objectMapper.readTree(responseEntity.getBody().toString());
	//
	// String responseDataString = rootNode.get("response_data").asText();
	//
	// ZaloPayResponseData responseData = objectMapper.readValue(responseDataString,
	// ZaloPayResponseData.class);
	//
	// System.out.println("Mã giao dịch: " + responseData.getZp_trans_token());
	// System.out.println("Link thanh toán: " + responseData.getOrder_url());
	//
	//
	// return responseData.getOrder_url();
	// }

}
