package com.example.demo.dto.respone;

import lombok.Builder;
import lombok.Data;

/**
 * Response object returned after a user successfully logs in
 * or refreshes their token.
 * Contains both Access Token and Refresh Token.
 */
@Data
@Builder
public class UserLoginRespone {

    /**
     * Access Token (JWT) used to authenticate subsequent requests.
     * This token has a short lifespan.
     */
    private String accessToken;

    /**
     * Refresh Token used to obtain a new Access Token when it expires.
     * This token has a longer lifespan.
     */
    private String refreshToken;
}
