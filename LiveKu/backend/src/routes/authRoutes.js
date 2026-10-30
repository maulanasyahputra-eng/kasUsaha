const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Auth route berhasil"
    });
});

router.post("/register", authController.register);

router.post("/login", authController.login);

module.exports = router;