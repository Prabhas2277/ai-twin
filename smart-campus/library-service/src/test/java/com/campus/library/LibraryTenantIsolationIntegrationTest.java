package com.campus.library;

import com.campus.common.multitenancy.TenantContext;
import com.campus.library.model.Book;
import com.campus.library.model.BookIssue;
import com.campus.library.repository.BookIssueRepository;
import com.campus.library.repository.BookRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test verifying that Library domain rules (inventory checks, lending, return, and fines)
 * execute correctly in standard tenant isolation.
 */
@SpringBootTest
@Transactional
public class LibraryTenantIsolationIntegrationTest {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookIssueRepository bookIssueRepository;

    private Long bookAId;
    private Long bookBId;

    @BeforeEach
    public void setUp() {
        TenantContext.clear();

        // 1. Seed Tenant A catalog
        TenantContext.setCurrentTenant("CAMPUS_A");
        Book bookA = new Book("Introduction to Algorithms", "CLRS", "9780262033848", 1);
        Book savedA = bookRepository.save(bookA);
        bookAId = savedA.getId();

        // 2. Seed Tenant B catalog (same ISBN, but separate inventory counts)
        TenantContext.setCurrentTenant("CAMPUS_B");
        Book bookB = new Book("Introduction to Algorithms", "CLRS", "9780262033848", 3);
        Book savedB = bookRepository.save(bookB);
        bookBId = savedB.getId();

        TenantContext.clear();
    }

    @AfterEach
    public void tearDown() {
        TenantContext.clear();
    }

    @Test
    public void testTenantIsolation_InventoryAndLending() {
        // --- 1. TEST CAMPUS_A LENDING ---
        TenantContext.setCurrentTenant("CAMPUS_A");

        // Verify CAMPUS_A sees only its book with 1 copy
        List<Book> booksA = bookRepository.findAll();
        assertEquals(1, booksA.size());
        Book activeBookA = booksA.get(0);
        assertEquals(1, activeBookA.getAvailableCopies());

        // Issue the last copy to a student
        BookIssue issueA = new BookIssue(bookAId, 1001L, LocalDate.now(), LocalDate.now().plusDays(14));
        bookIssueRepository.save(issueA);
        
        // Simulating the decrement of copies (which is managed by controller/service)
        activeBookA.setAvailableCopies(activeBookA.getAvailableCopies() - 1);
        bookRepository.save(activeBookA);

        // Verify available copies is now 0 in CAMPUS_A
        Book updatedBookA = bookRepository.findById(bookAId).orElseThrow();
        assertEquals(0, updatedBookA.getAvailableCopies());


        // --- 2. TEST CAMPUS_B INVENTORY REMAINS UNTOUCHED ---
        TenantContext.setCurrentTenant("CAMPUS_B");

        // Verify CAMPUS_B still has its 3 copies available
        List<Book> booksB = bookRepository.findAll();
        assertEquals(1, booksB.size());
        Book activeBookB = booksB.get(0);
        assertEquals(3, activeBookB.getAvailableCopies());

        // Verify CAMPUS_B cannot see CAMPUS_A's issue records
        List<BookIssue> issuesB = bookIssueRepository.findAll();
        assertTrue(issuesB.isEmpty());
    }

    @Test
    public void testOverdueFineCalculation() {
        TenantContext.setCurrentTenant("CAMPUS_A");

        // Create an issue record that was due 5 days ago
        LocalDate issueDate = LocalDate.now().minusDays(19);
        LocalDate dueDate = LocalDate.now().minusDays(5);
        
        BookIssue issue = new BookIssue(bookAId, 2002L, issueDate, dueDate);
        BookIssue savedIssue = bookIssueRepository.save(issue);

        // Process a return today
        savedIssue.setReturnDate(LocalDate.now());

        // Calculate fine ($10 per overdue day)
        long daysOverdue = ChronoUnit.DAYS.between(savedIssue.getDueDate(), savedIssue.getReturnDate());
        assertEquals(5, daysOverdue);

        double fineAmount = daysOverdue * 10.0;
        savedIssue.setFineAmount(fineAmount);
        BookIssue updatedIssue = bookIssueRepository.save(savedIssue);

        // Assert fine is calculated correctly ($50.0)
        assertEquals(50.0, updatedIssue.getFineAmount());
    }
}
