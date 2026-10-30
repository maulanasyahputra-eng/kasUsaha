const { pool } = require("../config/database");

async function getVerificationRequests(req, res) {
    try {
        const [rows] = await pool.query(
            `
            SELECT
                vr.id,
                vr.user_id,
                vr.reason,
                vr.document_url,
                vr.status,
                vr.admin_note,
                vr.created_at,

                u.phone,
                u.username,
                u.full_name,
                u.avatar_url,
                u.is_verified

            FROM verification_requests vr

            INNER JOIN users u
                ON u.id = vr.user_id

            ORDER BY vr.created_at DESC
            `
        );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error(
            "getVerificationRequests:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil pengajuan verifikasi"
        });
    }
}

async function reviewVerification(req, res) {
    const connection = await pool.getConnection();

    try {
        const requestId =
            Number(req.params.id);

        const {
            action,
            admin_note
        } = req.body;

        if (
            !["approve", "reject"].includes(action)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Action harus approve atau reject"
            });
        }

        await connection.beginTransaction();

        const [requests] =
            await connection.query(
                `
                SELECT *
                FROM verification_requests
                WHERE id = ?
                FOR UPDATE
                `,
                [requestId]
            );

        if (requests.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Pengajuan verifikasi tidak ditemukan"
            });
        }

        const request = requests[0];

        if (request.status !== "pending") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Pengajuan sudah diproses"
            });
        }

        if (action === "approve") {

            await connection.query(
                `
                UPDATE users
                SET
                    is_verified = 1,
                    verification_status = 'approved'
                WHERE id = ?
                `,
                [request.user_id]
            );

            await connection.query(
                `
                UPDATE verification_requests
                SET
                    status = 'approved',
                    reviewed_by = ?,
                    reviewed_at = NOW(),
                    admin_note = ?
                WHERE id = ?
                `,
                [
                    req.user.id,
                    admin_note || null,
                    requestId
                ]
            );

            await connection.query(
                `
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    body,
                    type
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    request.user_id,
                    "Akun Terverifikasi 🔵",
                    "Selamat! Akun Anda sekarang terverifikasi.",
                    "verification"
                ]
            );

        } else {

            await connection.query(
                `
                UPDATE users
                SET
                    is_verified = 0,
                    verification_status = 'rejected'
                WHERE id = ?
                `,
                [request.user_id]
            );

            await connection.query(
                `
                UPDATE verification_requests
                SET
                    status = 'rejected',
                    reviewed_by = ?,
                    reviewed_at = NOW(),
                    admin_note = ?
                WHERE id = ?
                `,
                [
                    req.user.id,
                    admin_note || null,
                    requestId
                ]
            );

            await connection.query(
                `
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    body,
                    type
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    request.user_id,
                    "Verifikasi Ditolak",
                    admin_note ||
                        "Pengajuan verifikasi Anda ditolak.",
                    "verification"
                ]
            );
        }

        await connection.query(
            `
            INSERT INTO admin_logs
            (
                admin_id,
                action,
                target_type,
                target_id,
                description
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                action === "approve"
                    ? "VERIFY_USER"
                    : "REJECT_VERIFICATION",
                "user",
                request.user_id,
                admin_note || null
            ]
        );

        await connection.commit();

        return res.json({
            success: true,
            message:
                action === "approve"
                    ? "User berhasil diverifikasi 🔵"
                    : "Verifikasi berhasil ditolak"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "reviewVerification:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal memproses verifikasi"
        });

    } finally {
        connection.release();
    }
}

async function getUsers(req, res) {
    try {
        const [rows] = await pool.query(
            `
            SELECT
                id,
                phone,
                username,
                full_name,
                avatar_url,
                is_verified,
                verification_status,
                is_admin,
                is_banned,
                last_seen,
                created_at
            FROM users
            ORDER BY id DESC
            `
        );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error(
            "getUsers:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil users"
        });
    }
}

module.exports = {
    getVerificationRequests,
    reviewVerification,
    getUsers
};