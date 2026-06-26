package com.malmo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Data
@NoArgsConstructor
@Entity
@Table(name = "game_sessions")
public class GameSessionEntity {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private String id;

    // Optimistic Locking Mechanism to prevent race conditions
    @Version
    private Long version;

    @Column(length = 4096)
    private String gameStateJson;

    public GameSessionEntity(String id, String gameStateJson) {
        this.id = id;
        this.gameStateJson = gameStateJson;
        this.version = 1L; // Initial version
    }
}