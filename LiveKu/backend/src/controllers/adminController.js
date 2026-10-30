const { pool } = require("../config/database");


// ========================================
// DASHBOARD
// ========================================

async function dashboard(req, res) {

    try {

        const [[users]] = await pool.execute(
            `SELECT COUNT(*) AS total FROM users`
        );

        const [[wallet]] = await pool.execute(
            `
            SELECT
                COALESCE(SUM(coin_balance), 0) AS total_coin,
                COALESCE(SUM(cash_balance), 0) AS total_balance
            FROM wallets
            `
        );

        const [[deposits]] = await pool.execute(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(amount), 0) AS amount
            FROM payments
            WHERE transaction_status = 'settlement'
            `
        );

        const [[withdraws]] = await pool.execute(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(amount), 0) AS amount
            FROM withdrawals
            WHERE status = 'pending'
            `
        );

        res.json({
            success: true,
            statistics: {
                users: Number(users.total),
                coins: Number(wallet.total_coin),
                balance: Number(wallet.total_balance),
                deposits: Number(deposits.total),
                deposit_amount: Number(deposits.amount),
                pending_withdraws: Number(withdraws.total),
                pending_withdraw_amount: Number(withdraws.amount)
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil dashboard",
            error: error.message
        });
    }
}


// ========================================
// USERS
// ========================================

async function users(req, res) {

    try {

        const [rows] = await pool.execute(
            `
            SELECT
                u.id,
                u.username,
                u.email,
                u.created_at,
                COALESCE(w.coin_balance, 0) AS coin_balance,
                COALESCE(w.cash_balance, 0) AS cash_balance
            FROM users u
            LEFT JOIN wallets w
                ON w.user_id = u.id
            ORDER BY u.id DESC
            `
        );

        res.json({
            success: true,
            users: rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil users",
            error: error.message
        });
    }
}


// ========================================
// DEPOSITS
// ========================================

async function deposits(req, res) {

    try {

        const [rows] = await pool.execute(
            `
            SELECT
                p.id,
                p.order_id,
                p.amount,
                p.coin_amount,
                p.transaction_status,
                p.payment_type,
                p.created_at,
                u.username,
                u.email
            FROM payments p
            LEFT JOIN users u
                ON u.id = p.user_id
            ORDER BY p.id DESC
            `
        );

        res.json({
            success: true,
            deposits: rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil deposit",
            error: error.message
        });
    }
}


// ========================================
// WITHDRAWS
// ========================================

async function withdraws(req, res) {

    try {

        const [rows] = await pool.execute(
            `
            SELECT
                w.id,
                w.user_id,
                w.amount,
                w.bank_name,
                w.account_number,
                w.account_name,
                w.status,
                w.admin_note,
                w.created_at,
                u.username,
                u.email
            FROM withdrawals w
            LEFT JOIN users u
                ON u.id = w.user_id
            ORDER BY w.id DESC
            `
        );

        res.json({
            success: true,
            withdraws: rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil withdraw",
            error: error.message
        });
    }
}


// ========================================
// APPROVE WITHDRAW
// ========================================

async function approveWithdraw(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const id =
            Number(req.params.id);

        await connection.beginTransaction();

        const [rows] =
            await connection.execute(
                `
                SELECT *
                FROM withdrawals
                WHERE id = ?
                FOR UPDATE
                `,
                [id]
            );

        if (rows.length === 0) {

            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Withdraw tidak ditemukan"
            });
        }

        const withdraw = rows[0];

        if (withdraw.status !== "pending") {

            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Withdraw sudah diproses"
            });
        }

        await connection.execute(
            `
            UPDATE withdrawals
            SET
                status = 'approved',
                admin_note = 'Withdraw disetujui'
            WHERE id = ?
            `,
            [id]
        );

        await connection.commit();

        connection.release();

        res.json({
            success: true,
            message:
                "Withdraw berhasil disetujui"
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Gagal approve withdraw",
            error: error.message
        });
    }
}


// ========================================
// REJECT WITHDRAW
// ========================================

async function rejectWithdraw(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const id =
            Number(req.params.id);

        await connection.beginTransaction();

        const [rows] =
            await connection.execute(
                `
                SELECT *
                FROM withdrawals
                WHERE id = ?
                FOR UPDATE
                `,
                [id]
            );

        if (rows.length === 0) {

            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Withdraw tidak ditemukan"
            });
        }

        const withdraw = rows[0];

        if (withdraw.status !== "pending") {

            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "Withdraw sudah diproses"
            });
        }

        // Kembalikan saldo

        await connection.execute(
            `
            UPDATE wallets
            SET cash_balance =
                cash_balance + ?
            WHERE user_id = ?
            `,
            [
                withdraw.amount,
                withdraw.user_id
            ]
        );

        await connection.execute(
            `
            UPDATE withdrawals
            SET
                status = 'rejected',
                admin_note = 'Withdraw ditolak'
            WHERE id = ?
            `,
            [id]
        );

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
                withdraw.user_id,
                "withdraw_refund",
                withdraw.amount,
                0,
                "Refund withdraw #" + id
            ]
        );

        await connection.commit();

        connection.release();

        res.json({
            success: true,
            message:
                "Withdraw ditolak dan saldo dikembalikan"
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Gagal reject withdraw",
            error: error.message
        });
    }
}


module.exports = {
    dashboard,
    users,
    deposits,
    withdraws,
    approveWithdraw,
    rejectWithdraw
};