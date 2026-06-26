// File: backend/src/main/java/com/malomgame/config/SecurityConfig.java
package com.malomgame.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ContentSecurityPolicyHeaderWriter;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(request -> {
                var config = new org.springframework.web.cors.CorsConfiguration();
                config.setAllowedOrigins(List.of("http://localhost:3000")); // Strict origin binding
                config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
                return config;
            }))
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'nonce-{token}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"))
            )
            .csrf(csrf -> csrf.disable()) // WebSocket driven state management bypasses CSRF token dependency for this architecture
            .build();
    }

    @Bean
    public OncePerRequestFilter cspNonceFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
                    throws ServletException, IOException {
                String nonce = UUID.randomUUID().toString();
                request.setAttribute("csp-nonce", nonce);
                
                // Strict CSP injection per request to prevent XSS leakage across sessions
                String cspHeader = "default-src 'self'; script-src 'nonce-" + nonce + "'; style-src 'self' 'unsafe-inline';";
                response.setHeader("Content-Security-Policy", cspHeader);
                
                filterChain.doFilter(request, response);
            }
        };
    }
}