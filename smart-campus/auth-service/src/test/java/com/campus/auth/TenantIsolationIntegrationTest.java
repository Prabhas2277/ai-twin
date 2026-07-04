package com.campus.auth;

import com.campus.auth.model.User;
import com.campus.auth.repository.UserRepository;
import com.campus.common.multitenancy.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test verifying that the dynamic Hibernate filtering aspect
 * correctly isolates data on a per-tenant basis.
 */
@SpringBootTest
@Transactional
public class TenantIsolationIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    public void setUp() {
        // Clear any previous state
        TenantContext.clear();

        // 1. Seed Tenant A user
        TenantContext.setCurrentTenant("CAMPUS_A");
        User userA = new User("Alice Smith", "student@campus.edu", "hashed_pass_1", "Student");
        userRepository.save(userA);

        // 2. Seed Tenant B user with the EXACT SAME EMAIL to verify overlapping constraints & query isolation
        TenantContext.setCurrentTenant("CAMPUS_B");
        User userB = new User("Bob Jones", "student@campus.edu", "hashed_pass_2", "Student");
        userRepository.save(userB);

        // Clear the tenant context before entering tests
        TenantContext.clear();
    }

    @AfterEach
    public void tearDown() {
        TenantContext.clear();
    }

    @Test
    public void testTenantA_Isolation() {
        // Set ThreadLocal tenant to CAMPUS_A
        TenantContext.setCurrentTenant("CAMPUS_A");

        // Fetch users from the repository
        List<User> users = userRepository.findAll();

        // Assert that only Alice Smith (CAMPUS_A) is returned, Bob Jones is filtered out
        assertEquals(1, users.size());
        User user = users.get(0);
        assertEquals("Alice Smith", user.getName());
        assertEquals("student@campus.edu", user.getEmail());
        assertEquals("CAMPUS_A", user.getTenantId());
    }

    @Test
    public void testTenantB_Isolation() {
        // Set ThreadLocal tenant to CAMPUS_B
        TenantContext.setCurrentTenant("CAMPUS_B");

        // Fetch users from the repository
        List<User> users = userRepository.findAll();

        // Assert that only Bob Jones (CAMPUS_B) is returned, Alice Smith is filtered out
        assertEquals(1, users.size());
        User user = users.get(0);
        assertEquals("Bob Jones", user.getName());
        assertEquals("student@campus.edu", user.getEmail());
        assertEquals("CAMPUS_B", user.getTenantId());
    }

    @Test
    public void testNoTenant_NoFilterApplied() {
        // No tenant is set in context
        TenantContext.clear();

        // Fetch users
        List<User> users = userRepository.findAll();

        // Hibernate filter is only enabled if tenantId != null,
        // so all records are returned (useful for admin reporting).
        assertEquals(2, users.size());
        
        boolean foundA = users.stream().anyMatch(u -> u.getName().equals("Alice Smith"));
        boolean foundB = users.stream().anyMatch(u -> u.getName().equals("Bob Jones"));
        
        assertTrue(foundA);
        assertTrue(foundB);
    }
}
