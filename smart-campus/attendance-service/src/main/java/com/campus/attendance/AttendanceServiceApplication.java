package com.campus.attendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot application entry point for the Attendance Service.
 * Scans packages set to "com.campus" to include components from the common module.
 */
@SpringBootApplication(scanBasePackages = "com.campus")
public class AttendanceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AttendanceServiceApplication.class, args);
    }
}
