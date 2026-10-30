const express = require("express");

const {
    requestVerification,
    verificationStatus
} = require("../controllers/verificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/request",
    authMiddleware,
    requestVerification
);

router.get(
    "/status",
    authMiddleware,
    verificationStatus
);

module.exports = router;