const { pool } = require("../config/database");

const {
    generateOtp,
    hashOtp,
    getOtpExpiry,
    verifyOtpHash
} = require("../services/otpService");

const {
    sendSms
} = require("../services/smsService");

const {
    normalizePhone,
    isValidPhone
} = require("../utils/phone");

async function sendOtp(req, res) {
    try {
        let { phone } = req.body;

        phone = normalizePhone(phone);

        if (!isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: "Nomor HP tidak valid"
            });
        }

        /*
         * Rate limit sederhana:
         * maksimal 1 OTP / 60 detik
         */

        const [recent] = await pool.query(
            `
            SELECT id
            FROM otp_codes
            WHERE phone = ?
              AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
            LIMIT 1
            `,
            [phone]
        );

        if (recent.length > 0) {
            return res.status(429).json({
                success: false,
                message:
                    "Tunggu 60 detik sebelum meminta OTP lagi"
            });
        }

        const otp = generateOtp();

        const otpHash = hashOtp(otp);

        const expiresAt = getOtpExpiry();

        await pool.query(
            `
            UPDATE otp_codes
            SET used_at = NOW()
            WHERE phone = ?
              AND used_at IS NULL
            `,
            [phone]
        );

        await pool.query(
            `
            INSERT INTO otp_codes
            (
                phone,
                otp_hash,
                expires_at
            )
            VALUES (?, ?, ?)
            `,
            [
                phone,
                otpHash,
                expiresAt
            ]
        );

        await sendSms(
            phone,
            `Kode OTP ChatKu Anda adalah ${otp}. Kode berlaku selama 5 menit.`
        );

        return res.json({
    success: true,
    message: "OTP berhasil dikirim",
    expires_in: 300,

    // DEVELOPMENT ONLY
    otp: process.env.NODE_ENV === "production"
        ? undefined
        : otp
});

    } catch (error) {
        console.error(
            "sendOtp:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Gagal mengirim OTP"
        });
    }
}

async function verifyOtp(req, res) {

    try {

        let { phone, otp } = req.body;

        phone = normalizePhone(phone);

        otp = String(
            otp || ""
        ).trim();

        if (!isValidPhone(phone)) {

            return res.status(400).json({
                success: false,
                message:
                    "Nomor HP tidak valid"
            });

        }

        if (!/^[0-9]{6}$/.test(otp)) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP harus 6 digit"
            });

        }

        const [rows] =
            await pool.query(
                `
                SELECT *
                FROM otp_codes
                WHERE phone = ?
                AND used_at IS NULL
                ORDER BY id DESC
                LIMIT 1
                `,
                [phone]
            );

        if (rows.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP tidak ditemukan"
            });

        }

        const record =
            rows[0];

        if (
            new Date(
                record.expires_at
            ).getTime() < Date.now()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP sudah kedaluwarsa"
            });

        }

        if (
            record.attempts >= 5
        ) {

            return res.status(429).json({
                success: false,
                message:
                    "Percobaan OTP terlalu banyak"
            });

        }

        await pool.query(
            `
            UPDATE otp_codes
            SET attempts = attempts + 1
            WHERE id = ?
            `,
            [record.id]
        );

        const valid =
            verifyOtpHash(
                otp,
                record.otp_hash
            );

        if (!valid) {

            return res.status(401).json({
                success: false,
                message:
                    "OTP salah"
            });

        }

        await pool.query(
            `
            UPDATE otp_codes
            SET used_at = NOW()
            WHERE id = ?
            `,
            [record.id]
        );

        /*
         * CARI USER
         */

        const [users] =
            await pool.query(
                `
                SELECT *
                FROM users
                WHERE phone = ?
                LIMIT 1
                `,
                [phone]
            );

        let user;

        /*
         * USER BARU
         */

        if (users.length === 0) {

            const [result] =
                await pool.query(
                    `
                    INSERT INTO users
                    (
                        phone,
                        full_name,
                        username,
                        is_verified,
                        is_admin,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        NULL,
                        0,
                        0,
                        NOW(),
                        NOW()
                    )
                    `,
                    [
                        phone,
                        "Pengguna ChatKu"
                    ]
                );

            const [newUsers] =
                await pool.query(
                    `
                    SELECT *
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [result.insertId]
                );

            user =
                newUsers[0];

        } else {

            user =
                users[0];

        }

        /*
         * GENERATE JWT
         */

        const {
            generateAccessToken
        } = require("../services/jwtService");

        const token =
            generateAccessToken(user);

        /*
         * RESPONSE
         */

        return res.json({

            success: true,

            message:
                "Login berhasil",

            token,

            user: {
                id: user.id,

                phone: user.phone,

                username:
                    user.username,

                full_name:
                    user.full_name,

                bio:
                    user.bio || "",

                avatar_url:
                    user.avatar_url || null,

                is_verified:
                    Boolean(
                        user.is_verified
                    ),

                is_admin:
                    Boolean(
                        user.is_admin
                    )
            }

        });

    } catch (error) {

        console.error(
            "VERIFY OTP ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Gagal memverifikasi OTP"

        });

    }
}

module.exports = {
    sendOtp,
    verifyOtp
};