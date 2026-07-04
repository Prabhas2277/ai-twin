package com.campus.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot application entry point for the Library Service.
 * Scans packages set to "com.campus" to include components from the common module.
 */
@SpringBootApplication(scanBasePackages = "com.campus")
public class LibraryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryServiceApplication.class, args);
    }
}
