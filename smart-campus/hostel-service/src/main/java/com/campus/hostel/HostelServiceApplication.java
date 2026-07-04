package com.campus.hostel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot application entry point for the Hostel Service.
 * Scans packages set to "com.campus" to include components from the common module.
 */
@SpringBootApplication(scanBasePackages = "com.campus")
public class HostelServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(HostelServiceApplication.class, args);
    }
}
