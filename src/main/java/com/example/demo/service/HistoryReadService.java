package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.respone.HistoryReadRespone;
import com.example.demo.entity.HistoryId;
import com.example.demo.mapper.IHistoryReadMapper;
import com.example.demo.repository.IHistoryReadRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class HistoryReadService {

	IHistoryReadRepository historyReadRepository;
	IUserRepository userRepository;
	IHistoryReadMapper historyReadMapper;
	/**
 * Xóa một bản ghi lịch sử đọc dựa trên ID của người dùng và truyện.
 *
 * @param historyId ID bao gồm idUser và idNovel
 * @return Chuỗi xác nhận đã xóa, gồm idNovel và idUser
 */
	public String deleteHistoryRead(HistoryId historyId) {
		historyReadRepository.deleteById(historyId);
		return historyId.getIdNovel()+" "+historyId.getIdUser();
	}
	
/**
 * Lấy danh sách lịch sử đọc của người dùng, kèm thông tin tên và ảnh truyện.
 *
 * @param idUser ID của người dùng
 * @return Danh sách các HistoryReadRespone tương ứng
 */
	public List<HistoryReadRespone> getHistoryRead(String idUser) {
		return historyReadRepository.findByIDUser(idUser).stream().map(t -> {
		
			HistoryReadRespone historyReadRespone=historyReadMapper.toHistoryReadRespone(t);
			historyReadRespone.setNameNovel(t.getNovel().getNameNovel());
			historyReadRespone.setUrlNovel(t.getNovel().getImageNovel());
			return historyReadRespone;
		}).toList(); 
		
	}

}
