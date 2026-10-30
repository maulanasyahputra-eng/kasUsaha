const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getVerificationRequests,
    reviewVerification,
    getUsers
} = require("../controllers/adminController");

const router = express.Router();

router.use(
    authMiddleware,
    adminMiddleware
);

router.get(
    "/users",
    getUsers
);

router.get(
    "/verification",
    getVerificationRequests
);

router.put(
    "/verification/:id",
    reviewVerification
);

module.exports = router;