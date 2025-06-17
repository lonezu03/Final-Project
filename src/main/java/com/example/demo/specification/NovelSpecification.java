package com.example.demo.specification;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.example.demo.entity.Novel;

public class NovelSpecification {
	 public static Specification<Novel> hasName(String name) {
	        return (root, query, cb) -> cb.equal(root.get("nameNovel"), name);
	    }

	    public static Specification<Novel> hasSimilarName(String name) {
	        return (root, query, cb) -> cb.like(cb.lower(root.get("nameNovel")), "%" + name.toLowerCase() + "%");
	    }
	    
	    // (Tương tự cho descriptionNovel)

	    public static Specification<Novel> ratingGreaterThanOrEqual(Double rating) {
	        // Lưu ý: Cột rating của bạn là String, so sánh số có thể không chính xác
	        // trên mọi DB. Tốt nhất nên đổi kiểu cột thành số.
	        // Dưới đây là cách làm giả định cột là số (cần cast).
	        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rating").as(Double.class), rating);
	    }
	    
	    public static Specification<Novel> totalChapterGreaterThan(Integer count) {
	        return (root, query, cb) -> cb.greaterThan(root.get("totalChapter"), count);
	    }

	    public static Specification<Novel> totalChapterLessThan(Integer count) {
	        return (root, query, cb) -> cb.lessThan(root.get("totalChapter"), count);
	    }

	    public static Specification<Novel> hasStatusIn(List<String> statuses) {
	        if (statuses == null || statuses.isEmpty()) return null;
	        return (root, query, cb) -> root.get("statusNovel").in(statuses);
	    }

	    public static Specification<Novel> byAuthorNames(List<String> nameAuthors) {
	        if (nameAuthors == null || nameAuthors.isEmpty()) return null;
	        return (root, query, cb) -> {
	            query.distinct(true);
	            return root.join("authors").get("nameAuthor").in(nameAuthors);
	        };
	    }

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
