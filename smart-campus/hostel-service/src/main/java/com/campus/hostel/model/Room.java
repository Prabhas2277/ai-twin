package com.campus.hostel.model;

import com.campus.common.multitenancy.TenantAware;
import jakarta.persistence.*;

/**
 * Entity representing a hostel Room.
 * Extends TenantAware to automatically isolate room mappings by campus (tenant_id).
 */
@Entity
@Table(name = "rooms")
public class Room extends TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private int capacity;

    @Column(name = "current_occupancy", nullable = false)
    private int currentOccupancy;

    // Constructors
    public Room() {
        super();
    }

    public Room(String roomNumber, int capacity) {
        super();
        this.roomNumber = roomNumber;
        this.capacity = capacity;
        this.currentOccupancy = 0;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getCurrentOccupancy() {
        return currentOccupancy;
    }

    public void setCurrentOccupancy(int currentOccupancy) {
        this.currentOccupancy = currentOccupancy;
    }
}
