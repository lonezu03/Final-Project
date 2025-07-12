package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.HistoryDepositCreationRequest;
import com.example.demo.dto.request.TransactionCreationRequest;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.Transaction;
import com.example.demo.entity.User;
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

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TransactionService {

	ITransactionMapper transactionMapper;
	ITransactionRepository transactionRepository;
	IUserRepository userRepository;
	IChapterRepository chapterRepository;
	IHistoryDepositRepository historyDepositRepository;
	IHistoryDepositMapper historyDepositMapper;
	@Transactional
	public boolean createTransactions(String userId, TransactionCreationRequest request) {
	    try {
	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

	        List<Transaction> transactions = new ArrayList<>();
	        List<HistoryDeposit> historyDeposits = new ArrayList<>();

	        for (String chapterId : request.getIdChapters()) {
	            Chapter chapter = chapterRepository.findById(chapterId)
	                    .orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));

	            Transaction transaction = Transaction.builder()
	                    .user(user)
	                    .chapter(chapter)
	                    .dateBuy(LocalDateTime.now())
	                    .dateEndRent(request.getDateEndRent())
	                    .amountCoin(request.getAmountCoin())
	                    .statusDeposit(StatusDeposit.PENDING)
	                    .typeTransaction(request.getTypeTransaction())
	                    .build();

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
	                    .amountDeposit(null)
	                    .coinDeposit(request.getAmountCoin())
	                    .voucher(0.0)
	                    .statusDeposit(StatusDeposit.PENDING)
	                    .typeDeposit(typeDeposit)
	                    .detail(generateDetail(typeDeposit, chapter.getTitleChapter()))
	                    .idUser(userId)
	                    .build();

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
	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

	        List<Transaction> pendingTransactions = transactionRepository
	                .findByUser_IdUserAndChapter_IdChapterInAndStatusDeposit(userId, chapterIds, StatusDeposit.PENDING);

	        int totalCoinRequired = pendingTransactions.stream()
	                .mapToInt(Transaction::getAmountCoin)
	                .sum();

	        if (user.getCoin() < totalCoinRequired) {
	            throw new AppException(ErrorCode.USER_NOT_ENOUGH_COIN);
	        }

	        user.setCoin(user.getCoin() - totalCoinRequired);
	        pendingTransactions.forEach(tr -> tr.setStatusDeposit(StatusDeposit.SUCCESS));

	        List<HistoryDeposit> historyDeposits = historyDepositRepository
	                .findByUser_IdUserAndDetailInAndStatusDeposit(
	                        userId,
	                        pendingTransactions.stream()
	                                .map(tr -> generateDetail(
	                                        tr.getTypeTransaction() == TypeTransaction.BUY
	                                                ? TypeDeposit.BUY_CHAPTER
	                                                : TypeDeposit.RENT_CHAPTER,
	                                        tr.getChapter().getTitleChapter()))
	                                .toList(),
	                        StatusDeposit.PENDING
	                );

	        historyDeposits.forEach(hd -> {
	        	hd.setStatusDeposit(StatusDeposit.SUCCESS);
	        	hd.setDateUpdate(LocalDateTime.now());
	        });

	        userRepository.save(user);
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
