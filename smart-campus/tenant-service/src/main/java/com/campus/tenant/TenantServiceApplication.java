package com.campus.tenant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot application entry point for the Tenant Service.
 * Scan packages set to "com.campus" to include components from the common module.
 */
@SpringBootApplication(scanBasePackages = "com.campus")
public class TenantServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(TenantServiceApplication.class, args);
    }
}
