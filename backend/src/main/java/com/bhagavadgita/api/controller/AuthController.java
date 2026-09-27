package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.dto.AuthRequestDTO;
import com.bhagavadgita.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration and JWT token login")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new seeker account", description = "Creates a new user account with encrypted password and returns a stateless JWT token.")
    public ResponseEntity<AuthRequestDTO.AuthResponse> register(@Valid @RequestBody AuthRequestDTO.Register request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with credentials", description = "Authenticates user credentials and issues a stateless JWT token.")
    public ResponseEntity<AuthRequestDTO.AuthResponse> login(@Valid @RequestBody AuthRequestDTO.Login request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
