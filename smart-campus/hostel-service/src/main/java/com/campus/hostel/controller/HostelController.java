package com.campus.hostel.controller;

import com.campus.hostel.model.Allocation;
import com.campus.hostel.model.Room;
import com.campus.hostel.repository.AllocationRepository;
import com.campus.hostel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/hostel")
public class HostelController {

    private final RoomRepository roomRepository;
    private final AllocationRepository allocationRepository;

    @Autowired
    public HostelController(RoomRepository roomRepository, AllocationRepository allocationRepository) {
        this.roomRepository = roomRepository;
        this.allocationRepository = allocationRepository;
    }

    @PostMapping("/rooms")
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        if (room.getRoomNumber() == null || room.getCapacity() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        Room savedRoom = roomRepository.save(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRoom);
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @PostMapping("/allocate")
    @Transactional
    public ResponseEntity<?> allocateRoom(@RequestBody Allocation allocationRequest) {
        if (allocationRequest.getRoomId() == null || allocationRequest.getStudentId() == null) {
            return ResponseEntity.badRequest().body("Room ID and Student ID are required.");
        }

        // 1. Check if student already has an active room allocation
        Optional<Allocation> activeAllocOpt = allocationRepository
                .findByStudentIdAndIsActiveTrue(allocationRequest.getStudentId());
        if (activeAllocOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Student is already allocated an active hostel room.");
        }

        // 2. Fetch the room
        Optional<Room> roomOpt = roomRepository.findById(allocationRequest.getRoomId());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Room not found.");
        }

        Room room = roomOpt.get();

        // 3. Verify occupancy limits
        if (room.getCurrentOccupancy() >= room.getCapacity()) {
            return ResponseEntity.badRequest().body("Selected room is already at full capacity.");
        }

        // 4. Update room occupancy
        room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
        roomRepository.save(room);

        // 5. Create Allocation
        if (allocationRequest.getAllocationDate() == null) {
            allocationRequest.setAllocationDate(LocalDate.now());
        }
        allocationRequest.setActive(true);

        Allocation savedAllocation = allocationRepository.save(allocationRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAllocation);
    }

    @PostMapping("/deallocate/{allocationId}")
    @Transactional
    public ResponseEntity<?> deallocateRoom(@PathVariable Long allocationId) {
        Optional<Allocation> allocationOpt = allocationRepository.findById(allocationId);
        if (allocationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Allocation record not found.");
        }

        Allocation allocation = allocationOpt.get();
        if (!allocation.isActive()) {
            return ResponseEntity.badRequest().body("Allocation is already inactive.");
        }

        Optional<Room> roomOpt = roomRepository.findById(allocation.getRoomId());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Associated room not found.");
        }

        Room room = roomOpt.get();

        // 1. Update Room Occupancy
        room.setCurrentOccupancy(Math.max(0, room.getCurrentOccupancy() - 1));
        roomRepository.save(room);

        // 2. Deactivate Allocation
        allocation.setActive(false);
        Allocation updatedAllocation = allocationRepository.save(allocation);

        return ResponseEntity.ok(updatedAllocation);
    }
}
