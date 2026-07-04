package com.campus.library.controller;

import com.campus.library.model.Book;
import com.campus.library.model.BookIssue;
import com.campus.library.repository.BookIssueRepository;
import com.campus.library.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private final BookRepository bookRepository;
    private final BookIssueRepository bookIssueRepository;

    @Autowired
    public LibraryController(BookRepository bookRepository, BookIssueRepository bookIssueRepository) {
        this.bookRepository = bookRepository;
        this.bookIssueRepository = bookIssueRepository;
    }

    @PostMapping("/books")
    public ResponseEntity<Book> addBook(@RequestBody Book book) {
        if (book.getTitle() == null || book.getAuthor() == null || book.getIsbn() == null) {
            return ResponseEntity.badRequest().build();
        }
        Book savedBook = bookRepository.save(book);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBook);
    }

    @GetMapping("/books")
    public ResponseEntity<List<Book>> getAllBooks() {
        return ResponseEntity.ok(bookRepository.findAll());
    }

    @PostMapping("/issue")
    @Transactional
    public ResponseEntity<?> issueBook(@RequestBody BookIssue issueRequest) {
        if (issueRequest.getBookId() == null || issueRequest.getStudentId() == null) {
            return ResponseEntity.badRequest().body("Book ID and Student ID are required.");
        }

        Optional<Book> bookOpt = bookRepository.findById(issueRequest.getBookId());
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Book not found.");
        }

        Book book = bookOpt.get();
        if (book.getAvailableCopies() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No copies available for lending.");
        }

        // Decrement copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // Populate dates if missing
        if (issueRequest.getIssueDate() == null) {
            issueRequest.setIssueDate(LocalDate.now());
        }
        if (issueRequest.getDueDate() == null) {
            // Default due date: 14 days later
            issueRequest.setDueDate(issueRequest.getIssueDate().plusDays(14));
        }
        issueRequest.setFineAmount(0.0);

        BookIssue savedIssue = bookIssueRepository.save(issueRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedIssue);
    }

    @PostMapping("/return/{issueId}")
    @Transactional
    public ResponseEntity<?> returnBook(@PathVariable Long issueId) {
        Optional<BookIssue> issueOpt = bookIssueRepository.findById(issueId);
        if (issueOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Lending record not found.");
        }

        BookIssue issue = issueOpt.get();
        if (issue.getReturnDate() != null) {
            return ResponseEntity.badRequest().body("This book issue has already been returned.");
        }

        Optional<Book> bookOpt = bookRepository.findById(issue.getBookId());
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Associated book details not found.");
        }

        Book book = bookOpt.get();
        
        // Mark return date
        issue.setReturnDate(LocalDate.now());

        // Increment book copies
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        // Calculate fine ($10 per overdue day)
        long daysOverdue = ChronoUnit.DAYS.between(issue.getDueDate(), issue.getReturnDate());
        if (daysOverdue > 0) {
            issue.setFineAmount(daysOverdue * 10.0);
        } else {
            issue.setFineAmount(0.0);
        }

        BookIssue updatedIssue = bookIssueRepository.save(issue);
        return ResponseEntity.ok(updatedIssue);
    }

    @GetMapping("/issues/student/{studentId}")
    public ResponseEntity<List<BookIssue>> getStudentIssues(@PathVariable Long studentId) {
        List<BookIssue> issues = bookIssueRepository.findByStudentId(studentId);
        return ResponseEntity.ok(issues);
    }
}
