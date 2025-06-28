package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Comment;
import com.example.demo.entity.CommentDislike;
import com.example.demo.entity.User;

public interface ICommentDislikeRepository extends JpaRepository<CommentDislike,Long>{
	  /**
     * Tìm kiếm một lượt dislike dựa trên User và Comment.
     * Đây là phương thức cốt lõi để kiểm tra sự tồn tại.
     */
    Optional<CommentDislike> findByUserAndComment(User user, Comment comment);
    
    // Bạn cũng có thể dùng phương thức exists để hiệu quả hơn nếu chỉ cần check
    boolean existsByUserAndComment(User user, Comment comment);
}
