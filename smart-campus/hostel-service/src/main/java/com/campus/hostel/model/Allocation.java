package com.campus.hostel.model;

import com.campus.common.multitenancy.TenantAware;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Entity representing a room allocation.
 * Extends TenantAware to automatically isolate room mappings by campus (tenant_id).
 */
@Entity
@Table(name = "allocations")
public class Allocation extends TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "allocation_date", nullable = false)
    private LocalDate allocationDate;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    // Constructors
    public Allocation() {
        super();
    }

    public Allocation(Long roomId, Long studentId, LocalDate allocationDate) {
        super();
        this.roomId = roomId;
        this.studentId = studentId;
        this.allocationDate = allocationDate;
        this.isActive = true;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public LocalDate getAllocationDate() {
        return allocationDate;
    }

    public void setAllocationDate(LocalDate allocationDate) {
        this.allocationDate = allocationDate;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
