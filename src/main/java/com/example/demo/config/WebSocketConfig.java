package com.example.demo.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import lombok.RequiredArgsConstructor;

/**
 * WebSocket configuration using STOMP for the application.
 * 
 * This class enables WebSocket and configures:
 * - the message broker for sending/receiving messages
 * - the endpoints that clients will connect to
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

	private final JwtUtils jwtUtils;

	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		config.enableSimpleBroker("/queue", "/topic");
		config.setApplicationDestinationPrefixes("/app");
		config.setUserDestinationPrefix("/user");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(new ChannelInterceptor() {

			@Override
			public Message<?> preSend(Message<?> message, MessageChannel channel) {
				StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
				if (StompCommand.CONNECT.equals(accessor.getCommand())) {
					String token = accessor.getFirstNativeHeader("Authorization");
					// check done
					if (token != null && token.startsWith("Bearer ")) {
						token = token.substring(7);
						if (jwtUtils.validateToken(token)) {
							String email = jwtUtils.getUsernameFromToken(token);
							logger.info("🟢 WebSocket user registered: " + email); // ✅ Log here
							accessor.setUser(new UsernamePasswordAuthenticationToken(email, null, List.of()));
						} else {
							logger.error("❌ Invalid token!");
						}
					} else {
						logger.error("⚠️ Authorization header not found.");
					}
				}
				return message;
			}
		});
	}
}
