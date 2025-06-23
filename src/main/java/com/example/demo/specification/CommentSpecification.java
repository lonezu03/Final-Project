package com.example.demo.specification;
import com.example.demo.entity.Comment;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class CommentSpecification {

    /**
     * Lọc comment có nội dung chính xác.
     */
    public static Specification<Comment> contentEquals(String content) {
        if (!StringUtils.hasText(content)) return null; // Trả về null để service bỏ qua
        return (root, query, cb) -> cb.equal(root.get("contentComment"), content);
    }

    /**
     * Lọc comment có nội dung chứa một chuỗi (không phân biệt hoa thường).
     */
    public static Specification<Comment> contentContains(String content) {
        if (!StringUtils.hasText(content)) return null;
        return (root, query, cb) -> cb.like(cb.lower(root.get("contentComment")),
                "%" + content.toLowerCase() + "%");
    }

    /**
     * Lọc comment theo ID của người dùng.
     */
    public static Specification<Comment> byUser(String idUser) {
        if (!StringUtils.hasText(idUser)) return null;
        return (root, query, cb) -> cb.equal(root.get("user").get("idUser"), idUser);
    }

    /**
     * Lọc comment theo ID của chương.
     */
    public static Specification<Comment> byChapter(Integer idChapter) {
        if (idChapter == null) return null;
        return (root, query, cb) -> cb.equal(root.get("chapter").get("idChapter"), idChapter);
    }

    /**
     * Lọc comment theo ID của truyện (yêu cầu join).
     */
    public static Specification<Comment> byNovel(String idNovel) {
        if (!StringUtils.hasText(idNovel)) return null;
        return (root, query, cb) -> cb.equal(root.get("chapter").get("novel").get("idNovel"), idNovel);
    }

    /**
     * Lọc comment có số lượt thích >= giá trị cho trước.
     */
    public static Specification<Comment> likesGreaterThanOrEqual(Integer minLikes) {
        if (minLikes == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("likeComment"), minLikes);
    }

    /**
     * Lọc comment có số lượt không thích >= giá trị cho trước.
     */
    public static Specification<Comment> dislikesGreaterThanOrEqual(Integer minDislikes) {
        if (minDislikes == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dislikeComment"), minDislikes);
    }

    /**
     * Lọc chỉ lấy các comment gốc (không có comment cha).
     */
    public static Specification<Comment> isParent() {
        return (root, query, cb) -> cb.isNull(root.get("parent"));
    }
}
