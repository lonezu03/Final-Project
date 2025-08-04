package com.example.demo.controller;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Category;
import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.HistoryNotify;
import com.example.demo.entity.Novel;
import com.example.demo.entity.Transaction;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.repository.ICategoryRepository;
import com.example.demo.repository.IHistoryDepositRepository;
import com.example.demo.repository.IHistoryNotifyRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.ITransactionRepository;
import com.example.demo.service.HistoryDepositService;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotifyUserScheduler {

	SimpMessagingTemplate messagingTemplate;
	// NovelService novelService;
	IHistoryNotifyRepository historyNotifyRepository;
	ITransactionRepository transactionRepository;
	IHistoryDepositRepository historyDepositRepository;
	HistoryDepositService historyDepositService;
	INovelRepository novelRepository;
//	NovelService novelService;
	ICategoryRepository categoryRepository;
	private static final Logger logger = LoggerFactory.getLogger(NotifyUserScheduler.class);

	/**
	 * Hàm được lên lịch để chạy mỗi 60 giây nhằm gửi thông báo chương mới cho người
	 * dùng.
	 *
	 * - Tìm tất cả các bản ghi `HistoryNotify` có trường `isNotify = false` - Gửi
	 * thông báo qua WebSocket tới từng người dùng (dựa theo email) - Sau khi gửi
	 * xong, cập nhật lại bản ghi là đã thông báo và lưu thời gian gửi
	 */
	@Scheduled(fixedRate = 3600000)
	public void remindUsersOfTasks() {
		List<HistoryNotify> historyNotifies = historyNotifyRepository.findByIsNotifyFalse();
		for (HistoryNotify historyNotify : historyNotifies) {

			String email = historyNotify.getUser().getEmailUser();
			String message = "Truyện: " + historyNotify.getNameNovel() + "/nĐã ra thêm: "
					+ historyNotify.getTitleChapter();
			logger.info("📤 Sending notify to user {} for new chapter {}", email, message);
			messagingTemplate.convertAndSendToUser(email, "/queue/notify", message);

			historyNotify.setIsNotify(true);
			historyNotify.setDateNotify(new Date());
			historyNotifyRepository.save(historyNotify);

		}
	}

	@Transactional
	@Scheduled(fixedRate = 10000)
	public void updateNovel() {
//    	logger.info("Start updateNovel scheduled task");

		List<Novel> novels = novelRepository.findAll();
//        logger.info("Fetched {} novels from the database", novels.size());

		Category category = categoryRepository.findByNameCategory("Truyện Convert");
		Category category2 = categoryRepository.findByNameCategory("Truyện Dịch");

		if (category == null || category2 == null) {
			logger.info("One or both categories not found: Truyện Convert={}, Truyện Dịch={}", category != null,
					category2 != null);
			return;
		}

		List<Novel> novelsToUpdate = new ArrayList<>();

		for (Novel novel : novels) {
			if (novel.getCategories() != null && !novel.getCategories().isEmpty()) {
				boolean hasConvert = novel.getCategories().contains(category);
				boolean hasDich = novel.getCategories().contains(category2);

//				logger.info("Novel ID={} - hasConvert={}, hasDich={}", novel.getIdNovel(), hasConvert, hasDich);

				if (!hasConvert && !hasDich) {
					novel.getCategories().add(category);
					novelsToUpdate.add(novel);
					logger.info("Added 'Truyện Convert' to novel ID={}", novel.getIdNovel());
				}
			} else {
				logger.info("Novel ID={} has null or empty categories", novel.getIdNovel());
				novel.getCategories().add(category);
				novelsToUpdate.add(novel);
			}
		}

		if (!novelsToUpdate.isEmpty()) {
			novelRepository.saveAll(novelsToUpdate);
			logger.info("Updated {} novels with new category", novelsToUpdate.size());
		} else {
        	logger.info("No novels needed updating");
		}

        logger.info("Finished updateNovel scheduled task");
	}

	@Scheduled(fixedRate = 60000) // every 60 seconds
	public void deletePending() {
		List<Transaction> transactions = transactionRepository.findAll();
		for (Transaction transaction : transactions) {
			long daysBetween = ChronoUnit.MINUTES.between(transaction.getDateBuy(), LocalDateTime.now());
			if (transaction.getStatusDeposit() == StatusDeposit.PENDING && daysBetween > 3) {
				logger.info("Find transaction start delete: " + transaction.getIdTransaction());
				transactionRepository.deleteById(transaction.getIdTransaction());
			}
		}
		List<HistoryDeposit> historyDeposits = historyDepositRepository.findAll();
		for (HistoryDeposit historyDeposit : historyDeposits) {
			long daysBetween = ChronoUnit.MINUTES.between(historyDeposit.getDateCreate(), LocalDateTime.now());
			if (historyDeposit.getStatusDeposit() == StatusDeposit.PENDING && daysBetween > 3) {
				logger.info("Find history deposit start delete: " + historyDeposit.getIdHistoryDeposit());
				historyDepositService.updateHistoryDeposit(historyDeposit.getIdHistoryDeposit(), StatusDeposit.FAILED);
			}
		}
	}

	// @Scheduled(fixedRate = 1000) // every 60 seconds
	// public void testWebsocket() {
	// log.info("thông báo nè");
	//// log.info("📤 Sending notify to user {} for new chapter {}", , );
	// messagingTemplate.convertAndSendToUser("truongthaiduong0808@gmail.com",
	// "/queue/notify", "ok chưa");
	//
	// }

	// @Scheduled(fixedRate = 1000) 
	// public void testWebsocket() {
//		logger.info("thông báo nè");
		// log.info("📤 Sending notify to user {} for new chapter {}", , );
//     messagingTemplate.convertAndSendToUser("truongthaiduong0808@gmail.com","/queue/notify", "Thấy ko Dương"); // gửi thông báo cụ thể
    
     
//		messagingTemplate.convertAndSend("/topic/global", "ok chưa"); //thông báo tổng toàn bộ

	// }
}
