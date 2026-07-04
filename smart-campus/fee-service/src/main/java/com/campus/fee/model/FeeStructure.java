package com.campus.fee.model;

import com.campus.common.multitenancy.TenantAware;
import jakarta.persistence.*;

/**
 * Entity representing an academic Fee Structure.
 * Extends TenantAware to automatically isolate fee tiers by campus (tenant_id).
 */
@Entity
@Table(name = "fee_structures")
public class FeeStructure extends TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_year", nullable = false)
    private String academicYear; // e.g. "2026-2027"

    @Column(nullable = false)
    private double amount; // total tuition fee amount

    // Constructors
    public FeeStructure() {
        super();
    }

    public FeeStructure(String academicYear, double amount) {
        super();
        this.academicYear = academicYear;
        this.amount = amount;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }
}
