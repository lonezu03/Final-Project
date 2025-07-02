package com.example.demo.util;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Service used to send notifications via WebSocket to a specific user or broadcast to all users.
 * 
 * Uses `SimpMessagingTemplate` to send messages to destinations registered with STOMP.
 */
@Component
@RequiredArgsConstructor
public class WebSocketNotificationSender {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Sends a notification to a specific user via WebSocket.
     * 
     * @param username the user's name (based on Spring Security Principal or header)
     * @param message the notification content to send
     * 
     * The client must subscribe to `/user/queue/notify`
     */
    public void sendNotificationToUser(String username, String message) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notify", message);
    }

    /**
     * Broadcasts a notification to all users listening on the `/topic/global` channel.
     * 
     * @param message the content of the broadcast notification
     */
    public void sendBroadcast(String message) {
        messagingTemplate.convertAndSend("/topic/global", message);
    }
}
