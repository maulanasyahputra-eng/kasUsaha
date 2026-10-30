const { pool } = require("../config/database");

async function adminMiddleware(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const [rows] = await pool.query(
            `
            SELECT
                id,
                is_admin,
                is_banned
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        if (rows[0].is_banned) {
            return res.status(403).json({
                success: false,
                message: "Akun diblokir"
            });
        }

        if (!rows[0].is_admin) {
            return res.status(403).json({
                success: false,
                message: "Akses admin diperlukan"
            });
        }

        next();

    } catch (error) {
        console.error(
            "adminMiddleware:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal memeriksa admin"
        });
    }
}

module.exports = adminMiddleware;