// Đặt trong package: com.example.demo.entity
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
// Đảm bảo ở tầng DB, không thể có 2 dòng có cùng user_id và comment_id
// Đây là lớp bảo vệ quan trọng nhất!
@Table(name = "comment_likes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"id_user", "id_comment"})
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_comment", nullable = false)
    Comment comment;

    @Column(nullable = false, updatable = false)
    LocalDateTime likedAt;

    @PrePersist
    protected void onCreate() {
        likedAt = LocalDateTime.now();
    }
}