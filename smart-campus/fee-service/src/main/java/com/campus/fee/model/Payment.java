package com.campus.fee.model;

import com.campus.common.multitenancy.TenantAware;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Entity representing a fee payment.
 * Extends TenantAware to automatically isolate receipts by campus (tenant_id).
 */
@Entity
@Table(name = "payments")
public class Payment extends TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "fee_structure_id", nullable = false)
    private Long feeStructureId;

    @Column(name = "amount_paid", nullable = false)
    private double amountPaid;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "receipt_number", nullable = false)
    private String receiptNumber;

    // Constructors
    public Payment() {
        super();
    }

    public Payment(Long studentId, Long feeStructureId, double amountPaid, String receiptNumber) {
        super();
        this.studentId = studentId;
        this.feeStructureId = feeStructureId;
        this.amountPaid = amountPaid;
        this.paymentDate = LocalDate.now();
        this.receiptNumber = receiptNumber;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getFeeStructureId() {
        return feeStructureId;
    }

    public void setFeeStructureId(Long feeStructureId) {
        this.feeStructureId = feeStructureId;
    }

    public double getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(double amountPaid) {
        this.amountPaid = amountPaid;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }
}
