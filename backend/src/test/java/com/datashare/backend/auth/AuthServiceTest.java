package com.datashare.backend.auth;

import com.datashare.backend.common.exception.ConflictException;
import com.datashare.backend.user.User;
import com.datashare.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_shouldCreateUser_whenEmailIsNotUsed() {
        RegisterRequest request = new RegisterRequest("TEST@DataShare.com", "password123");

        when(userRepository.existsByEmail("test@datashare.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");

        User savedUser = User.builder()
                .uuidUser(UUID.randomUUID())
                .email("test@datashare.com")
                .passwordHash("hashed-password")
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authService.register(request);

        assertThat(response.uuidUser()).isEqualTo(savedUser.getUuidUser());
        assertThat(response.email()).isEqualTo("test@datashare.com");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User userToSave = userCaptor.getValue();

        assertThat(userToSave.getEmail()).isEqualTo("test@datashare.com");
        assertThat(userToSave.getPasswordHash()).isEqualTo("hashed-password");
        verify(passwordEncoder).encode("password123");
    }

    @Test
    void register_shouldThrowConflictException_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest("test@datashare.com", "password123");

        when(userRepository.existsByEmail("test@datashare.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email is already used");

        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void register_shouldNormalizeEmail_beforeSavingUser() {
        RegisterRequest request = new RegisterRequest("  USER@DataShare.COM  ", "password123");

        when(userRepository.existsByEmail("user@datashare.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");

        User savedUser = User.builder()
                .uuidUser(UUID.randomUUID())
                .email("user@datashare.com")
                .passwordHash("hashed-password")
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authService.register(request);

        assertThat(response.email()).isEqualTo("user@datashare.com");

        verify(userRepository).existsByEmail("user@datashare.com");
    }
}
