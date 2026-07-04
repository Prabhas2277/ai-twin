package com.campus.attendance.model;

import com.campus.common.multitenancy.TenantAware;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Entity representing an attendance record.
 * Extends TenantAware to automatically isolate records by campus (tenant_id).
 */
@Entity
@Table(name = "attendance_records")
public class AttendanceRecord extends TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String status; // e.g. PRESENT, ABSENT

    // Constructors
    public AttendanceRecord() {
        super();
    }

    public AttendanceRecord(Long studentId, LocalDate date, String status) {
        super();
        this.studentId = studentId;
        this.date = date;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
