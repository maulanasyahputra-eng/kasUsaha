const express = require("express");

const {
    sendOTP,
    verifyOTP,
    me,
    updateProfile
} = require("../controllers/authController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


/* =========================================
   SEND OTP
========================================= */

router.post(
    "/send-otp",
    sendOTP
);


/* =========================================
   VERIFY OTP
========================================= */

router.post(
    "/verify-otp",
    verifyOTP
);


/* =========================================
   CURRENT USER
========================================= */

router.get(
    "/me",
    authMiddleware,
    me
);


/* =========================================
   UPDATE PROFILE
========================================= */

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);


/* =========================================
   LOGOUT
========================================= */

router.post(
    "/logout",
    authMiddleware,
    (req, res) => {

        return res.json({
            success: true,
            message: "Logout berhasil"
        });

    }
);


module.exports = router;