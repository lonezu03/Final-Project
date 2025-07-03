// NotificationWebSocket.js
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";
import { rooturl } from "./element";
const NotificationWebSocket = ({ token, onMessage }) => {
  const stompClientRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new SockJS(`${rooturl}/ws`); // Thay đổi nếu BE bạn chạy cổng khác
      const stompClient = Stomp.over(socket);

      stompClient.connect(
        {
          Authorization: `Bearer ${token}`,
        },
        (frame) => {
          console.log("✅ Connected: " + frame);

          // Subscribe đến /user/queue/notify
          stompClient.subscribe("/user/queue/notify", (message) => {
            console.log("📨 Message received:", message.body);
            if (onMessage) {
              onMessage(message.body);
            }
          });
        },
        (error) => {
          console.error("❌ STOMP error", error);
        }
      );

      stompClientRef.current = stompClient;
    };

    if (token) {
      connectWebSocket();
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect(() => {
          console.log("🛑 WebSocket disconnected");
        });
      }
    };
  }, [token, onMessage]);

  return null; // Component này chỉ quản lý kết nối
};

export default NotificationWebSocket;