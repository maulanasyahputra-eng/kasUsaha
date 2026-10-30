const express = require("express");

const router = express.Router();

const withdrawController =
    require("../controllers/withdrawController");

const authMiddleware =
    require("../middleware/authMiddleware");


// ========================================
// CEK CONTROLLER
// ========================================

if (
    typeof withdrawController.createWithdraw !==
    "function"
) {
    throw new Error(
        "withdrawController.createWithdraw bukan function"
    );
}


if (
    typeof withdrawController.getWithdraws !==
    "function"
) {
    throw new Error(
        "withdrawController.getWithdraws bukan function"
    );
}

// TAMBAHKAN CEK UNTUK UPDATE STATUS
if (
    typeof withdrawController.updateWithdrawStatus !==
    "function"
) {
    throw new Error(
        "withdrawController.updateWithdrawStatus bukan function"
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
// CREATE WITHDRAW (USER)
// ========================================

router.post(
    "/",
    authMiddleware,
    withdrawController.createWithdraw
);


// ========================================
// WITHDRAW HISTORY (USER)
// ========================================

router.get(
    "/",
    authMiddleware,
    withdrawController.getWithdraws
);


// ========================================
// UPDATE STATUS WITHDRAW / REJECT & REFUND (ADMIN)
// ========================================
router.put(
    "/:id/status",
    authMiddleware,
    withdrawController.updateWithdrawStatus
);


module.exports = router;