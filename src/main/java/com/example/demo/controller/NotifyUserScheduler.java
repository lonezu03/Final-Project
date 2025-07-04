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
/**
 * Hàm được lên lịch để chạy mỗi 60 giây nhằm gửi thông báo chương mới cho người dùng.
 * 
 * - Tìm tất cả các bản ghi `HistoryNotify` có trường `isNotify = false`
 * - Gửi thông báo qua WebSocket tới từng người dùng (dựa theo email)
 * - Sau khi gửi xong, cập nhật lại bản ghi là đã thông báo và lưu thời gian gửi
 */
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

//	@Scheduled(fixedRate = 1000) // every 60 seconds
//	public void testWebsocket() {
//		log.info("thông báo nè");
////		log.info("📤 Sending notify to user {} for new chapter {}", , );
//		messagingTemplate.convertAndSendToUser("truongthaiduong0808@gmail.com", "/queue/notify", "ok chưa");
//
//	}
}
