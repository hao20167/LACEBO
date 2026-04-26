package com.lacebo.backend.support;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.web.SecurityFilterChain;

@SpringBootTest(classes = BaseIntegrationTest.TestApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

	@SpringBootConfiguration
	@EnableAutoConfiguration
	@Import(TestBeans.class)
	static class TestApplication {
	}

	@Configuration
	static class TestBeans {

		@Bean
		PasswordEncoder passwordEncoder() {
			return new BCryptPasswordEncoder();
		}

		@Bean
		SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
			http.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll());

			return http.build();
		}

		@Bean
		UserDetailsService userDetailsService() {
			return new InMemoryUserDetailsManager();
		}

		@Bean
		TestUserRepository testUserRepository() {
			return new InMemoryTestUserRepository();
		}

		@Bean
		TestUserRegistrationService testUserRegistrationService(TestUserRepository testUserRepository, PasswordEncoder passwordEncoder) {
			return new TestUserRegistrationService(testUserRepository, passwordEncoder);
		}

		@Bean
		TestUserController testUserController(TestUserRegistrationService testUserRegistrationService) {
			return new TestUserController(testUserRegistrationService);
		}
	}

	public interface TestUserRepository {

		Optional<TestUser> findByEmail(String email);

		boolean existsByEmail(String email);

		TestUser save(TestUser user);
	}

	public static final class InMemoryTestUserRepository implements TestUserRepository {

		private final Map<String, TestUser> usersByEmail = new LinkedHashMap<>();
		private final AtomicLong sequence = new AtomicLong(1);

		@Override
		public synchronized Optional<TestUser> findByEmail(String email) {
			return Optional.ofNullable(usersByEmail.get(email));
		}

		@Override
		public synchronized boolean existsByEmail(String email) {
			return usersByEmail.containsKey(email);
		}

		@Override
		public synchronized TestUser save(TestUser user) {
			if (user.getId() == null) {
				user.setId(sequence.getAndIncrement());
			}

			usersByEmail.put(user.getEmail(), user);
			return user;
		}
	}

	public static final class TestUser {

		private Long id;
		private final String username;
		private final String email;
		private final String password;

		public TestUser(String username, String email, String password) {
			this.username = username;
			this.email = email;
			this.password = password;
		}

		public Long getId() {
			return id;
		}

		public void setId(Long id) {
			this.id = id;
		}

		public String getUsername() {
			return username;
		}

		public String getEmail() {
			return email;
		}

		public String getPassword() {
			return password;
		}
	}

	public record RegisterUserRequest(String username, String email, String password) {
	}

	public record RegisterUserResponse(Long id, String username, String email) {
	}

	@Service
	public static final class TestUserRegistrationService {

		private final TestUserRepository testUserRepository;
		private final PasswordEncoder passwordEncoder;

		TestUserRegistrationService(TestUserRepository testUserRepository, PasswordEncoder passwordEncoder) {
			this.testUserRepository = testUserRepository;
			this.passwordEncoder = passwordEncoder;
		}

		RegisterUserResponse register(RegisterUserRequest request) {
			if (testUserRepository.existsByEmail(request.email())) {
				throw new IllegalArgumentException("Email already exists");
			}

			TestUser savedUser = testUserRepository.save(
				new TestUser(
					request.username(),
					request.email(),
					passwordEncoder.encode(request.password())
				)
			);

			return new RegisterUserResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
		}
	}

	@RestController
	@RequestMapping("/api/users")
	public static final class TestUserController {

		private final TestUserRegistrationService testUserRegistrationService;

		TestUserController(TestUserRegistrationService testUserRegistrationService) {
			this.testUserRegistrationService = testUserRegistrationService;
		}

		@PostMapping("/register")
		ResponseEntity<RegisterUserResponse> register(@RequestBody RegisterUserRequest request) {
			return ResponseEntity.status(HttpStatus.CREATED).body(testUserRegistrationService.register(request));
		}
	}
}
