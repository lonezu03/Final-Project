package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.User;
import com.example.demo.enums.Role;


@Repository
public interface IUserRepository extends JpaRepository<User, String>,JpaSpecificationExecutor<User>{
	User findByEmailUser(String emailUser);
	Optional<User> findByIdUser(String idUser);
    Optional<User> findByUserNameUser(String userNameUser);
    List<User> findAllByRole(Role role);

}
