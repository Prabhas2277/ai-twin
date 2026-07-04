package com.campus.attendance.controller;

import com.campus.attendance.model.AttendanceRecord;
import com.campus.attendance.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    @Autowired
    public AttendanceController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @PostMapping("/mark")
    public ResponseEntity<AttendanceRecord> markAttendance(@RequestBody AttendanceRecord record) {
        if (record.getStudentId() == null || record.getDate() == null || record.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        AttendanceRecord savedRecord = attendanceRepository.save(record);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRecord);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceRecord>> getStudentAttendance(@PathVariable Long studentId) {
        List<AttendanceRecord> records = attendanceRepository.findByStudentId(studentId);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<AttendanceRecord> records = attendanceRepository.findByDate(date);
        return ResponseEntity.ok(records);
    }
}
