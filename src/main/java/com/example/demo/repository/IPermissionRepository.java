package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entity.Permission;


public interface IPermissionRepository extends JpaRepository<Permission, Integer>{

	List<Permission> findByEndPoint(String endPoint);
	
	@Query("""
		    SELECT p 
		    FROM Permission p 
		    LEFT JOIN FETCH p.roles 
		    WHERE p.endPoint = :endPoint 
		      AND p.method = :method
		""")
		List<Permission> findByEndPointAndMethodWithRoles(
		    @Param("endPoint") String endPoint,
		    @Param("method") String method
		);



}
