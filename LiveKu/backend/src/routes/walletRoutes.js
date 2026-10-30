const express = require("express");

const router = express.Router();

const walletController =
    require("../controllers/walletController");

const authMiddleware =
    require("../middleware/authMiddleware");


// ========================================
// CEK CONTROLLER
// ========================================

if (
    typeof walletController.getWallet !==
    "function"
) {
    throw new Error(
        "walletController.getWallet bukan function"
    );
}

if (
    typeof walletController.getTransactions !==
    "function"
) {
    throw new Error(
        "walletController.getTransactions bukan function"
    );
}

if (
    typeof walletController.developmentTopup !==
    "function"
) {
    throw new Error(
        "walletController.developmentTopup bukan function"
    );
}

// ========================================
// CEK CONTROLLER MIDTRANS (TAMBAHAN)
// ========================================

if (
    typeof walletController.createPayment !==
    "function"
) {
    throw new Error(
        "walletController.createPayment bukan function"
    );
}

if (
    typeof walletController.midtransWebhook !==
    "function"
) {
    throw new Error(
        "walletController.midtransWebhook bukan function"
    );
}

if (
    typeof authMiddleware !==
    "function"
) {
    throw new Error(
        "authMiddleware bukan function"
    );
}


// ========================================
// GET WALLET
// ========================================

router.get(
    "/",
    authMiddleware,
    walletController.getWallet
);


// ========================================
// GET TRANSACTIONS
// ========================================

router.get(
    "/transactions",
    authMiddleware,
    walletController.getTransactions
);


// ========================================
// DEVELOPMENT TOPUP
// ========================================

router.post(
    "/development-topup",
    authMiddleware,
    walletController.developmentTopup
);


// ========================================
// MIDTRANS PAYMENT (TAMBAHAN RUTE)
// ========================================

router.post(
    "/create",
    authMiddleware,
    walletController.createPayment
);

router.post(
    "/webhook",
    walletController.midtransWebhook
);


module.exports = router;