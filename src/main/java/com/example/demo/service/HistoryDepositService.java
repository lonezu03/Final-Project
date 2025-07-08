package com.example.demo.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.HistoryDepositCreationRequest;
import com.example.demo.dto.respone.HistoryDepositRespone;
import com.example.demo.entity.HistoryDeposit;
import com.example.demo.entity.User;
import com.example.demo.enums.StatusDeposit;
import com.example.demo.enums.TypeDeposit;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IHistoryDepositMapper;
import com.example.demo.repository.IHistoryDepositRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HistoryDepositService {
	IHistoryDepositMapper historyDepositMapper;
	
	IHistoryDepositRepository historyDepositRepository;
	IUserRepository userRepository;
	

	List<HistoryDepositRespone> getAllHistoryDepositByUser(String idUser){
		User user=userRepository.findById(idUser).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		return historyDepositRepository.findByUser(user).stream().map(t -> historyDepositMapper.toHistoryDepositRespone(t)).collect(Collectors.toList());
	}
	
	HistoryDepositRespone createHistoryDeposit(HistoryDepositCreationRequest request) {
		User user=userRepository.findById(request.getIdUser()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		HistoryDeposit historyDeposit=historyDepositMapper.toHistoryDeposit(request);
		
		historyDeposit.setUser(user);
		historyDeposit.setDateCreate(LocalDateTime.now());
		historyDeposit=historyDepositRepository.save(historyDeposit);
		
		return historyDepositMapper.toHistoryDepositRespone(historyDeposit);
	}
	
	public HistoryDepositRespone updateHistoryDeposit(String idHistoryDeposit,StatusDeposit statusDeposit) {
		HistoryDeposit historyDeposit= historyDepositRepository.findById(idHistoryDeposit).orElseThrow(() -> new AppException(ErrorCode.DEPOSIT_NOT_EXISTS));
		historyDeposit.setStatusDeposit(statusDeposit);
		historyDeposit.setDateUpdate(LocalDateTime.now());
		
		if (statusDeposit==StatusDeposit.SUCCESS) {
			User user=userRepository.findById(historyDeposit.getUser().getIdUser()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

			if (historyDeposit.getTypeDeposit()==TypeDeposit.BUY_COIN ) {
				user.setCoin(user.getCoin()+historyDeposit.getCoinDeposit());
				user=userRepository.save(user);
			}else {
				user.setCoin(user.getCoin()-historyDeposit.getCoinDeposit());
				user=userRepository.save(user);
			}
		}
		
		
		
		historyDeposit=historyDepositRepository.save(historyDeposit);
		
		return historyDepositMapper.toHistoryDepositRespone(historyDeposit);
	}
	
	
	
	
	
	
	
	
	
	
}
