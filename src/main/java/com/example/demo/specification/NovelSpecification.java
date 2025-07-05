package com.example.demo.specification;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.example.demo.entity.Novel;

/**
 * Lớp chứa các Specification để truy vấn động các đối tượng Novel.
 */
public class NovelSpecification {

    /**
     * Tạo Specification để lọc theo tên tuyệt đối của tiểu thuyết.
     *
     * @param name Tên cần so sánh
     * @return Specification lọc các Novel có nameNovel bằng với name
     */
    public static Specification<Novel> hasName(String name) {
        return (root, query, cb) -> cb.equal(root.get("nameNovel"), name);
    }

    /**
     * Tạo Specification để lọc theo tên tiểu thuyết gần đúng (dạng LIKE, không phân biệt hoa thường).
     *
     * @param name Tên cần tìm gần đúng
     * @return Specification lọc các Novel có nameNovel chứa name
     */
    public static Specification<Novel> hasSimilarName(String name) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("nameNovel")), "%" + name.toLowerCase() + "%");
    }

    // (Tương tự cho descriptionNovel)

    /**
     * Tạo Specification để lọc các tiểu thuyết có rating >= giá trị được truyền vào.
     *
     * @param rating Giá trị rating tối thiểu
     * @return Specification lọc các Novel theo rating
     *
     * Lưu ý: Cột rating của bạn là String, so sánh số có thể không chính xác
     * trên mọi DB. Tốt nhất nên đổi kiểu cột thành số.
     * Dưới đây là cách làm giả định cột là số (cần cast).
     */
//    public static Specification<Novel> ratingGreaterThanOrEqual(Double rating) {
//        // Lưu ý: Cột rating của bạn là String, so sánh số có thể không chính xác
//        // trên mọi DB. Tốt nhất nên đổi kiểu cột thành số.
//        // Dưới đây là cách làm giả định cột là số (cần cast).
//        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rating").as(Double.class), rating);
//    }

    /**
     * Tạo Specification để lọc các tiểu thuyết có tổng số chương > count.
     *
     * @param count Số chương tối thiểu
     * @return Specification lọc theo tổng chương
     */
//    public static Specification<Novel> totalChapterGreaterThan(Integer count) {
//        return (root, query, cb) -> cb.greaterThan(root.get("totalChapter"), count);
//    }

    /**
     * Tạo Specification để lọc các tiểu thuyết có tổng số chương < count.
     *
     * @param count Số chương tối đa
     * @return Specification lọc theo tổng chương
     */
//    public static Specification<Novel> totalChapterLessThan(Integer count) {
//        return (root, query, cb) -> cb.lessThan(root.get("totalChapter"), count);
//    }

    /**
     * Tạo Specification để lọc các tiểu thuyết theo danh sách status.
     *
     * @param statuses Danh sách trạng thái cần lọc
     * @return Specification hoặc null nếu danh sách rỗng
     */
    public static Specification<Novel> hasStatusIn(List<String> statuses) {
        if (statuses == null || statuses.isEmpty()) return null;
        return (root, query, cb) -> root.get("statusNovel").in(statuses);
    }

    /**
     * Tạo Specification để lọc các tiểu thuyết có tác giả nằm trong danh sách tên cho trước.
     *
     * @param nameAuthors Danh sách tên tác giả
     * @return Specification lọc theo tác giả hoặc null nếu danh sách rỗng
     */
    public static Specification<Novel> byAuthorNames(List<String> nameAuthors) {
        if (nameAuthors == null || nameAuthors.isEmpty()) return null;
        return (root, query, cb) -> {
            query.distinct(true);
            return root.join("authors").get("nameAuthor").in(nameAuthors);
        };
    }

    /**
     * Tạo Specification để lọc các tiểu thuyết có thể loại nằm trong danh sách.
     *
     * @param categoryNames Danh sách tên thể loại
     * @return Specification hoặc null nếu danh sách rỗng
     *
     * Luôn kiểm tra đầu vào
     */
    public static Specification<Novel> byCategoryNames(List<String> categoryNames) {
        // Luôn kiểm tra đầu vào
        if (categoryNames == null || categoryNames.isEmpty()) {
            return null;
        }

        return (root, query, criteriaBuilder) -> {
            // Đảm bảo mỗi novel chỉ trả về một lần dù nó thuộc nhiều thể loại thỏa mãn
            query.distinct(true); 

            // 1. Join từ Novel đến collection 'categories'
            // 2. Từ 'categories' đã join, lấy ra thuộc tính 'nameCategory'
            // 3. Dùng mệnh đề 'in' để so sánh với danh sách categoryNames
            return root.join("categories").get("nameCategory").in(categoryNames);
        };
    }
}
