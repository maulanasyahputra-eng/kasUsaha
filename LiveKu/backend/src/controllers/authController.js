const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/database");

async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email dan password wajib diisi"
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username minimal 3 karakter"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password minimal 6 karakter"
            });
        }

        const [existing] = await pool.query(
            `
            SELECT id
            FROM users
            WHERE username = ? OR email = ?
            LIMIT 1
            `,
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username atau email sudah digunakan"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [userResult] = await connection.query(
                `
                INSERT INTO users
                (username, email, password, role, status)
                VALUES (?, ?, ?, 'USER', 'ACTIVE')
                `,
                [username, email, hashedPassword]
            );

            await connection.query(
                `
                INSERT INTO wallets
                (user_id, coin_balance, cash_balance)
                VALUES (?, 0, 0.00)
                `,
                [userResult.insertId]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: "Registrasi berhasil",
                user: {
                    id: userResult.insertId,
                    username,
                    email,
                    role: "USER",
                    status: "ACTIVE"
                }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal melakukan registrasi"
        });
    }
}


// LOGIN
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password wajib diisi"
            });
        }

        const [users] = await pool.query(
            `
            SELECT id, username, email, password, role, status
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        const user = users[0];

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Akun tidak aktif"
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "7d"
            }
        );

        res.json({
            success: true,
            message: "Login berhasil",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal melakukan login"
        });
    }
}


// PROFILE
async function profile(req, res) {
    try {
        const [users] = await pool.query(
            `
            SELECT id, username, email, role, status, created_at
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

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("PROFILE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil profile"
        });
    }
}

module.exports = {
    register,
    login,
    profile
};