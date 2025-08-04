import React, { useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function AdminReportListener({ onNewReport }) {
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('⚠️ No auth token found, skipping WebSocket connection');
      return;
    }

    let stompClient = null;
    let reconnectTimeout;
    let isReconnecting = false;

    const connect = () => {
      try {
        console.log('🔄 Attempting to connect to WebSocket with SockJS...');
        
        // Tạo SockJS connection
        const socket = new SockJS('https://truongthaiduongphanthanhvu.onrender.com/ws');
        stompClient = Stomp.over(socket);

        // Configure STOMP client
        stompClient.configure({
          connectHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        // Connect callbacks
        stompClient.onConnect = (frame) => {
          // console.log('✅ Connected to STOMP WebSocket:', frame);
          isReconnecting = false;
          
          // Subscribe to admin report topic
          stompClient.subscribe('/topic/admin/reports', (message) => {
            try {
              const reportData = JSON.parse(message.body);
              // console.log('📩 New report received from topic:', reportData);
              if (onNewReport) {
                onNewReport(reportData);
              }
            } catch (error) {
              // console.error('❌ Error parsing report message:', error);
            }
          });

          // Subscribe to user-specific queue (theo yêu cầu backend)
          stompClient.subscribe('/user/queue/report', (message) => {
            try {
              const reportData = JSON.parse(message.body);
              // console.log('📩 Personal report received from queue:', reportData);
              if (onNewReport) {
                onNewReport(reportData);
              }
            } catch (error) {
              // console.error('❌ Error parsing personal report message:', error);
            }
          });

          // Subscribe to general notifications
          stompClient.subscribe('/topic/admin/notifications', (message) => {
            try {
              const notificationData = JSON.parse(message.body);
              // console.log('🔔 New notification received:', notificationData);
              if (onNewReport) {
                onNewReport(notificationData);
              }
            } catch (error) {
              console.error('❌ Error parsing notification message:', error);
            }
          });
        };

        stompClient.onStompError = (frame) => {
          console.error('❌ STOMP error:', frame);
          if (!isReconnecting) {
            scheduleReconnect();
          }
        };

        stompClient.onWebSocketClose = () => {
          // console.log('👋 WebSocket connection closed');
          if (!isReconnecting) {
            scheduleReconnect();
          }
        };

        stompClient.onWebSocketError = (error) => {
          // console.error('❌ WebSocket error:', error);
        };

        // Activate the STOMP client
        stompClient.activate();

      } catch (error) {
        // console.error('❌ Failed to create STOMP connection:', error);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      if (!isReconnecting) {
        isReconnecting = true;
        // console.log('🔄 Scheduling reconnect in 5 seconds...');
        reconnectTimeout = setTimeout(() => {
          isReconnecting = false;
          connect();
        }, 5000);
      }
    };

    // Bắt đầu kết nối
    connect();

    // Cleanup function
    return () => {
      // console.log('🧹 Cleaning up WebSocket connection...');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
        // console.log('👋 STOMP disconnected cleanly');
      }
    };
  }, [onNewReport]);

  return null; // Component này chỉ để lắng nghe, không render gì
}

export default AdminReportListener;
