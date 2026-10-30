const { pool } = require("../config/database");

// ========================================
// 1. REQUEST WITHDRAW (USER)
// ========================================

async function createWithdraw(req, res) {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;

        const {
            amount,
            bank_name,
            account_number,
            account_name
        } = req.body;

        const withdrawAmount = Number(amount);

        if (!Number.isFinite(withdrawAmount)) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Nominal withdraw tidak valid"
            });
        }

        if (withdrawAmount < 50000) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Minimal withdraw Rp50.000"
            });
        }

        if (
            !bank_name ||
            !account_number ||
            !account_name
        ) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Data rekening wajib diisi"
            });
        }

        // ========================================
        // KONVERSI NOMINAL KE KOIN (1 koin = Rp 100)
        // ========================================
        const coinToDeduct = Number(withdrawAmount / 100);

        await connection.beginTransaction();

        // ========================================
        // LOCK WALLET
        // ========================================
        const [walletRows] = await connection.execute(
            `
            SELECT *
            FROM wallets
            WHERE user_id = ?
            FOR UPDATE
            `,
            [userId]
        );

        if (walletRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({
                success: false,
                message: "Wallet tidak ditemukan"
            });
        }

        const wallet = walletRows[0];
        const currentBalance = Number(wallet.cash_balance || 0);
        const currentCoin = Number(wallet.coin_balance || 0);

        if (currentBalance < withdrawAmount) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Saldo cash tidak mencukupi"
            });
        }

        if (currentCoin < coinToDeduct) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Koin tidak mencukupi untuk melakukan withdraw ini"
            });
        }

        // ========================================
        // KURANGI SALDO CASH DAN KOIN SEKALIGUS
        // ========================================
        const [updateWallet] = await connection.execute(
            `
            UPDATE wallets
            SET cash_balance = cash_balance - ?,
                coin_balance = coin_balance - ?
            WHERE user_id = ?
            `,
            [
                withdrawAmount,
                coinToDeduct,
                userId
            ]
        );

        console.log("Create Withdraw - Update Wallet Affected Rows:", updateWallet.affectedRows);

        // ========================================
        // SIMPAN WITHDRAW
        // ========================================
        const [result] = await connection.execute(
            `
            INSERT INTO withdrawals
            (
                user_id,
                amount,
                bank_name,
                account_number,
                account_name,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                userId,
                withdrawAmount,
                bank_name,
                account_number,
                account_name,
                "pending"
            ]
        );

        // ========================================
        // TRANSAKSI WALLET (CATAT CASH & KOIN KELUAR)
        // ========================================
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
                "withdraw",
                -withdrawAmount,
                -coinToDeduct,
                "Withdraw #" + result.insertId
            ]
        );

        await connection.commit();
        connection.release();

        return res.json({
            success: true,
            message: "Permintaan withdraw berhasil dibuat",
            withdraw: {
                id: result.insertId,
                amount: withdrawAmount,
                coin_deducted: coinToDeduct,
                status: "pending"
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("Withdraw error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal membuat withdraw",
            error: error.message
        });
    }
}

// ========================================
// 2. GET WITHDRAW HISTORY (USER)
// ========================================

async function getWithdraws(req, res) {
    try {
        const userId = req.user.id;

        const [withdrawals] = await pool.execute(
            `
            SELECT
                id,
                amount,
                bank_name,
                account_number,
                account_name,
                status,
                created_at,
                updated_at
            FROM withdrawals
            WHERE user_id = ?
            ORDER BY id DESC
            `,
            [userId]
        );

        return res.json({
            success: true,
            withdrawals
        });

    } catch (error) {
        console.error("Get withdraw error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil riwayat withdraw"
        });
    }
}

// ========================================
// 3. UPDATE STATUS WITHDRAW / REJECT & REFUND (ADMIN)
// ========================================

async function updateWithdrawStatus(req, res) {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Status tidak valid. Gunakan 'approved' atau 'rejected'."
            });
        }

        await connection.beginTransaction();

        const [withdrawRows] = await connection.execute(
            `
            SELECT *
            FROM withdrawals
            WHERE id = ?
            FOR UPDATE
            `,
            [id]
        );

        if (withdrawRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({
                success: false,
                message: "Data withdraw tidak ditemukan"
            });
        }

        const withdraw = withdrawRows[0];
        const userId = withdraw.user_id;
        const withdrawAmount = Number(withdraw.amount);
        
        // Hitung koin yang harus dikembalikan berdasarkan nominal withdraw
        const coinToRefund = Number(withdrawAmount / 100);

        if (withdraw.status === "approved" && status === "rejected") {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Withdraw yang sudah di-approve tidak dapat di-reject."
            });
        }

        // Update status withdraw ke database
        await connection.execute(
            `
            UPDATE withdrawals
            SET status = ?, updated_at = NOW()
            WHERE id = ?
            `,
            [status, id]
        );

        // JIKA STATUS REJECTED, KEMBALIKAN SALDO CASH DAN KOIN KE USER
        if (status === "rejected") {
            console.log("--- PROSES REFUND REJECT ---");
            console.log("User ID:", userId);
            console.log("Cash to Refund:", withdrawAmount);
            console.log("Coin to Refund:", coinToRefund);

            // Eksekusi pengembalian saldo cash dan koin
            const [updateWalletResult] = await connection.execute(
                `
                UPDATE wallets
                SET cash_balance = cash_balance + ?,
                    coin_balance = coin_balance + ?
                WHERE user_id = ?
                `,
                [withdrawAmount, coinToRefund, userId]
            );

            console.log("Wallet Update Affected Rows:", updateWalletResult.affectedRows);

            // Catat riwayat refund ke tabel transaksi
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
                    "withdraw_refund",
                    withdrawAmount,
                    coinToRefund,
                    "Refund Withdraw #" + id + " (Ditolak)"
                ]
            );
        }

        await connection.commit();
        connection.release();

        return res.json({
            success: true,
            message: `Withdraw berhasil di-${status}${status === 'rejected' ? ', saldo dan koin telah dikembalikan ke user.' : '.'}`
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("Update withdraw status error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui status withdraw",
            error: error.message
        });
    }
}

module.exports = {
    createWithdraw,
    getWithdraws,
    updateWithdrawStatus
};