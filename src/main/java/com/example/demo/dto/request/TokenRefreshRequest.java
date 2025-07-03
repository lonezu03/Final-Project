package com.example.demo.dto.request;

import lombok.Data;

/**
 * Object containing data for a request to refresh an Access Token.
 * Used as the Request Body when the old Access Token has expired.
 */
@Data
public class TokenRefreshRequest {

    /**
     * A valid Refresh Token received by the user during login.
     * This token will be verified before issuing a new Access Token.
     */
    private String refreshToken;
}
