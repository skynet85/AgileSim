// File: backend/src/main/java/com/mallogame/MalomApplication.java
package com.mallogame;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.mallogame")
public class MalomApplication {
    public static void main(String[] args) {
        SpringApplication.run(MalomApplication.class, args);
    }
}