const { pool } =
    require("../config/database");
const axios = require("axios");


// ========================================
// GET WALLET
// ========================================

async function getWallet(req, res) {

    try {

        const userId =
            req.user.id;


        const [
            rows
        ] = await pool.execute(
            `
            SELECT
                id,
                user_id,
                coin_balance,
                cash_balance,
                created_at,
                updated_at
            FROM wallets
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Wallet tidak ditemukan"

            });

        }


        return res.json({

            success: true,

            wallet: rows[0]

        });


    } catch (error) {

        console.error(
            "Get wallet error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil wallet",

            error:
                error.message

        });

    }

}


// ========================================
// GET WALLET TRANSACTIONS
// ========================================

async function getTransactions(req, res) {

    try {

        const userId =
            req.user.id;


        const [
            rows
        ] = await pool.execute(
            `
            SELECT
                id,
                user_id,
                type,
                amount,
                coin_amount,
                description,
                created_at
            FROM wallet_transactions
            WHERE user_id = ?
            ORDER BY id DESC
            `,
            [userId]
        );


        return res.json({

            success: true,

            transactions:
                rows

        });


    } catch (error) {

        console.error(
            "Get transactions error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil transaksi",

            error:
                error.message

        });

    }

}


// ========================================
// DEVELOPMENT TOPUP
// ========================================

async function developmentTopup(req, res) {

    const connection =
        await pool.getConnection();


    try {

        const userId =
            req.user.id;


        const amount =
            Number(req.body.amount);


        if (
            !Number.isFinite(amount)
        ) {

            connection.release();

            return res.status(400).json({

                success: false,

                message:
                    "Nominal tidak valid"

            });

        }


        if (amount < 1000) {

            connection.release();

            return res.status(400).json({

                success: false,

                message:
                    "Minimal top up Rp1.000"

            });

        }


        /*
         * DEVELOPMENT RATE
         *
         * Rp100 = 1 Coin
         */

        const coinAmount =
            Math.floor(
                amount / 100
            );


        await connection.beginTransaction();


        // ====================================
        // LOCK WALLET
        // ====================================

        const [
            walletRows
        ] = await connection.execute(
            `
            SELECT *
            FROM wallets
            WHERE user_id = ?
            FOR UPDATE
            `,
            [userId]
        );


        if (
            walletRows.length === 0
        ) {

            await connection.execute(
                `
                INSERT INTO wallets
                (
                    user_id,
                    coin_balance,
                    cash_balance
                )
                VALUES (?, ?, ?)
                `,
                [
                    userId,
                    coinAmount,
                    amount
                ]
            );

        } else {

            await connection.execute(
                `
                UPDATE wallets
                SET
                    coin_balance =
                        coin_balance + ?,

                    cash_balance =
                        cash_balance + ?

                WHERE user_id = ?
                `,
                [
                    coinAmount,
                    amount,
                    userId
                ]
            );

        }


        // ====================================
        // TRANSACTION
        // ====================================

        await connection.execute(
            `
            INSERT INTO wallet_transactions
            (
                user_id,
                type,
                amount,
                coin_amount,
                description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,

                "topup",

                amount,

                coinAmount,

                "Development Top Up"
            ]
        );


        await connection.commit();


        // ====================================
        // AMBIL WALLET TERBARU
        // ====================================

        const [
            updatedWallet
        ] = await connection.execute(
            `
            SELECT
                id,
                user_id,
                coin_balance,
                cash_balance,
                created_at,
                updated_at
            FROM wallets
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );


        connection.release();


        return res.json({

            success: true,

            message:
                "Saldo berhasil ditambahkan",

            wallet:
                updatedWallet[0]

        });


    } catch (error) {

        await connection.rollback();

        connection.release();


        console.error(
            "Development topup error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal menambahkan saldo",

            error:
                error.message

        });

    }

}


// ========================================
// CREATE MIDTRANS PAYMENT
// ========================================

async function createPayment(req, res) {

    try {

        const userId = req.user.id;

        const amount = Number(req.body.amount);


        if (!Number.isFinite(amount) || amount < 1000) {

            return res.status(400).json({

                success: false,

                message: "Minimal top up adalah Rp 1.000"

            });

        }


        const coinAmount = Math.floor(amount / 100);

        const orderId = "ORDER-" + userId + "-" + Date.now();


        const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

        const base64ServerKey = Buffer.from(serverKey + ":").toString("base64");


        const parameter = {

            transaction_details: {

                order_id: orderId,

                gross_amount: amount

            },

            customer_details: {

                first_name: req.user.username || "User"

            }

        };


        const midtransResponse = await axios.post(

            "https://app.sandbox.midtrans.com/snap/v1/transactions",

            parameter,

            {

                headers: {

                    "Content-Type": "application/json",

                    "Accept": "application/json",

                    "Authorization": "Basic " + base64ServerKey

                }

            }

        );


        const { token, redirect_url } = midtransResponse.data;


        await pool.execute(

            `INSERT INTO payments (user_id, order_id, amount, coin_amount, transaction_status) VALUES (?, ?, ?, ?, ?)`,

            [userId, orderId, amount, coinAmount, "pending"]

        );


        return res.json({

            success: true,

            message: "Berhasil membuat link pembayaran",

            payment: {

                order_id: orderId,

                token: token,

                redirect_url: redirect_url

            }

        });


    } catch (error) {

        console.error("Create payment error:", error.response?.data || error.message);

        return res.status(500).json({

            success: false,

            message: "Gagal membuat pembayaran Midtrans",

            error: error.message

        });

    }

}


// ========================================
// MIDTRANS WEBHOOK
// ========================================

async function midtransWebhook(req, res) {

    const connection = await pool.getConnection();

    try {

        const notification = req.body;

        const orderId = notification.order_id;

        const transactionStatus = notification.transaction_status;

        const fraudStatus = notification.fraud_status;


        let isPaid = false;

        if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {

            isPaid = true;

        }


        if (isPaid) {

            await connection.beginTransaction();


            const [rows] = await connection.execute(

                `SELECT * FROM payments WHERE order_id = ? FOR UPDATE`,

                [orderId]

            );


            if (rows.length > 0) {

                const payment = rows[0];


                if (payment.transaction_status !== "settlement" && payment.transaction_status !== "success") {

                    await connection.execute(

                        `UPDATE payments SET transaction_status = 'settlement' WHERE order_id = ?`,

                        [orderId]

                    );


                    await connection.execute(

                        `UPDATE wallets SET coin_balance = coin_balance + ?, cash_balance = cash_balance + ? WHERE user_id = ?`,

                        [payment.coin_amount, payment.amount, payment.user_id]

                    );


                    await connection.execute(

                        `INSERT INTO wallet_transactions (user_id, type, amount, coin_amount, description) VALUES (?, ?, ?, ?, ?)`,

                        [payment.user_id, "topup", payment.amount, payment.coin_amount, "Top Up via Midtrans (" + orderId + ")"]

                    );

                }

            }


            await connection.commit();

        }


        connection.release();

        return res.status(200).json({ status: "OK" });


    } catch (error) {

        await connection.rollback();

        connection.release();

        console.error("Webhook error:", error);

        return res.status(500).json({ success: false, error: error.message });

    }

}


// ========================================
// EXPORT
// ========================================

module.exports = {

    getWallet,

    getTransactions,

    developmentTopup,

    createPayment,

    node: undefined, // (opsional, biarkan function saja di bawah)
    midtransWebhook

};