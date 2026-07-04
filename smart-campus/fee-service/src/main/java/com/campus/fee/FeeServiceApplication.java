package com.campus.fee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot application entry point for the Fee Service.
 * Scans packages set to "com.campus" to include components from the common module.
 */
@SpringBootApplication(scanBasePackages = "com.campus")
public class FeeServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(FeeServiceApplication.class, args);
    }
}
