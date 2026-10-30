const express = require("express");

const router =
    express.Router();


const paymentController =
    require("../controllers/paymentController");


const authMiddleware =
    require("../middleware/authMiddleware");


// ========================================
// CREATE MIDTRANS PAYMENT
// ========================================

router.post(
    "/create",
    authMiddleware,
    paymentController.createPayment
);


// ========================================
// PAYMENT HISTORY
// ========================================

router.get(
    "/",
    authMiddleware,
    paymentController.getPayments
);


// ========================================
// MIDTRANS WEBHOOK
// ========================================

router.post(
    "/webhook",
    paymentController.midtransWebhook
);


module.exports = router;