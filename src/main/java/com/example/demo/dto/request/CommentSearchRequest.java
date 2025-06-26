package com.example.demo.dto.request;

import com.example.demo.enums.StringOperator;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentSearchRequest {

    // 1. Tìm theo nội dung comment
    private String content;
    private StringOperator contentOperator; // Dùng enum EQUALS hoặc CONTAINS

    // 2. Tìm theo người dùng đã bình luận (ID của User)
    private String idUser;
    
    // 3. Tìm theo chương truyện (ID của Chapter)
    private String idChapter;
    
    // 4. Tìm theo truyện (ID của Novel) - một filter rất hữu ích
    private String idNovel;

    // 5. Tìm theo số lượt thích (lớn hơn hoặc bằng)
    private Integer minLikes;

    // 6. Tìm theo số lượt không thích (lớn hơn hoặc bằng)
    private Integer minDislikes;

    // 7. Chỉ lấy comment gốc (không phải comment trả lời)
    // Nếu true, chỉ lấy các comment có parent_comment_id là NULL
    private Boolean parentOnly;
}