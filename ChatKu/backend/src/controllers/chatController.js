const { pool } = require("../config/database");

const {
    io
} = require("../server");


/* =========================================
   SEARCH USERS
========================================= */

const searchUsers = async (req, res) => {

    try {

        const currentUserId =
            req.user.user_id;

        const keyword =
            req.query.q
                ? String(req.query.q).trim()
                : "";


        if (!keyword) {

            return res.status(400).json({

                success: false,

                message:
                    "Keyword pencarian wajib diisi",

                users: []

            });

        }


        const search =
            `%${keyword}%`;


        const [users] =
            await pool.query(
                `
                SELECT

                    id,
                    phone,
                    full_name,
                    username,
                    avatar_url,
                    is_verified

                FROM users

                WHERE

                    id != ?

                    AND
                    (
                        full_name LIKE ?

                        OR username LIKE ?

                        OR phone LIKE ?
                    )

                ORDER BY
                    full_name ASC

                LIMIT 50
                `,
                [
                    currentUserId,
                    search,
                    search,
                    search
                ]
            );


        return res.json({

            success: true,

            users: users

        });


    } catch (error) {

        console.error(
            "searchUsers:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mencari pengguna",

            users: [],

            error:
                error.message

        });

    }

};


/* =========================================
   CREATE PRIVATE CONVERSATION
========================================= */

const createPrivateConversation = async (req, res) => {

    try {

        const userId =
            req.user.user_id;

        const { user_id } =
            req.body;


        if (!user_id) {

            return res.status(400).json({

                success: false,

                message:
                    "user_id wajib diisi"

            });

        }


        if (
            Number(user_id) ===
            Number(userId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Tidak dapat membuat chat dengan diri sendiri"

            });

        }


        /* =====================================
           CEK USER TUJUAN
        ===================================== */

        const [targetUser] =
            await pool.query(
                `
                SELECT

                    id,
                    phone,
                    full_name,
                    username,
                    avatar_url,
                    is_verified

                FROM users

                WHERE id = ?

                LIMIT 1
                `,
                [user_id]
            );


        if (targetUser.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "User tujuan tidak ditemukan"

            });

        }


        /* =====================================
           CEK CONVERSATION EXISTING
        ===================================== */

        const [existing] =
            await pool.query(
                `
                SELECT

                    c.id

                FROM conversations c

                INNER JOIN conversation_members cm1
                    ON cm1.conversation_id = c.id

                INNER JOIN conversation_members cm2
                    ON cm2.conversation_id = c.id

                WHERE

                    c.type = 'private'

                    AND cm1.user_id = ?

                    AND cm2.user_id = ?

                LIMIT 1
                `,
                [
                    userId,
                    user_id
                ]
            );


        if (existing.length > 0) {

            return res.json({

                success: true,

                conversation_id:
                    existing[0].id,

                message:
                    "Conversation sudah ada"

            });

        }


        /* =====================================
           CREATE CONVERSATION
        ===================================== */

        const [conversation] =
            await pool.query(
                `
                INSERT INTO conversations
                (
                    type,
                    created_by
                )

                VALUES
                (
                    'private',
                    ?
                )
                `,
                [userId]
            );


        const conversationId =
            conversation.insertId;


        /* =====================================
           ADD MEMBERS
        ===================================== */

        await pool.query(
            `
            INSERT INTO conversation_members
            (
                conversation_id,
                user_id
            )

            VALUES
                (?, ?),
                (?, ?)
            `,
            [
                conversationId,
                userId,

                conversationId,
                user_id
            ]
        );


        return res.status(201).json({

            success: true,

            conversation_id:
                conversationId,

            message:
                "Conversation berhasil dibuat"

        });


    } catch (error) {

        console.error(
            "createPrivateConversation:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal membuat conversation",

            error:
                error.message

        });

    }

};


/* =========================================
   GET MY CONVERSATIONS
========================================= */

const getConversations = async (req, res) => {

    try {

        const userId =
            req.user.user_id;


        const [rows] =
            await pool.query(
                `
                SELECT

                    c.id,
                    c.type,
                    c.title,
                    c.avatar_url,
                    c.created_by,
                    c.created_at,


                    (
                        SELECT
                            m.message_text

                        FROM messages m

                        WHERE
                            m.conversation_id = c.id

                            AND
                            m.is_deleted = 0

                        ORDER BY
                            m.id DESC

                        LIMIT 1

                    ) AS last_message,


                    (
                        SELECT
                            m.created_at

                        FROM messages m

                        WHERE
                            m.conversation_id = c.id

                            AND
                            m.is_deleted = 0

                        ORDER BY
                            m.id DESC

                        LIMIT 1

                    ) AS last_message_at,


                    (
                        SELECT
                            u.id

                        FROM conversation_members cm2

                        INNER JOIN users u
                            ON u.id = cm2.user_id

                        WHERE

                            cm2.conversation_id = c.id

                            AND
                            cm2.user_id != ?

                        LIMIT 1

                    ) AS other_user_id,


                    (
                        SELECT
                            u.phone

                        FROM conversation_members cm2

                        INNER JOIN users u
                            ON u.id = cm2.user_id

                        WHERE

                            cm2.conversation_id = c.id

                            AND
                            cm2.user_id != ?

                        LIMIT 1

                    ) AS other_user_phone,


                    (
                        SELECT
                            u.full_name

                        FROM conversation_members cm2

                        INNER JOIN users u
                            ON u.id = cm2.user_id

                        WHERE

                            cm2.conversation_id = c.id

                            AND
                            cm2.user_id != ?

                        LIMIT 1

                    ) AS other_user_name,


                    (
                        SELECT
                            u.username

                        FROM conversation_members cm2

                        INNER JOIN users u
                            ON u.id = cm2.user_id

                        WHERE

                            cm2.conversation_id = c.id

                            AND
                            cm2.user_id != ?

                        LIMIT 1

                    ) AS other_username,


                    (
                        SELECT
                            u.avatar_url

                        FROM conversation_members cm2

                        INNER JOIN users u
                            ON u.id = cm2.user_id

                        WHERE

                            cm2.conversation_id = c.id

                            AND
                            cm2.user_id != ?

                        LIMIT 1

                    ) AS other_avatar,


                    (
                        SELECT
                            u.is_verified

                        FROM conversation_members cm2

                        INNER JOIN users u
                            ON u.id = cm2.user_id

                        WHERE

                            cm2.conversation_id = c.id

                            AND
                            cm2.user_id != ?

                        LIMIT 1

                    ) AS other_is_verified


                FROM conversations c

                INNER JOIN conversation_members cm
                    ON cm.conversation_id = c.id

                WHERE

                    cm.user_id = ?

                ORDER BY

                    COALESCE(

                        (
                            SELECT
                                m.created_at

                            FROM messages m

                            WHERE

                                m.conversation_id = c.id

                                AND
                                m.is_deleted = 0

                            ORDER BY
                                m.id DESC

                            LIMIT 1

                        ),

                        c.created_at

                    ) DESC
                `,
                [
                    userId,
                    userId,
                    userId,
                    userId,
                    userId,
                    userId,
                    userId
                ]
            );


        return res.json({

            success: true,

            conversations:
                rows

        });


    } catch (error) {

        console.error(
            "getConversations:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil conversation",

            error:
                error.message

        });

    }

};


/* =========================================
   GET MESSAGES
========================================= */

const getMessages = async (req, res) => {

    try {

        const userId =
            req.user.user_id;


        const conversationId =
            Number(req.params.id);


        if (!conversationId) {

            return res.status(400).json({

                success: false,

                message:
                    "Conversation ID tidak valid"

            });

        }


        /* =====================================
           CEK MEMBER
        ===================================== */

        const [member] =
            await pool.query(
                `
                SELECT
                    id

                FROM conversation_members

                WHERE

                    conversation_id = ?

                    AND
                    user_id = ?

                LIMIT 1
                `,
                [
                    conversationId,
                    userId
                ]
            );


        if (member.length === 0) {

            return res.status(403).json({

                success: false,

                message:
                    "Anda bukan anggota conversation"

            });

        }


        /* =====================================
           GET MESSAGES
        ===================================== */

        const [messages] =
            await pool.query(
                `
                SELECT

                    m.id,
                    m.conversation_id,
                    m.sender_id,
                    m.message_type,
                    m.message_text,
                    m.reply_to_message_id,
                    m.is_edited,
                    m.is_deleted,
                    m.created_at,
                    m.updated_at,

                    u.phone,
                    u.full_name,
                    u.username,
                    u.avatar_url,
                    u.is_verified

                FROM messages m

                INNER JOIN users u
                    ON u.id = m.sender_id

                WHERE

                    m.conversation_id = ?

                ORDER BY

                    m.id ASC
                `,
                [conversationId]
            );


        return res.json({

            success: true,

            messages

        });


    } catch (error) {

        console.error(
            "getMessages:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengambil messages",

            error:
                error.message

        });

    }

};


/* =========================================
   SEND MESSAGE
========================================= */

const sendMessage = async (req, res) => {

    try {

        const userId =
            req.user.user_id;


        const {
            conversation_id,
            message,
            message_text,
            message_type,
            reply_to_message_id
        } = req.body;


        const text =
            message_text !== undefined
                ? message_text
                : message;


        /* =====================================
           VALIDASI CONVERSATION
        ===================================== */

        if (!conversation_id) {

            return res.status(400).json({

                success: false,

                message:
                    "conversation_id wajib diisi"

            });

        }


        /* =====================================
           VALIDASI PESAN
        ===================================== */

        if (
            !text ||
            String(text).trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Pesan tidak boleh kosong"

            });

        }


        /* =====================================
           CEK MEMBER
        ===================================== */

        const [member] =
            await pool.query(
                `
                SELECT

                    id

                FROM conversation_members

                WHERE

                    conversation_id = ?

                    AND
                    user_id = ?

                LIMIT 1
                `,
                [
                    conversation_id,
                    userId
                ]
            );


        if (member.length === 0) {

            return res.status(403).json({

                success: false,

                message:
                    "Anda bukan anggota conversation"

            });

        }


        /* =====================================
           MESSAGE TYPE
        ===================================== */

        const type =
            message_type || "text";


        const allowedTypes = [

            "text",
            "image",
            "video",
            "file",
            "voice"

        ];


        if (
            !allowedTypes.includes(type)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "message_type tidak valid"

            });

        }


        /* =====================================
           INSERT MESSAGE
        ===================================== */

        const [result] =
            await pool.query(
                `
                INSERT INTO messages
                (
                    conversation_id,
                    sender_id,
                    message_type,
                    message_text,
                    reply_to_message_id
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    conversation_id,
                    userId,
                    type,
                    String(text).trim(),
                    reply_to_message_id || null
                ]
            );


        /* =====================================
           AMBIL MESSAGE YANG BARU DIBUAT
        ===================================== */

        const [rows] =
            await pool.query(
                `
                SELECT

                    m.id,
                    m.conversation_id,
                    m.sender_id,
                    m.message_type,
                    m.message_text,
                    m.reply_to_message_id,
                    m.is_edited,
                    m.is_deleted,
                    m.created_at,
                    m.updated_at,

                    u.phone,
                    u.full_name,
                    u.username,
                    u.avatar_url,
                    u.is_verified

                FROM messages m

                INNER JOIN users u
                    ON u.id = m.sender_id

                WHERE

                    m.id = ?

                LIMIT 1
                `,
                [result.insertId]
            );


        const messageData =
            rows[0];

            /* =====================================
   MESSAGE STATUS
===================================== */

if (messageData) {

    try {

        const [members] =
            await pool.query(
                `
                SELECT
                    user_id
                FROM conversation_members
                WHERE
                    conversation_id = ?
                `,
                [conversation_id]
            );


        for (const member of members) {

            const memberUserId =
                Number(member.user_id);

            const senderUserId =
                Number(userId);


            /*
             * Pengirim
             * status = sent
             */

            if (
                memberUserId === senderUserId
            ) {

                await pool.query(
                    `
                    INSERT INTO message_status
                    (
                        message_id,
                        user_id,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        'sent'
                    )
                    ON DUPLICATE KEY UPDATE
                        status = 'sent',
                        updated_at = CURRENT_TIMESTAMP
                    `,
                    [
                        messageData.id,
                        memberUserId
                    ]
                );

            }


            /*
             * Penerima
             * status = sent
             */

            else {

                await pool.query(
                    `
                    INSERT INTO message_status
                    (
                        message_id,
                        user_id,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        'sent'
                    )
                    ON DUPLICATE KEY UPDATE
                        updated_at = CURRENT_TIMESTAMP
                    `,
                    [
                        messageData.id,
                        memberUserId
                    ]
                );

            }

        }


    } catch (statusError) {

        console.error(
            "MESSAGE STATUS ERROR:",
            statusError
        );

    }

}


        /* =====================================
           REALTIME SOCKET.IO
        ===================================== */

        if (io && messageData) {

            io.to(
                `conversation:${conversation_id}`
            ).emit(
                "new_message",
                messageData
            );


            /*
             * Kirim juga ke room user.
             *
             * Ini berguna jika nanti user
             * sedang berada di halaman lain
             * dan ingin mendapatkan notifikasi
             * pesan masuk.
             */

            const [members] =
                await pool.query(
                    `
                    SELECT
                        user_id

                    FROM conversation_members

                    WHERE
                        conversation_id = ?
                    `,
                    [conversation_id]
                );


            members.forEach(
                (member) => {

                    io.to(
                        `user:${member.user_id}`
                    ).emit(
                        "conversation_updated",
                        {

                            conversation_id:
                                Number(conversation_id),

                            message:
                                messageData

                        }
                    );

                }
            );

        }


        /* =====================================
           RESPONSE API
        ===================================== */

        return res.status(201).json({

            success: true,

            message_data:
                messageData

        });


    } catch (error) {

        console.error(
            "sendMessage:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal mengirim pesan",

            error:
                error.message

        });

    }

};


/* =========================================
   DELETE MESSAGE
========================================= */

const deleteMessage = async (req, res) => {

    try {

        const userId =
            req.user.user_id;


        const messageId =
            Number(req.params.id);


        if (!messageId) {

            return res.status(400).json({

                success: false,

                message:
                    "Message ID tidak valid"

            });

        }


        /* =====================================
           UPDATE
        ===================================== */

        const [result] =
            await pool.query(
                `
                UPDATE messages

                SET

                    is_deleted = 1,

                    message_text = NULL

                WHERE

                    id = ?

                    AND
                    sender_id = ?
                `,
                [
                    messageId,
                    userId
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Pesan tidak ditemukan"

            });

        }


        /* =====================================
           AMBIL DATA MESSAGE
        ===================================== */

        const [deletedRows] =
            await pool.query(
                `
                SELECT

                    id,
                    conversation_id,
                    sender_id,
                    message_type,
                    message_text,
                    is_edited,
                    is_deleted,
                    created_at,
                    updated_at

                FROM messages

                WHERE

                    id = ?

                LIMIT 1
                `,
                [messageId]
            );


        const deletedMessage =
            deletedRows[0];


        /* =====================================
           REALTIME DELETE
        ===================================== */

        if (
            io &&
            deletedMessage
        ) {

            io.to(
                `conversation:${deletedMessage.conversation_id}`
            ).emit(
                "message_deleted",
                deletedMessage
            );

        }


        return res.json({

            success: true,

            message:
                "Pesan berhasil dihapus"

        });


    } catch (error) {

        console.error(
            "deleteMessage:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Gagal menghapus pesan",

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

    createPrivateConversation,

    getConversations,

    getMessages,

    sendMessage,

    deleteMessage

};