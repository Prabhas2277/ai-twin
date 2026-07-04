package com.campus.auth.dto;

/**
 * Payload returned upon successful authentication.
 */
public class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String tenantId;

    // Constructors
    public AuthResponse() {}

    public AuthResponse(String token, String email, String role, String tenantId) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.tenantId = tenantId;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
