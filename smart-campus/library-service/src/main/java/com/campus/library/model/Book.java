package com.campus.library.model;

import com.campus.common.multitenancy.TenantAware;
import jakarta.persistence.*;

/**
 * Entity representing a library Book.
 * Extends TenantAware to automatically isolate library inventory by campus (tenant_id).
 */
@Entity
@Table(name = "books")
public class Book extends TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String isbn;

    @Column(name = "available_copies", nullable = false)
    private int availableCopies;

    // Constructors
    public Book() {
        super();
    }

    public Book(String title, String author, String isbn, int availableCopies) {
        super();
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.availableCopies = availableCopies;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public int getAvailableCopies() {
        return availableCopies;
    }

    public void setAvailableCopies(int availableCopies) {
        this.availableCopies = availableCopies;
    }
}
