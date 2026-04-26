package com.lacebo.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    interface UserRepository {

        Optional<User> findByEmail(String email);
    }

    record User(String email, String password) {
    }

    record LoginRequest(String email, String password) {
    }

    record LoginResponse(String token, String email) {
    }

    static final class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
            this.userRepository = userRepository;
            this.passwordEncoder = passwordEncoder;
        }

        LoginResponse login(LoginRequest request) {
            Optional<User> userOpt = userRepository.findByEmail(request.email());
            if (userOpt.isEmpty()) {
                throw new BadCredentialsException("Invalid credentials");
            }

            User user = userOpt.get();
            if (!passwordEncoder.matches(request.password(), user.password())) {
                throw new BadCredentialsException("Invalid credentials");
            }

            return new LoginResponse("dummy-jwt-token", user.email());
        }
    }

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() {
        AuthService authService = new AuthService(userRepository, passwordEncoder);
        LoginRequest request = new LoginRequest("user@lacebo.com", "rawPassword");
        User user = new User("user@lacebo.com", "encodedPassword");

        when(userRepository.findByEmail("user@lacebo.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPassword", "encodedPassword")).thenReturn(true);

        LoginResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("user@lacebo.com");
        assertThat(response.token()).isNotBlank();
    }

    @Test
    void login_shouldThrowBadCredentials_whenPasswordDoesNotMatch() {
        AuthService authService = new AuthService(userRepository, passwordEncoder);
        LoginRequest request = new LoginRequest("user@lacebo.com", "wrongPassword");
        User user = new User("user@lacebo.com", "encodedPassword");

        when(userRepository.findByEmail("user@lacebo.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid credentials");
    }

    @Test
    void login_shouldThrowBadCredentials_whenUserNotFound() {
        AuthService authService = new AuthService(userRepository, passwordEncoder);
        LoginRequest request = new LoginRequest("missing@lacebo.com", "anyPassword");

        when(userRepository.findByEmail("missing@lacebo.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid credentials");
    }
}
