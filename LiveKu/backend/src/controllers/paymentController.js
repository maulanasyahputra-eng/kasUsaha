const crypto = require("crypto");

const {
    pool
} = require("../config/database");


// ========================================
// CREATE PAYMENT
// ========================================

async function createPayment(req, res) {

    try {

        const userId =
            req.user.id;

        const email =
            req.user.email;

        const amount =
            Number(req.body.amount);


        if (!Number.isFinite(amount)) {

            return res.status(400).json({
                success: false,
                message: "Nominal tidak valid"
            });

        }


        if (amount < 10000) {

            return res.status(400).json({
                success: false,
                message:
                    "Minimal deposit Rp10.000"
            });

        }


        // Rp100 = 1 Coin

        const coinAmount =
            Math.floor(amount / 100);


        const orderId =
            "LIVEKU-" +
            Date.now() +
            "-" +
            userId;


        const serverKey =
            process.env.MIDTRANS_SERVER_KEY;


        if (!serverKey) {

            return res.status(500).json({
                success: false,
                message:
                    "MIDTRANS_SERVER_KEY belum diatur"
            });

        }


        const auth =
            Buffer
                .from(serverKey + ":")
                .toString("base64");


        const response =
            await fetch(
                "https://app.sandbox.midtrans.com/snap/v1/transactions",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Basic ${auth}`

                    },

                    body: JSON.stringify({

                        transaction_details: {

                            order_id:
                                orderId,

                            gross_amount:
                                amount

                        },

                        customer_details: {

                            first_name:
                                req.user.username ||
                                "LiveKu User",

                            email:
                                email

                        }

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "MIDTRANS ERROR:",
                data
            );


            return res.status(500).json({

                success: false,

                message:
                    "Gagal membuat pembayaran Midtrans",

                error:
                    data

            });

        }


        // ====================================
        // SIMPAN PAYMENT
        // ====================================

        await pool.execute(
            `
            INSERT INTO payments
            (
                user_id,
                order_id,
                amount,
                coin_amount,
                transaction_status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userId,
                orderId,
                amount,
                coinAmount,
                "pending"
            ]
        );


        return res.json({

            success: true,

            message:
                "Pembayaran berhasil dibuat",

            payment: {

                order_id:
                    orderId,

                amount:
                    amount,

                coin_amount:
                    coinAmount,

                token:
                    data.token,

                redirect_url:
                    data.redirect_url

            }

        });


    } catch (error) {

        console.error(
            "CREATE PAYMENT ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal membuat pembayaran",

            error:
                error.message

        });

    }

}


// ========================================
// GET PAYMENTS
// ========================================

async function getPayments(req, res) {

    try {

        const userId =
            req.user.id;


        const [
            rows
        ] = await pool.execute(
            `
            SELECT
                id,
                order_id,
                amount,
                coin_amount,
                transaction_status,
                payment_type,
                created_at
            FROM payments
            WHERE user_id = ?
            ORDER BY id DESC
            `,
            [userId]
        );


        return res.json({

            success: true,

            payments:
                rows

        });


    } catch (error) {

        console.error(
            "GET PAYMENTS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil pembayaran",

            error:
                error.message

        });

    }

}


// ========================================
// MIDTRANS WEBHOOK
// ========================================

async function midtransWebhook(req, res) {

    const connection =
        await pool.getConnection();


    try {

        const {

            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            fraud_status,
            payment_type

        } = req.body;


        if (
            !order_id ||
            !status_code ||
            !gross_amount ||
            !signature_key
        ) {

            connection.release();

            return res.status(400).json({

                success: false,

                message:
                    "Data webhook tidak lengkap"

            });

        }


        // ====================================
        // VALIDATE SIGNATURE
        // ====================================

        const serverKey =
            process.env.MIDTRANS_SERVER_KEY;


        const signature =
            crypto
                .createHash("sha512")
                .update(
                    order_id +
                    status_code +
                    gross_amount +
                    serverKey
                )
                .digest("hex");


        if (
            signature !==
            signature_key
        ) {

            connection.release();

            return res.status(401).json({

                success: false,

                message:
                    "Signature tidak valid"

            });

        }


        await connection.beginTransaction();


        // ====================================
        // GET PAYMENT
        // ====================================

        const [
            payments
        ] = await connection.execute(
            `
            SELECT *
            FROM payments
            WHERE order_id = ?
            FOR UPDATE
            `,
            [order_id]
        );


        if (
            payments.length === 0
        ) {

            await connection.rollback();

            connection.release();

            return res.status(404).json({

                success: false,

                message:
                    "Payment tidak ditemukan"

            });

        }


        const payment =
            payments[0];


        // ====================================
        // CEGAH DOUBLE SALDO
        // ====================================

        if (
            payment.transaction_status ===
            "settlement"
        ) {

            await connection.rollback();

            connection.release();

            return res.json({

                success: true,

                message:
                    "Payment sudah diproses"

            });

        }


        // ====================================
        // UPDATE PAYMENT
        // ====================================

        await connection.execute(
            `
            UPDATE payments
            SET
                transaction_status = ?,
                status_code = ?,
                fraud_status = ?,
                payment_type = ?
            WHERE id = ?
            `,
            [
                transaction_status,
                status_code,
                fraud_status || null,
                payment_type || null,
                payment.id
            ]
        );


        // ====================================
        // PEMBAYARAN BERHASIL
        // ====================================

        const paid =
            transaction_status ===
            "settlement";


        if (paid) {

            // =================================
            // UPDATE WALLET
            // =================================

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
                    payment.coin_amount,
                    payment.amount,
                    payment.user_id
                ]
            );


            // =================================
            // CATAT TRANSAKSI
            // =================================

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
                    payment.user_id,
                    "deposit",
                    payment.amount,
                    payment.coin_amount,
                    "Deposit Midtrans " +
                    payment.order_id
                ]
            );

        }


        await connection.commit();

        connection.release();


        return res.json({

            success: true,

            message:
                "Webhook berhasil diproses"

        });


    } catch (error) {

        try {

            await connection.rollback();

        } catch (_) {}

        connection.release();


        console.error(
            "WEBHOOK ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Webhook gagal diproses",

            error:
                error.message

        });

    }

}


// ========================================
// EXPORT
// ========================================

module.exports = {

    createPayment,

    getPayments,

    midtransWebhook

};