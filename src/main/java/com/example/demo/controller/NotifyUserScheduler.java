package com.example.demo.controller;

import java.util.Date;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.demo.entity.HistoryNotify;
import com.example.demo.repository.IHistoryNotifyRepository;
import com.example.demo.service.NovelService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotifyUserScheduler {

	SimpMessagingTemplate messagingTemplate;
//	NovelService novelService;
	IHistoryNotifyRepository historyNotifyRepository;

	@Scheduled(fixedRate = 60000) // every 60 seconds
	public void remindUsersOfTasks() {
		List<HistoryNotify> historyNotifies = historyNotifyRepository.findByIsNotifyFalse();
		for (HistoryNotify historyNotify : historyNotifies) {

			String email = historyNotify.getUser().getEmailUser();
			String message = "Truyện: " + historyNotify.getNameNovel() + "/nĐã ra thêm: "
					+ historyNotify.getTitleChapter();
			log.info("📤 Sending notify to user {} for new chapter {}", email, message);
			messagingTemplate.convertAndSendToUser(email, "/queue/notify", message);

			historyNotify.setIsNotify(true);
			historyNotify.setDateNotify(new Date());
			historyNotifyRepository.save(historyNotify);

		}

	}
}
