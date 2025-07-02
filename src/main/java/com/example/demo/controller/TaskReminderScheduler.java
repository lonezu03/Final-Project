//package com.example.demo.controller;
//
//import java.util.Date;
//import java.util.List;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.messaging.simp.SimpMessagingTemplate;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import tma.sample.entity.HistoryNotification;
//import tma.sample.entity.Task;
//import tma.sample.entity.User;
//import tma.sample.enumdata.Status;
//import tma.sample.repository.HistoryNotificationRepository;
//import tma.sample.repository.TaskRepository;
//
//@Component
//@RequiredArgsConstructor
//@Slf4j
//public class TaskReminderScheduler {
//
//	@Autowired
//	private TaskRepository taskRepository;
//
//	@Autowired
//	private SimpMessagingTemplate messagingTemplate;
//
//	@Autowired
//	private HistoryNotificationRepository historyNotificationRepository;
//
//	/**
//	 * Scheduled job that runs every 60 seconds to remind users of tasks
//	 * that are approaching their deadline.
//	 * 
//	 * Logic:
//	 * - Find tasks whose `remind_date` is in the past, status is not DONE,
//	 *   and have not been reminded yet.
//	 * - Send a WebSocket notification to the corresponding user.
//	 * - Save the notification into `HistoryNotification` table.
//	 * - Mark the task as reminded to avoid duplicate notifications.
//	 */
//	@Scheduled(fixedRate = 1000) // every 60 seconds
//	public void remindUsersOfTasks() {
//		Date now = new Date();
//		log.info("🔁 Running scheduled task reminder at {}", now);
//
//		// Retrieve tasks where remind_date has passed, status is not DONE, and not reminded
//		List<Task> tasksToRemind = taskRepository
//				.findByRemindDateBeforeAndStatusNotAndRemindedFalse(now, Status.DONE);
//
//		log.info("🔍 Found {} task(s) that need to be reminded", tasksToRemind.size());
//
//		for (Task task : tasksToRemind) {
//			User user = task.getUser();
//
//			// Skip task if user or user email is missing
//			if (user == null || user.getEmail() == null) {
//				log.warn("⚠️ Task {} has no associated user or email. Skipping.", task.getIdTask());
//				continue;
//			}
//
//			String email = user.getEmail();
//			String content = "🔔 Task \"" + task.getTitle() + "\" is nearing its deadline on " + task.getEnd_date();
//
//			// Send WebSocket notification to user
//			log.info("📤 Sending reminder to user {} for task {}", email, task.getTitle());
//			messagingTemplate.convertAndSendToUser(email, "/queue/notify", content);
//
//			// Create and save notification history record
//			HistoryNotification notification = new HistoryNotification();
//			notification.setContent(content);
//			notification.setUser(user);
//			notification.setProjectname(task.getProject().getName());
//			notification.setTaskname(task.getTitle());
//
//			// Save the notification to the database
//			historyNotificationRepository.save(notification);
//			log.info("💾 Saved history notification for user {}", email);
//
//			// Mark the task as reminded so we don't send again next time
//			task.setReminded(true);
//			taskRepository.save(task);
//			log.info("✅ Marked task '{}' as reminded", task.getTitle());
//		}
//
//		log.info("✅ Task reminder job completed.");
//	}
//}
