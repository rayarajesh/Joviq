# Razorpay Integration - Visual Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐                                            │
│  │  Course Page     │                                            │
│  │  with "Enroll"   │                                            │
│  │     button       │                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────────────┐                               │
│  │  PaymentCheckout Component   │                               │
│  │  (React)                     │                               │
│  │                              │                               │
│  │  [Price Summary]             │                               │
│  │  Original: ₹1299.99          │                               │
│  │  Discount: -₹300.00          │                               │
│  │  Total:    ₹999.99           │                               │
│  │                              │                               │
│  │  [Pay Button]                │                               │
│  └────────┬─────────────────────┘                               │
│           │                                                       │
│           ▼ (Step 1)                                             │
│   Call API: POST /payment/create-order                           │
│           │                                                       │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (ASP.NET Core)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────┐                               │
│  │   PaymentController          │                               │
│  │   POST /create-order         │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
│            ▼                                                      │
│  ┌──────────────────────────────┐                               │
│  │   PaymentService             │                               │
│  │   - Validates request        │                               │
│  │   - Prepares metadata        │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
│            ▼                                                      │
│  ┌──────────────────────────────┐                               │
│  │   RazorpayService            │                               │
│  │   - HTTP request to Razorpay │                               │
│  │   - Basic Auth headers       │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
└────────────┼──────────────────────────────────────────────────────┘
             │
             ▼ (Step 2)
    ┌─────────────────────┐
    │  RAZORPAY API       │
    │                     │
    │ POST /v1/orders     │
    │                     │
    │ Returns:            │
    │ {                   │
    │  id: "order_XYZ",   │
    │  amount: 99999,     │
    │  currency: "INR"    │
    │ }                   │
    └────────┬────────────┘
             │
             ▼ (Step 3)
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Response)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────┐                               │
│  │   PaymentService             │                               │
│  │   - Create PaymentTransaction│                               │
│  │   - Return order details     │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
│            ▼ Response to frontend                                │
│  {                                                               │
│   paymentTransactionId: "guid",                                  │
│   orderId: "order_XYZ",                                          │
│   amount: 999.99,                                                │
│   keyId: "rzp_test_KEY"                                          │
│  }                                                               │
│            │                                                      │
└────────────┼──────────────────────────────────────────────────────┘
             │
             ▼ (Step 4)
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────┐                   │
│  │     Razorpay Checkout Modal              │                   │
│  │     (Loaded from CDN)                    │                   │
│  │                                          │                   │
│  │  [Select Payment Method]                 │                   │
│  │  ☑ Credit/Debit Card                    │                   │
│  │  ☑ UPI (Google Pay, PhonePe)            │                   │
│  │  ☑ Net Banking                          │                   │
│  │  ☑ Wallets                              │                   │
│  │                                          │                   │
│  │  Card Number: [4111 1111 1111 1111]     │                   │
│  │  Expiry: [12/25]                        │                   │
│  │  CVV: [123]                             │                   │
│  │                                          │                   │
│  │  [PAY ₹999.99]                          │                   │
│  └──────────────┬───────────────────────────┘                   │
│                 │                                                │
│                 ▼ (Step 5)                                       │
│        User completes payment                                    │
│                 │                                                │
│                 ▼ (Step 6)                                       │
│   Razorpay returns to browser:                                   │
│   {                                                              │
│    razorpay_order_id: "order_XYZ",                              │
│    razorpay_payment_id: "pay_ABC",                              │
│    razorpay_signature: "abcd1234..."                            │
│   }                                                              │
│                 │                                                │
└─────────────────┼────────────────────────────────────────────────┘
                  │
                  ▼ (Step 7)
          Call API: POST /payment/verify
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Verification)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────┐                               │
│  │   PaymentController          │                               │
│  │   POST /verify               │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
│            ▼                                                      │
│  ┌──────────────────────────────┐                               │
│  │   PaymentService             │                               │
│  │   - Verify signature         │                               │
│  │   - HMAC-SHA256 comparison   │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
│            ▼                                                      │
│  ┌──────────────────────────────┐                               │
│  │   RazorpayService            │                               │
│  │   - Get payment details      │                               │
│  │   - Confirm status           │                               │
│  └─────────┬────────────────────┘                               │
│            │                                                      │
└────────────┼──────────────────────────────────────────────────────┘
             │
             ▼ (Step 8)
    ┌─────────────────────┐
    │  RAZORPAY API       │
    │                     │
    │ GET /v1/payments/   │
    │     {paymentId}     │
    │                     │
    │ Returns payment     │
    │ details & status    │
    └────────┬────────────┘
             │
             ▼ (Step 9)
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Update)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Signature is VALID ✓                                            │
│                                                                   │
│  ┌──────────────────────────────┐                               │
│  │   Update Payment Status      │                               │
│  │   - Status: Verified         │                               │
│  │   - Save to database         │                               │
│  └────────┬─────────────────────┘                               │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────────────┐                               │
│  │   Update Enrollment Status   │                               │
│  │   - Status: Active           │                               │
│  │   - Grant course access      │                               │
│  └────────┬─────────────────────┘                               │
│           │                                                       │
│           ▼ Response to frontend                                 │
│  {                                                               │
│   isSuccessful: true,                                            │
│   message: "Payment verified",                                   │
│   enrollmentStatus: "Active"                                     │
│  }                                                               │
│           │                                                       │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼ (Step 10)
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────┐                               │
│  │  Success Callback Fires      │                               │
│  │  onSuccess({...response})    │                               │
│  └────────┬─────────────────────┘                               │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────────────┐                               │
│  │  Show Success Message        │                               │
│  │  "Enrollment Successful!"    │                               │
│  └────────┬─────────────────────┘                               │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────────────┐                               │
│  │  Redirect to Course          │                               │
│  │  /courses/[programId]/       │                               │
│  │   lessons                    │                               │
│  └──────────────────────────────┘                               │
│           │                                                       │
│           ▼                                                       │
│  🎓 Student now has full access to the course!                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
STEP 1: CREATE ORDER
========================================
Frontend                Backend          Razorpay
  │                       │                │
  │─── POST /create-order ──>               │
  │                       │                │
  │                       ├─ Create Order ─>
  │                       │                │
  │                       │<─ {order_id} ──┤
  │                       │                │
  │<─ {order_id, keyId} ──│                │
  │                       │                │

STEP 2: OPEN CHECKOUT
========================================
Frontend                              Razorpay
  │                                      │
  ├─ Load Razorpay Script ──────────────>│
  │<───────── checkout.js ───────────────┤
  │                                      │
  ├─ Initialize Checkout ────────────────>│
  │  with order_id and keyId             │
  │                                      │
  │<─── Open Modal ──────────────────────┤
  │                                      │

STEP 3: PAYMENT
========================================
Student                           Razorpay
  │                                  │
  ├─ Enter Card Details ────────────>│
  │                                  │
  ├─ Click Pay ───────────────────>  │
  │                                  │
  │<─── Process Payment ────────────┤
  │<─── Return: order_id,        │
  │      payment_id, signature ────┤
  │                                  │

STEP 4: VERIFY & UPDATE
========================================
Frontend                Backend          Razorpay
  │                       │                │
  │─ POST /verify ──────> │                │
  │  (with payment data)  │                │
  │                       │                │
  │                       ├─ GET payment ─>│
  │                       │                │
  │                       │<─ status:OK ──┤
  │                       │                │
  │                       ├─ Update DB    │
  │                       ├─ Update Enrollment
  │                       │                │
  │<─ {success: true} ────│                │
  │                       │                │
  │ Update UI & Redirect  │                │
```

---

## 🔄 Component Interaction

```
User Interface Layer
┌─────────────────────────────────────┐
│  PaymentCheckout Component          │
│  ├─ showPrice()                     │
│  ├─ handlePaymentClick()            │
│  └─ onSuccess/onError callbacks     │
└────────────┬────────────────────────┘
             │
             ▼ uses
┌─────────────────────────────────────┐
│  paymentService (TypeScript)        │
│  ├─ createPaymentOrder()            │
│  ├─ openCheckout()                  │
│  ├─ verifyPayment()                 │
│  └─ loadRazorpayScript()            │
└────────────┬────────────────────────┘
             │
             ▼ calls
┌─────────────────────────────────────┐
│  PaymentController (C#)             │
│  ├─ CreateOrder()                   │
│  ├─ VerifyPayment()                 │
│  ├─ GetConfig()                     │
│  └─ GetTransaction()                │
└────────────┬────────────────────────┘
             │
             ▼ uses
┌─────────────────────────────────────┐
│  PaymentService (C#)                │
│  ├─ CreatePaymentOrderAsync()       │
│  ├─ VerifyPaymentAsync()            │
│  └─ GetPaymentTransactionAsync()    │
└────────────┬────────────────────────┘
             │
             ▼ uses
┌─────────────────────────────────────┐
│  RazorpayService (C#)               │
│  ├─ CreateOrderAsync()              │
│  ├─ GetPaymentAsync()               │
│  ├─ VerifyPaymentSignatureAsync()   │
│  └─ RefundPaymentAsync()            │
└────────────┬────────────────────────┘
             │
             ▼ calls
┌─────────────────────────────────────┐
│  Razorpay REST API                  │
│  ├─ POST /v1/orders                 │
│  ├─ GET /v1/payments/{id}           │
│  └─ POST /v1/payments/{id}/refund   │
└─────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
CLIENT                           SERVER                    RAZORPAY
  │                                │                          │
  ├─ Create Order ────────────────>│                          │
  │                                ├─ POST /orders ──────────>│
  │                                │                          │
  │                                │<────── orderId ─────────┤
  │                                │                          │
  │<──── orderId, keyId ───────────│                          │
  │                                │                          │
  ├─ User Pays ────────────────────────────────────────────>│
  │                                │                          │
  │<───────── paymentId, signature ─────────────────────────┤
  │                                │                          │
  ├─ Verify Payment ──────────────>│                          │
  │  (send order_id,               │                          │
  │   payment_id, signature)       │                          │
  │                                │                          │
  │                                ├─ Verify Signature      │
  │                                │  (HMAC-SHA256)         │
  │                                │                          │
  │                                ├─ GET /payments/{id} ──>│
  │                                │                          │
  │                                │<──── status ───────────┤
  │                                │                          │
  │<───────── Success ─────────────│                          │
  │  (only if signature valid)     │                          │
```

---

## 📋 State Transitions

```
PaymentTransaction States
==========================

┌─────────┐
│ Pending │  (Order created, awaiting payment)
└────┬────┘
     │
     ├─────────────────┬─────────────────┐
     │                 │                 │
     ▼                 ▼                 ▼
┌─────────┐      ┌─────────┐      ┌───────────┐
│Verified │      │ Failed  │      │ Cancelled │
└─────────┘      └─────────┘      └───────────┘
(Payment OK)    (Payment Failed) (User Cancelled)
     │
     ▼
┌──────────────┐
│ Enrollment   │
│ Status:      │
│ Active       │
└──────────────┘
```

---

## 🎯 API Request/Response Examples

### Create Order Request
```
POST /api/payment/create-order
Authorization: Bearer {JWT_TOKEN}

{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "programId": "550e8400-e29b-41d4-a716-446655440001",
  "programPlanId": "550e8400-e29b-41d4-a716-446655440002",
  "enrollmentId": null,
  "amount": 999.99,
  "originalAmount": 1299.99,
  "discountAmount": 300.00,
  "couponCode": "SAVE20"
}
```

### Create Order Response
```
{
  "paymentTransactionId": "550e8400-e29b-41d4-a716-446655440003",
  "orderId": "order_LrsSiAubEzDdaq",
  "amount": 999.99,
  "currency": "INR",
  "keyId": "rzp_test_DGlQ7tLw8YDGZX",
  "notes": {
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "program_id": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 999.99
  }
}
```

### Verify Payment Request
```
POST /api/payment/verify

{
  "orderId": "order_LrsSiAubEzDdaq",
  "paymentId": "pay_LrsS1xLrsSiAubE",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

### Verify Payment Response
```
{
  "isSuccessful": true,
  "message": "Payment verified successfully",
  "paymentTransactionId": "550e8400-e29b-41d4-a716-446655440003",
  "enrollmentStatus": "Active"
}
```

---

## 🎨 UI Component Hierarchy

```
PaymentCheckout
├── Header
│   └── "Complete Payment"
├── Price Summary Section
│   ├── Original Amount: ₹1299.99
│   ├── Discount: -₹300.00
│   ├── Coupon Code: SAVE20
│   └── Total: ₹999.99
├── Error Message (if any)
│   └── "Payment failed: ..."
├── Accepted Payment Methods
│   ├── Credit/Debit Card
│   ├── UPI
│   ├── Internet Banking
│   ├── Wallets
│   └── BNPL
├── Payment Button
│   └── "Pay ₹999.99" (disabled while processing)
├── Cancel Button
│   └── "Cancel"
└── Security Info
    └── "🔒 Secured by Razorpay"
```

---

## 🚀 Deployment Architecture

```
Production Environment
======================

                    ┌─────────────────────┐
                    │   CDN / SSL         │
                    │   (Cloudflare)      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
        ▼                                             ▼
    ┌─────────┐                                  ┌─────────┐
    │Frontend │                                  │ Backend │
    │ (React) │                                  │(.NET)   │
    │ dist/   │                                  │ API     │
    └────┬────┘                                  └────┬────┘
         │                                            │
         ├──────────────────┬──────────────────┬──────┤
         │                  │                  │      │
         ▼                  ▼                  ▼      ▼
    ┌─────────┐         ┌─────────┐      ┌─────────┐
    │Hosted   │         │Payment  │      │Database │
    │on       │         │Service  │      │Postgre  │
    │Vercel   │         │Razorpay │      │SQL      │
    └─────────┘         └─────────┘      └─────────┘
```

---

This visual guide helps understand how Razorpay integrates with your Joviq LMS!
