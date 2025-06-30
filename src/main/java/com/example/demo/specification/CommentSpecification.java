package com.example.demo.specification;

import com.example.demo.entity.Comment;
import com.example.demo.entity.CommentLike;

import jakarta.persistence.criteria.Join;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Chứa các điều kiện Specification để lọc dữ liệu cho thực thể Comment.
 * Hỗ trợ tìm kiếm theo nội dung, người dùng, chương, truyện, số lượt thích, v.v.
 */
public class CommentSpecification {

    /**
     * Lọc comment có nội dung chính xác.
     *
     * @param content Nội dung comment cần so sánh
     * @return Specification cho nội dung chính xác hoặc null nếu không có giá trị đầu vào
     */
    public static Specification<Comment> contentEquals(String content) {
        if (!StringUtils.hasText(content)) return null; // Trả về null để service bỏ qua
        return (root, query, cb) -> cb.equal(root.get("contentComment"), content);
    }

    /**
     * Lọc comment có nội dung chứa một chuỗi (không phân biệt hoa thường).
     *
     * @param content Chuỗi cần tìm kiếm
     * @return Specification cho nội dung LIKE hoặc null nếu không có giá trị đầu vào
     */
    public static Specification<Comment> contentContains(String content) {
        if (!StringUtils.hasText(content)) return null;
        return (root, query, cb) -> cb.like(cb.lower(root.get("contentComment")),
                "%" + content.toLowerCase() + "%");
    }

    /**
     * Lọc comment theo ID của người dùng.
     *
     * @param idUser ID người dùng
     * @return Specification hoặc null nếu không có đầu vào
     */
    public static Specification<Comment> byUser(String idUser) {
        if (!StringUtils.hasText(idUser)) return null;
        return (root, query, cb) -> cb.equal(root.get("user").get("idUser"), idUser);
    }

    /**
     * Lọc comment theo ID của chương.
     *
     * @param idChapter ID chương
     * @return Specification hoặc null nếu đầu vào null
     */
    public static Specification<Comment> byChapter(String idChapter) {
        if (idChapter == null) return null;
        return (root, query, cb) -> cb.equal(root.get("chapter").get("idChapter"), idChapter);
    }

    /**
     * Lọc comment theo ID của truyện (yêu cầu join).
     *
     * @param idNovel ID truyện
     * @return Specification hoặc null nếu đầu vào không hợp lệ
     */
    public static Specification<Comment> byNovel(String idNovel) {
        if (!StringUtils.hasText(idNovel)) return null;
        return (root, query, cb) -> cb.equal(root.get("chapter").get("novel").get("idNovel"), idNovel);
    }

    /**
     * Lọc comment có số lượt thích >= giá trị cho trước.
     *
     * @param minLikes Số lượt thích tối thiểu
     * @return Specification hoặc null nếu đầu vào null
     */
    public static Specification<Comment> likesGreaterThanOrEqual(Integer minLikes) {
        if (minLikes == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("likeComment"), minLikes);
    }

    /**
     * Lọc comment có số lượt không thích >= giá trị cho trước.
     *
     * @param minDislikes Số lượt không thích tối thiểu
     * @return Specification hoặc null nếu đầu vào null
     */
    public static Specification<Comment> dislikesGreaterThanOrEqual(Integer minDislikes) {
        if (minDislikes == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dislikeComment"), minDislikes);
    }

    /**
     * Lọc chỉ lấy các comment gốc (không có comment cha).
     *
     * @return Specification lọc các comment gốc
     */
    public static Specification<Comment> isParent() {
        return (root, query, cb) -> cb.isNull(root.get("parent"));
    }

    /**
     * Lọc các comment được người dùng cụ thể like.
     *
     * @param idUser ID người dùng đã like
     * @return Specification hoặc null nếu đầu vào không hợp lệ
     *
     * Luôn kiểm tra đầu vào để trả về null, cho phép service chaining an toàn
     */
    public static Specification<Comment> likedByUser(String idUser) {
        // Luôn kiểm tra đầu vào để trả về null, cho phép service chaining an toàn
        if (!StringUtils.hasText(idUser)) {
            return null;
        }

        return (root, query, criteriaBuilder) -> {
            // 1. Join từ Comment (root) đến collection 'likes' của nó.
            // Điều này tương đương với "FROM Comment c JOIN c.likes cl" trong JPQL/HQL.
            // "likes" là tên của trường `private Set<CommentLike> likes;` trong entity Comment.
            Join<Comment, CommentLike> likesJoin = root.join("likes");

            // 2. Từ 'likesJoin' (đại diện cho bảng comment_likes), đi sâu vào trường 'user',
            // rồi lấy ra trường 'idUser' của user đó và so sánh với giá trị truyền vào.
            // Tương đương với "WHERE cl.user.idUser = :idUser".
            var predicate = criteriaBuilder.equal(likesJoin.get("user").get("idUser"), idUser);

            // 3. Rất quan trọng: Thêm distinct() để tránh kết quả bị trùng lặp.
            // Khi bạn join với một collection, một comment có thể xuất hiện nhiều lần
            // nếu có nhiều bản ghi join thỏa mãn (dù trong trường hợp này ít xảy ra sau khi lọc).
            // Đây là một good practice.
            query.distinct(true);

            return predicate;
        };
    }
}
