package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.ChapterAndPriceRequest;
import com.example.demo.dto.request.HistoryDepositCreationRequest;
import com.example.demo.dto.request.TransactionCreationRequest;
import com.example.demo.dto.respone.TransactionRespone;
import com.example.demo.dto.respone.ChapterBoughtRespone;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.Transaction;
import com.example.demo.entity.User;
import com.example.demo.enums.Status;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;
import com.example.demo.enums.TypeTransaction;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IHistoryDepositMapper;
import com.example.demo.mapper.ITransactionMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.IHistoryDepositRepository;
import com.example.demo.repository.ITransactionRepository;
import com.example.demo.repository.IUserRepository;
import com.example.demo.mapper.IUserMapper;
import com.example.demo.dto.respone.NovelBoughtRespone;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TransactionService {

	ITransactionMapper transactionMapper;
	ITransactionRepository transactionRepository;
	IUserRepository userRepository;
	IChapterRepository chapterRepository;
	IHistoryDepositRepository historyDepositRepository;
	IHistoryDepositMapper historyDepositMapper;
	IUserMapper userMapper;

	public List<TransactionRespone> getAllTransactionByUser(StatusDeposit status) {
		List<TransactionRespone> transactionRespones = new ArrayList<>();
		List<User> users = userRepository.findAll();
		if (users != null && !users.isEmpty()) {
			for (User user : users) {
				TransactionRespone transactionRespone = getTransactionByUser(user.getIdUser(), status);
				transactionRespones.add(transactionRespone);
			}
		}
		return transactionRespones;
	}

	public TransactionRespone getTransactionByUser(String idUser, StatusDeposit status) {

		User user = userRepository.findById(idUser).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		TransactionRespone transactionRespone = new TransactionRespone();

		transactionRespone.setUser(userMapper.toUserRespone(user));

		List<Transaction> transactions = transactionRepository.findByUser_IdUserAndStatusDeposit(idUser, status);
		for (Transaction transac : transactions) {
			String idNovel = transac.getChapter().getNovel().getIdNovel();

			NovelBoughtRespone novel = transactionRespone.getNovelBought().get(idNovel);
			if (novel == null) {
				novel = new NovelBoughtRespone();
				novel.setIdNovel(transac.getChapter().getNovel().getIdNovel());
				novel.setDescriptionNovel(transac.getChapter().getNovel().getDescriptionNovel());
				novel.setStatusNovel(transac.getChapter().getNovel().getStatusNovel());
				novel.setNameNovel(transac.getChapter().getNovel().getNameNovel());
				novel.setImageNovel(transac.getChapter().getNovel().getImageNovel());

				transactionRespone.getNovelBought().put(idNovel, novel);
			}

			ChapterBoughtRespone chapterBoughtRespone = new ChapterBoughtRespone();
			chapterBoughtRespone.setIdChapter(transac.getChapter().getIdChapter());
			chapterBoughtRespone.setIndexChapter(transac.getChapter().getIndexChapter());
			chapterBoughtRespone.setTitleChapter(transac.getChapter().getTitleChapter());
			chapterBoughtRespone.setDateBuy(transac.getDateBuy());
			chapterBoughtRespone.setDayRentAmount(transac.getDateEndRent());

			novel.getChapterBoughtRespone().add(chapterBoughtRespone);

		}

		return transactionRespone;
	}

	@Transactional
	public boolean createTransactions(String userId, TransactionCreationRequest request) {
		try {
			User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

			List<Transaction> transactions = new ArrayList<>();
			List<HistoryDeposit> historyDeposits = new ArrayList<>();

			for (ChapterAndPriceRequest chap : request.getChapterAndPrice()) {

					Chapter chapter = chapterRepository.findById(chap.getIdChapter())
							.orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));

					Transaction transaction = Transaction.builder().user(user).chapter(chapter)
							.dateBuy(LocalDateTime.now()).dateEndRent(request.getDateEndRent())
							.amountCoin(chap.getCoin()).statusDeposit(StatusDeposit.PENDING)
							.typeTransaction(request.getTypeTransaction()).build();

					transactions.add(transaction);

					TypeDeposit typeDeposit;
					if (request.getTypeTransaction() == TypeTransaction.BUY) {
						typeDeposit = TypeDeposit.BUY_CHAPTER;
					} else if (request.getTypeTransaction() == TypeTransaction.RENT) {
						typeDeposit = TypeDeposit.RENT_CHAPTER;
					} else {
						throw new AppException(ErrorCode.INVALID_TRANSACTION_TYPE);
					}

					HistoryDepositCreationRequest historyRequest = HistoryDepositCreationRequest.builder()
							.amountDeposit(null).coinDeposit(chap.getCoin()).voucher(0.0)
							.statusDeposit(StatusDeposit.PENDING).typeDeposit(typeDeposit)
							.detail(generateDetail(typeDeposit, chapter.getTitleChapter())).idUser(userId).build();

					HistoryDeposit historyDeposit = historyDepositMapper.toHistoryDeposit(historyRequest);
					historyDeposit.setUser(user);
					historyDeposit.setDateCreate(LocalDateTime.now());
					historyDeposits.add(historyDeposit);
				}

				transactionRepository.saveAll(transactions);
				historyDepositRepository.saveAll(historyDeposits);
				return true;
			
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	@Transactional
	public boolean confirmTransactions(String userId, List<String> chapterIds) {
		try {
			User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

			List<Transaction> pendingTransactions = transactionRepository
					.findByUser_IdUserAndChapter_IdChapterInAndStatusDeposit(userId, chapterIds, StatusDeposit.PENDING);

			int totalCoinRequired = pendingTransactions.stream().mapToInt(Transaction::getAmountCoin).sum();

			if (user.getCoin() < totalCoinRequired) {
				throw new AppException(ErrorCode.USER_NOT_ENOUGH_COIN);
			}

			user.setCoin(user.getCoin() - totalCoinRequired);
			pendingTransactions.forEach(tr -> tr.setStatusDeposit(StatusDeposit.SUCCESS));
			log.info("Coin" + user.getCoin());
			List<HistoryDeposit> historyDeposits = historyDepositRepository
					.findByUser_IdUserAndDetailInAndStatusDeposit(userId, pendingTransactions.stream()
							.map(tr -> generateDetail(
									tr.getTypeTransaction() == TypeTransaction.BUY ? TypeDeposit.BUY_CHAPTER
											: TypeDeposit.RENT_CHAPTER,
									tr.getChapter().getTitleChapter()))
							.toList(), StatusDeposit.PENDING);

			historyDeposits.forEach(hd -> {
				hd.setStatusDeposit(StatusDeposit.SUCCESS);
				hd.setDateUpdate(LocalDateTime.now());
			});

			user = userRepository.save(user);
			log.info("Coin2" + user.getCoin());

			transactionRepository.saveAll(pendingTransactions);
			historyDepositRepository.saveAll(historyDeposits);
			return true;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	private String generateDetail(TypeDeposit typeDeposit, String chapterTitle) {
		return (typeDeposit == TypeDeposit.BUY_CHAPTER ? "Mua chương " : "Thuê chương ") + chapterTitle;
	}

}
