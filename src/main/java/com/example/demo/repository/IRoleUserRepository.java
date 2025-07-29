package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entity.RoleUser;
import com.example.demo.enums.Role;

public interface IRoleUserRepository extends JpaRepository<RoleUser, Integer>{

	List<RoleUser> findByRole(Role role);
	
	@Query("SELECT r FROM RoleUser r LEFT JOIN FETCH r.permissions WHERE r.role = :role")
	List<RoleUser> findByRoleWithPermissions(@Param("role") Role role);
	@Query("""
		    SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
		    FROM RoleUser r
		    JOIN r.permissions p
		    WHERE r.role = :role
		    AND p.endPoint = :endPoint
		""")
		boolean existsByRoleAndEndPoint(@Param("role") Role role, @Param("endPoint") String endPoint);

}
