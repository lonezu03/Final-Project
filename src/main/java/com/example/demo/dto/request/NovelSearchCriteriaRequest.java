package com.example.demo.dto.request;

import java.util.List;

import com.example.demo.enums.StringOperator;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NovelSearchCriteriaRequest {
	 // Tương ứng với hasName và hasSimilarName
    private String nameNovel;
    private StringOperator nameOperator;

    // (Giả sử bạn cũng có các Specification tương tự cho description)
    // private String descriptionNovel;
    // private StringOperator descriptionOperator;

    // Tương ứng với ratingGreaterThanOrEqual
    private Double ratingGreaterThanOrEqual;

    // Tương ứng với totalChapterGreaterThan
    private Integer totalChapterGreaterThan;
    
    // Tương ứng với totalChapterLessThan
    private Integer totalChapterLessThan;

    // Tương ứng với hasStatusIn
    // Lưu ý: Kiểu dữ liệu nên là String để khớp với Specification
    private List<String> statuses;

    //Dùng để kiểm tra người dùng đang follow truyện nào
    private String idUser;
    
    private Boolean isDelete; 
     
    // Tương ứng với byAuthorIds (đã sửa thành lọc theo tên)
    // Tên trường nên là nameAuthors hoặc authorNames để rõ nghĩa
    private List<String> authorNames;

    // Tương ứng với byCategoryNames
    private List<String> categoryNames;
}
