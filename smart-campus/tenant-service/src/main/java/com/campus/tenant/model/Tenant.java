package com.campus.tenant.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Entity representing a tenant (college/campus) in the multi-tenant system.
 * This is a global administration entity and is not tenant-scoped.
 */
@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    private String id; // unique tenant identifier (e.g. CAMPUS_A)
    private String name; // e.g. "St. Johns College"
    private String subdomain; // e.g. "stjohns"
    private String plan; // e.g. "BASIC", "PREMIUM"
    private String status; // e.g. "ACTIVE", "SUSPENDED"
    private LocalDateTime createdAt;

    // Constructors
    public Tenant() {
        this.createdAt = LocalDateTime.now();
    }

    public Tenant(String id, String name, String subdomain, String plan, String status) {
        this.id = id;
        this.name = name;
        this.subdomain = subdomain;
        this.plan = plan;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubdomain() {
        return subdomain;
    }

    public void setSubdomain(String subdomain) {
        this.subdomain = subdomain;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
