require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { testDatabase } =
    require("./config/database");

const healthRoutes =
    require("./routes/healthRoutes");

const authRoutes =
    require("./routes/authRoutes");

const walletRoutes =
    require("./routes/walletRoutes");

const paymentRoutes =
    require("./routes/paymentRoutes");

const withdrawRoutes =
    require("./routes/withdrawRoutes");

const adminRoutes =
    require("./routes/adminRoutes");


const app = express();

const PORT =
    process.env.PORT || 5000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ========================================
// ROOT
// ========================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        application:
            "LiveKu API",

        version:
            "1.0.0",

        message:
            "Backend LiveKu aktif",

        status:
            "online"

    });

});


// ========================================
// HEALTH
// ========================================

app.use(
    "/api/health",
    healthRoutes
);


// ========================================
// AUTH
// ========================================

app.use(
    "/api/auth",
    authRoutes
);


// ========================================
// WALLET
// ========================================

app.use(
    "/api/wallet",
    walletRoutes
);


// ========================================
// PAYMENT / MIDTRANS
// ========================================

app.use(
    "/api/payment",
    paymentRoutes
);


// ========================================
// WITHDRAW
// ========================================

app.use(
    "/api/withdraw",
    withdrawRoutes
);


// ========================================
// ADMIN
// ========================================

app.use(
    "/api/admin",
    adminRoutes
);


// ========================================
// 404
// ========================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Endpoint tidak ditemukan",

            path:
                req.originalUrl

        });

    }
);


// ========================================
// ERROR HANDLER
// ========================================

app.use(
    (err, req, res, next) => {

        console.error("");
        console.error(
            "========== SERVER ERROR =========="
        );

        console.error(err);

        console.error(
            "=================================="
        );

        console.error("");


        res.status(500).json({

            success: false,

            message:
                "Terjadi kesalahan pada server",

            error:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined

        });

    }
);


// ========================================
// START SERVER
// ========================================

async function startServer() {

    console.log("");

    console.log(
        "Memulai LiveKu Backend..."
    );

    console.log("");


    // ====================================
    // DATABASE
    // ====================================

    const databaseConnected =
        await testDatabase();


    if (!databaseConnected) {

        console.error("");

        console.error(
            "=================================="
        );

        console.error(
            "DATABASE GAGAL TERHUBUNG"
        );

        console.error(
            "=================================="
        );

        console.error(
            "Periksa XAMPP MySQL."
        );

        console.error(
            "Periksa konfigurasi .env."
        );

        console.error("");

        process.exit(1);

    }


    // ====================================
    // START EXPRESS
    // ====================================

    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log("");

            console.log(
                "=================================="
            );

            console.log(
                "       LIVEKU BACKEND"
            );

            console.log(
                "=================================="
            );

            console.log(
                `Server   : http://localhost:${PORT}`
            );

            console.log(
                `Health   : http://localhost:${PORT}/api/health`
            );

            console.log(
                `Auth     : http://localhost:${PORT}/api/auth`
            );

            console.log(
                `Wallet   : http://localhost:${PORT}/api/wallet`
            );

            console.log(
                `Payment  : http://localhost:${PORT}/api/payments`
            );

            console.log(
                `Withdraw : http://localhost:${PORT}/api/withdraw`
            );

            console.log(
                `Admin    : http://localhost:${PORT}/api/admin`
            );

            console.log(
                "Database : connected"
            );

            console.log(
                "Status   : ONLINE"
            );

            console.log(
                "=================================="
            );

            console.log("");

            console.log(
                "Routes aktif:"
            );

            console.log("");


            // =================================
            // GENERAL
            // =================================

            console.log(
                "GET  /"
            );

            console.log(
                "GET  /api/health"
            );


            // =================================
            // AUTH
            // =================================

            console.log(
                "GET  /api/auth/test"
            );

            console.log(
                "POST /api/auth/register"
            );

            console.log(
                "POST /api/auth/login"
            );


            // =================================
            // WALLET
            // =================================

            console.log(
                "GET  /api/wallet"
            );

            console.log(
                "GET  /api/wallet/transactions"
            );

            console.log(
                "POST /api/wallet/development-topup"
            );


            // =================================
            // PAYMENT
            // =================================

            console.log(
                "POST /api/payments/create"
            );

            console.log(
                "GET  /api/payments"
            );

            console.log(
                "POST /api/payments/webhook"
            );


            // =================================
            // WITHDRAW
            // =================================

            console.log(
                "POST /api/withdraw"
            );

            console.log(
                "GET  /api/withdraw"
            );


            // =================================
            // ADMIN
            // =================================

            console.log(
                "GET  /api/admin/dashboard"
            );

            console.log(
                "GET  /api/admin/users"
            );

            console.log(
                "GET  /api/admin/deposits"
            );

            console.log(
                "GET  /api/admin/withdraws"
            );

            console.log(
                "POST /api/admin/withdraws/:id/approve"
            );

            console.log(
                "POST /api/admin/withdraws/:id/reject"
            );

            console.log("");

            console.log(
                "=================================="
            );

            console.log(
                "LiveKu siap digunakan."
            );

            console.log(
                "=================================="
            );

            console.log("");

        }
    );

}


// ========================================
// RUN
// ========================================

startServer();