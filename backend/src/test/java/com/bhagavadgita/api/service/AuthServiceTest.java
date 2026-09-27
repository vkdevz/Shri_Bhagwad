package com.bhagavadgita.api.service;

import com.bhagavadgita.api.config.JwtService;
import com.bhagavadgita.api.dto.AuthRequestDTO;
import com.bhagavadgita.api.entity.User;
import com.bhagavadgita.api.exception.BadRequestException;
import com.bhagavadgita.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("arjuna")
                .email("arjuna@pandava.org")
                .passwordHash("hashed_secret")
                .role("ROLE_USER")
                .streakCount(3)
                .build();
    }

    @Test
    @DisplayName("register creates user and issues JWT token")
    void testRegister_Success() {
        AuthRequestDTO.Register request = AuthRequestDTO.Register.builder()
                .username("arjuna")
                .email("arjuna@pandava.org")
                .password("secret123")
                .build();

        when(userRepository.existsByUsername("arjuna")).thenReturn(false);
        when(userRepository.existsByEmail("arjuna@pandava.org")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed_secret");
        when(jwtService.generateToken("arjuna")).thenReturn("mock.jwt.token");
        when(jwtService.getExpirationTime()).thenReturn(86400000L);

        AuthRequestDTO.AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getUsername()).isEqualTo("arjuna");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("register throws BadRequestException when username already taken")
    void testRegister_DuplicateUsername() {
        AuthRequestDTO.Register request = AuthRequestDTO.Register.builder()
                .username("arjuna")
                .email("new@pandava.org")
                .password("secret123")
                .build();

        when(userRepository.existsByUsername("arjuna")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username is already taken");
    }

    @Test
    @DisplayName("login authenticates valid user and returns token")
    void testLogin_Success() {
        AuthRequestDTO.Login request = AuthRequestDTO.Login.builder()
                .username("arjuna")
                .password("secret123")
                .build();

        when(userRepository.findByUsername("arjuna")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("secret123", "hashed_secret")).thenReturn(true);
        when(jwtService.generateToken("arjuna")).thenReturn("mock.jwt.token");
        when(jwtService.getExpirationTime()).thenReturn(86400000L);

        AuthRequestDTO.AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getUsername()).isEqualTo("arjuna");
    }

    @Test
    @DisplayName("login throws BadCredentialsException on password mismatch")
    void testLogin_InvalidPassword() {
        AuthRequestDTO.Login request = AuthRequestDTO.Login.builder()
                .username("arjuna")
                .password("wrongpassword")
                .build();

        when(userRepository.findByUsername("arjuna")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "hashed_secret")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid username or password");
    }
}
