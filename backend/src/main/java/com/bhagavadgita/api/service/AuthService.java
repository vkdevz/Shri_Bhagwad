package com.bhagavadgita.api.service;

import com.bhagavadgita.api.config.JwtService;
import com.bhagavadgita.api.dto.AuthRequestDTO;
import com.bhagavadgita.api.entity.User;
import com.bhagavadgita.api.exception.BadRequestException;
import com.bhagavadgita.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthRequestDTO.AuthResponse register(AuthRequestDTO.Register request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .streakCount(1)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());
        return AuthRequestDTO.AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .username(user.getUsername())
                .email(user.getEmail())
                .streakCount(user.getStreakCount())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthRequestDTO.AuthResponse login(AuthRequestDTO.Login request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtService.generateToken(user.getUsername());
        return AuthRequestDTO.AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .username(user.getUsername())
                .email(user.getEmail())
                .streakCount(user.getStreakCount())
                .build();
    }
}
