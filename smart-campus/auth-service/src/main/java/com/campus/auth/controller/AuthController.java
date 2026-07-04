package com.campus.auth.controller;

import com.campus.auth.dto.AuthResponse;
import com.campus.auth.dto.LoginRequest;
import com.campus.auth.dto.RegisterRequest;
import com.campus.auth.model.User;
import com.campus.auth.repository.UserRepository;
import com.campus.common.multitenancy.TenantContext;
import com.campus.common.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (request.getTenantId() == null || request.getTenantId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Tenant ID must be specified for registration.");
        }

        try {
            // Set context for saving/validating under this specific tenant
            TenantContext.setCurrentTenant(request.getTenantId());

            Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
            if (existingUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Email is already registered for this campus.");
            }

            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(request.getRole());
            user.setTenantId(request.getTenantId()); // TenantAware prePersist will also map this

            User savedUser = userRepository.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);

        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getTenantId() == null || request.getTenantId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Tenant ID must be specified for login.");
        }

        try {
            // Set context for scoping the user lookup to this tenant
            TenantContext.setCurrentTenant(request.getTenantId());

            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email, password, or tenant ID.");
            }

            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getEmail(), user.getTenantId(), user.getRole());
            
            AuthResponse response = new AuthResponse(token, user.getEmail(), user.getRole(), user.getTenantId());
            return ResponseEntity.ok(response);

        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        // Since JwtRequestFilter automatically sets the TenantContext from the token,
        // any repository query in this thread will be restricted to the authenticated user's tenant.
        String tenantId = TenantContext.getCurrentTenant();
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        return userOpt
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
