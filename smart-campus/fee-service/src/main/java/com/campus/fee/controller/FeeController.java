package com.campus.fee.controller;

import com.campus.fee.model.FeeStructure;
import com.campus.fee.model.Payment;
import com.campus.fee.repository.FeeStructureRepository;
import com.campus.fee.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    private final FeeStructureRepository feeStructureRepository;
    private final PaymentRepository paymentRepository;

    @Autowired
    public FeeController(FeeStructureRepository feeStructureRepository, PaymentRepository paymentRepository) {
        this.feeStructureRepository = feeStructureRepository;
        this.paymentRepository = paymentRepository;
    }

    @PostMapping("/structure")
    public ResponseEntity<FeeStructure> createFeeStructure(@RequestBody FeeStructure structure) {
        if (structure.getAcademicYear() == null || structure.getAmount() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        FeeStructure savedStructure = feeStructureRepository.save(structure);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedStructure);
    }

    @PostMapping("/pay")
    public ResponseEntity<?> payFees(@RequestBody Payment paymentRequest) {
        if (paymentRequest.getStudentId() == null || paymentRequest.getFeeStructureId() == null || paymentRequest.getAmountPaid() <= 0) {
            return ResponseEntity.badRequest().body("Student ID, Fee Structure ID, and Amount Paid are required.");
        }

        Optional<FeeStructure> structureOpt = feeStructureRepository.findById(paymentRequest.getFeeStructureId());
        if (structureOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Fee Structure not found.");
        }

        // Generate unique receipt number
        String receiptNumber = "REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        paymentRequest.setReceiptNumber(receiptNumber);
        
        if (paymentRequest.getPaymentDate() == null) {
            paymentRequest.setPaymentDate(LocalDate.now());
        }

        Payment savedPayment = paymentRepository.save(paymentRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPayment);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Payment>> getStudentPayments(@PathVariable Long studentId) {
        List<Payment> payments = paymentRepository.findByStudentId(studentId);
        return ResponseEntity.ok(payments);
    }
}
