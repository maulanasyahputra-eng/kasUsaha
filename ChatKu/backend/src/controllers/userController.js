const { pool } = require("../config/database");


/* =========================================
   SEARCH USERS
   GET /api/users/search?keyword=081234567890
========================================= */

const searchUsers = async (req, res) => {

    try {

        /* =====================================
           USER YANG SEDANG LOGIN
        ===================================== */

        const currentUserId =
            req.user.user_id;


        /* =====================================
           KEYWORD
        ===================================== */

        const keyword =
            req.query.keyword;


        if (
            !keyword ||
            String(keyword).trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Nomor telepon atau username wajib diisi",

                users: []

            });

        }


        const cleanKeyword =
            String(keyword).trim();


        const search =
            `%${cleanKeyword}%`;


        /* =====================================
           SEARCH DATABASE

           Bisa mencari:
           - nomor telepon
           - nama lengkap
           - username
        ===================================== */

        const [rows] =
            await pool.query(
                `
                SELECT

                    id,

                    phone,

                    full_name,

                    username,

                    avatar_url,

                    bio,

                    is_verified,

                    verification_status

                FROM users

                WHERE

                    id != ?

                    AND is_banned = 0

                    AND

                    (
                        phone LIKE ?

                        OR

                        full_name LIKE ?

                        OR

                        username LIKE ?
                    )

                ORDER BY

                    CASE

                        WHEN phone = ?
                            THEN 1

                        WHEN username = ?
                            THEN 2

                        WHEN full_name = ?
                            THEN 3

                        ELSE 4

                    END,

                    full_name ASC,

                    phone ASC

                LIMIT 50
                `,
                [

                    currentUserId,

                    search,

                    search,

                    search,

                    cleanKeyword,

                    cleanKeyword,

                    cleanKeyword

                ]
            );


        /* =====================================
           RESPONSE
        ===================================== */

        return res.json({

            success: true,

            users: rows

        });


    } catch (error) {

        console.error(
            "SEARCH USERS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mencari pengguna",

            error:
                error.message,

            users: []

        });

    }

};


/* =========================================
   GET MY PROFILE
   GET /api/users/me
========================================= */

const getMyProfile = async (req, res) => {

    try {

        const userId =
            req.user.user_id;


        const [rows] =
            await pool.query(
                `
                SELECT

                    id,

                    phone,

                    username,

                    full_name,

                    avatar_url,

                    bio,

                    is_verified,

                    verification_status,

                    is_admin,

                    is_banned,

                    last_seen,

                    created_at

                FROM users

                WHERE id = ?

                LIMIT 1
                `,
                [userId]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Pengguna tidak ditemukan"

            });

        }


        return res.json({

            success: true,

            user:
                rows[0]

        });


    } catch (error) {

        console.error(
            "GET MY PROFILE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil profil",

            error:
                error.message

        });

    }

};


/* =========================================
   UPDATE PROFILE
   PUT /api/users/profile
========================================= */

const updateProfile = async (req, res) => {

    try {

        const userId =
            req.user.user_id;


        const {
            full_name,
            username,
            bio,
            avatar_url
        } = req.body;


        /* =====================================
           CEK USER
        ===================================== */

        const [currentUsers] =
            await pool.query(
                `
                SELECT

                    id,

                    phone,

                    username,

                    full_name,

                    avatar_url,

                    bio

                FROM users

                WHERE id = ?

                LIMIT 1
                `,
                [userId]
            );


        if (
            currentUsers.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Pengguna tidak ditemukan"

            });

        }


        /* =====================================
           USERNAME
        ===================================== */

        let cleanUsername;


        if (
            username !== undefined &&
            username !== null
        ) {

            cleanUsername =
                String(username)
                    .trim()
                    .toLowerCase();


            /* ================================
               USER BOLEH MENGETIK @
            ================================ */

            if (
                cleanUsername.startsWith("@")
            ) {

                cleanUsername =
                    cleanUsername.substring(1);

            }


            /* ================================
               USERNAME KOSONG
               ================================ */

            if (
                cleanUsername === ""
            ) {

                cleanUsername = null;

            }


            /* ================================
               VALIDASI USERNAME
            ================================ */

            if (
                cleanUsername !== null &&
                !/^[a-z0-9_]{3,30}$/.test(
                    cleanUsername
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username harus 3-30 karakter dan hanya boleh menggunakan huruf, angka, atau underscore"

                });

            }


            /* ================================
               CEK USERNAME DUPLIKAT
            ================================ */

            if (
                cleanUsername !== null
            ) {

                const [existingUsers] =
                    await pool.query(
                        `
                        SELECT id

                        FROM users

                        WHERE username = ?

                        AND id != ?

                        LIMIT 1
                        `,
                        [

                            cleanUsername,

                            userId

                        ]
                    );


                if (
                    existingUsers.length > 0
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "Username sudah digunakan"

                    });

                }

            }

        }


        /* =====================================
           BUILD UPDATE
        ===================================== */

        const fields = [];
        const values = [];


        /* =====================================
           FULL NAME
        ===================================== */

        if (
            full_name !== undefined
        ) {

            const cleanFullName =
                String(full_name).trim();


            if (
                cleanFullName.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Nama terlalu panjang"

                });

            }


            fields.push(
                "full_name = ?"
            );


            values.push(
                cleanFullName
            );

        }


        /* =====================================
           USERNAME
        ===================================== */

        if (
            username !== undefined
        ) {

            fields.push(
                "username = ?"
            );


            values.push(
                cleanUsername
            );

        }


        /* =====================================
           BIO
        ===================================== */

        if (
            bio !== undefined
        ) {

            const cleanBio =
                String(bio).trim();


            if (
                cleanBio.length > 500
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Bio maksimal 500 karakter"

                });

            }


            fields.push(
                "bio = ?"
            );


            values.push(
                cleanBio
            );

        }


        /* =====================================
           AVATAR
        ===================================== */

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


        /* =====================================
           TIDAK ADA DATA
        ===================================== */

        if (
            fields.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Tidak ada data profil yang diubah"

            });

        }


        /* =====================================
           UPDATE DATABASE
        ===================================== */

        values.push(
            userId
        );


        await pool.query(
            `
            UPDATE users

            SET

                ${fields.join(", ")},

                updated_at = NOW()

            WHERE id = ?
            `,
            values
        );


        /* =====================================
           AMBIL PROFILE TERBARU
        ===================================== */

        const [updatedUsers] =
            await pool.query(
                `
                SELECT

                    id,

                    phone,

                    username,

                    full_name,

                    avatar_url,

                    bio,

                    is_verified,

                    verification_status,

                    is_admin,

                    is_banned,

                    last_seen,

                    created_at,

                    updated_at

                FROM users

                WHERE id = ?

                LIMIT 1
                `,
                [userId]
            );


        /* =====================================
           RESPONSE
        ===================================== */

        return res.json({

            success: true,

            message:
                "Profil berhasil diperbarui",

            user:
                updatedUsers[0]

        });


    } catch (error) {

        console.error(
            "UPDATE PROFILE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal memperbarui profil",

            error:
                error.message

        });

    }

};


/* =========================================
   GET USER PROFILE
   GET /api/users/:id
========================================= */

const getUserProfile = async (req, res) => {

    try {

        const userId =
            Number(req.params.id);


        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "ID pengguna tidak valid"

            });

        }


        const [rows] =
            await pool.query(
                `
                SELECT

                    id,

                    phone,

                    username,

                    full_name,

                    avatar_url,

                    bio,

                    is_verified,

                    verification_status,

                    last_seen,

                    created_at

                FROM users

                WHERE id = ?

                AND is_banned = 0

                LIMIT 1
                `,
                [userId]
            );


        if (
            rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Pengguna tidak ditemukan"

            });

        }


        return res.json({

            success: true,

            user:
                rows[0]

        });


    } catch (error) {

        console.error(
            "GET USER PROFILE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil profil pengguna",

            error:
                error.message

        });

    }

};


/* =========================================
   EXPORT
========================================= */

module.exports = {

    searchUsers,

    getMyProfile,

    updateProfile,

    getUserProfile

};