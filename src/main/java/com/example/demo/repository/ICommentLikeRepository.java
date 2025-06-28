package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Comment;
import com.example.demo.entity.CommentLike;
import com.example.demo.entity.User;

@Repository
public interface ICommentLikeRepository extends JpaRepository<CommentLike, Long> {

    /**
     * Tìm kiếm một lượt like dựa trên User và Comment.
     * Đây là phương thức cốt lõi để kiểm tra sự tồn tại.
     */
    Optional<CommentLike> findByUserAndComment(User user, Comment comment);
    
    // Bạn cũng có thể dùng phương thức exists để hiệu quả hơn nếu chỉ cần check
    boolean existsByUserAndComment(User user, Comment comment);
}
