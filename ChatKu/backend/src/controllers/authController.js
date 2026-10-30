const {
    pool
} = require("../config/database");

const {
    generateAccessToken
} = require("../services/jwtService");


/* =========================================
   SEND OTP
========================================= */

async function sendOTP(req, res) {

    try {

        const {
            phone
        } = req.body;

        if (!phone) {

            return res.status(400).json({
                success: false,
                message: "Nomor HP wajib diisi"
            });

        }

        /*
         * OTP SEND
         *
         * Fungsi OTP yang sudah kamu buat
         * tetap digunakan melalui endpoint
         * /api/otp/send.
         *
         * Bagian ini hanya disediakan agar
         * authRoutes tetap kompatibel.
         */

        return res.status(400).json({
            success: false,
            message:
                "Gunakan endpoint /api/otp/send"
        });

    } catch (error) {

        console.error(
            "sendOTP:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengirim OTP"
        });

    }

}


/* =========================================
   VERIFY OTP
========================================= */

async function verifyOTP(req, res) {

    try {

        const {
            phone,
            otp
        } = req.body;

        if (!phone || !otp) {

            return res.status(400).json({
                success: false,
                message:
                    "Nomor HP dan OTP wajib diisi"
            });

        }

        /*
         * Endpoint OTP utama yang sedang
         * kita gunakan adalah:
         *
         * POST /api/otp/verify
         *
         * Jadi jangan membuat sistem OTP
         * kedua di sini.
         */

        return res.status(400).json({
            success: false,
            message:
                "Gunakan endpoint /api/otp/verify"
        });

    } catch (error) {

        console.error(
            "verifyOTP:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal memverifikasi OTP"
        });

    }

}


/* =========================================
   GET CURRENT USER
========================================= */

async function me(req, res) {

    try {

        /*
         * authMiddleware sudah memverifikasi JWT.
         *
         * Token kita sebelumnya berisi:
         *
         * user_id
         * phone
         * is_admin
         */

        const userId =
            req.user &&
            req.user.user_id;

        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    "User ID tidak terdapat dalam token"
            });

        }

        console.log(
            "AUTH ME user_id:",
            userId
        );

        /*
         * Ambil user berdasarkan ID JWT
         */

        const [
            rows
        ] = await pool.query(
            `
            SELECT
                id,
                phone,
                full_name,
                username,
                avatar_url,
                bio,
                is_verified,
                is_admin,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );

        console.log(
            "AUTH ME rows:",
            rows.length
        );

        if (rows.length === 0) {

            /*
             * FALLBACK:
             * Kalau ID pada JWT tidak cocok,
             * coba berdasarkan nomor HP.
             */

            if (req.user.phone) {

                const [
                    phoneRows
                ] = await pool.query(
                    `
                    SELECT
                        id,
                        phone,
                        full_name,
                        username,
                        avatar_url,
                        bio,
                        is_verified,
                        is_admin,
                        created_at,
                        updated_at
                    FROM users
                    WHERE phone = ?
                    LIMIT 1
                    `,
                    [req.user.phone]
                );

                if (
                    phoneRows.length > 0
                ) {

                    const user =
                        phoneRows[0];

                    return res.json({
                        success: true,
                        user
                    });

                }

            }

            return res.status(404).json({
                success: false,
                message:
                    "User tidak ditemukan",
                user_id:
                    userId
            });

        }

        const user =
            rows[0];

        return res.json({

            success: true,

            user

        });

    } catch (error) {

        console.error(
            "ME ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil data user",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

}


/* =========================================
   UPDATE PROFILE
========================================= */

async function updateProfile(
    req,
    res
) {

    try {

        const userId =
            req.user.user_id;

        const {
            full_name,
            username,
            avatar_url,
            bio
        } = req.body;

        /*
         * Update hanya field yang dikirim.
         */

        const fields = [];
        const values = [];

        if (
            full_name !== undefined
        ) {

            fields.push(
                "full_name = ?"
            );

            values.push(
                full_name
            );

        }

        if (
            username !== undefined
        ) {

            fields.push(
                "username = ?"
            );

            values.push(
                username
            );

        }

        if (
            avatar_url !== undefined
        ) {

            fields.push(
                "avatar_url = ?"
            );

            values.push(
                avatar_url
            );

        }

        if (
            bio !== undefined
        ) {

            fields.push(
                "bio = ?"
            );

            values.push(
                bio
            );

        }

        if (fields.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Tidak ada data profile yang diubah"
            });

        }

        fields.push(
            "updated_at = NOW()"
        );

        values.push(
            userId
        );

        await pool.query(
            `
            UPDATE users
            SET ${fields.join(", ")}
            WHERE id = ?
            `,
            values
        );

        const [
            rows
        ] = await pool.query(
            `
            SELECT
                id,
                phone,
                full_name,
                username,
                avatar_url,
                bio,
                is_verified,
                is_admin,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );

        return res.json({

            success: true,

            message:
                "Profile berhasil diperbarui",

            user:
                rows[0] || null

        });

    } catch (error) {

        console.error(
            "UPDATE PROFILE ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Gagal memperbarui profile"

        });

    }

}


/* =========================================
   EXPORT
========================================= */

module.exports = {

    sendOTP,

    verifyOTP,

    me,

    updateProfile

};