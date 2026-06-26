package com.malmo.repository;

import com.malmo.entity.GameSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSessionEntity, String> {
    Optional<GameSessionEntity> findById(String id);
}