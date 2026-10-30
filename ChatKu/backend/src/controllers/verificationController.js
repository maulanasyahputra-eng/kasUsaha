const { pool } = require("../config/database");

/**
 * POST /api/verification/request
 */
async function requestVerification(req, res) {
    try {
        const {
            reason,
            document_url
        } = req.body;

        const [users] = await pool.query(
            `
            SELECT
                id,
                is_verified,
                verification_status
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: "Akun sudah terverifikasi"
            });
        }

        if (user.verification_status === "pending") {
            return res.status(400).json({
                success: false,
                message: "Pengajuan verifikasi sedang diproses"
            });
        }

        await pool.query(
            `
            INSERT INTO verification_requests
            (
                user_id,
                reason,
                document_url
            )
            VALUES (?, ?, ?)
            `,
            [
                req.user.id,
                reason || null,
                document_url || null
            ]
        );

        await pool.query(
            `
            UPDATE users
            SET verification_status = 'pending'
            WHERE id = ?
            `,
            [req.user.id]
        );

        return res.json({
            success: true,
            message:
                "Pengajuan verifikasi berhasil dikirim"
        });

    } catch (error) {
        console.error(
            "requestVerification:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengajukan verifikasi"
        });
    }
}

/**
 * GET /api/verification/status
 */
async function verificationStatus(req, res) {
    try {
        const [rows] = await pool.query(
            `
            SELECT
                id,
                is_verified,
                verification_status
            FROM users
            WHERE id = ?
            `,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        return res.json({
            success: true,
            verification: rows[0]
        });

    } catch (error) {
        console.error(
            "verificationStatus:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil status"
        });
    }
}

module.exports = {
    requestVerification,
    verificationStatus
};