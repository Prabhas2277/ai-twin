package com.campus.auth.dto;

/**
 * Payload representing a login request.
 */
public class LoginRequest {
    private String email;
    private String password;
    private String tenantId;

    // Constructors
    public LoginRequest() {}

    public LoginRequest(String email, String password, String tenantId) {
        this.email = email;
        this.password = password;
        this.tenantId = tenantId;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
