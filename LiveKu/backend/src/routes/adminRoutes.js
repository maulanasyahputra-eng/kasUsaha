const express = require("express");

const router = express.Router();

const adminController =
    require("../controllers/adminController");


// Dashboard
router.get(
    "/dashboard",
    adminController.dashboard
);


// Users
router.get(
    "/users",
    adminController.users
);


// Deposits
router.get(
    "/deposits",
    adminController.deposits
);


// Withdraws
router.get(
    "/withdraws",
    adminController.withdraws
);


// Approve
router.post(
    "/withdraws/:id/approve",
    adminController.approveWithdraw
);


// Reject
router.post(
    "/withdraws/:id/reject",
    adminController.rejectWithdraw
);


module.exports = router;