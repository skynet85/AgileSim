package com.morris.repository;

import com.morris.entity.GameEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<GameEntity, UUID> {
    // Determinisztikus lekérdezések. Nincs helye „okos” dynamic query-knek a kritikus üzleti logikában.
}