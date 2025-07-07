package com.example.demo.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.RequestParam;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ZaloPayRequest {
	String idUser;
    Integer amount;
//    Integer coin;
    Double voucher;
    String orderInfo;
}
