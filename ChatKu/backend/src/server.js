require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");

const {
    testDatabase,
    pool
} = require("./config/database");

const authRoutes =
    require("./routes/authRoutes");

const otpRoutes =
    require("./routes/otpRoutes");

const verificationRoutes =
    require("./routes/verificationRoutes");

const adminRoutes =
    require("./routes/adminRoutes");

const chatRoutes =
    require("./routes/chatRoutes");

const userRoutes =
    require("./routes/userRoutes");


/* =========================================
   APP
========================================= */

const app = express();

const server =
    http.createServer(app);


/* =========================================
   SOCKET.IO
========================================= */

const io =
    new Server(server, {

        cors: {

            origin: "*",

            methods: [
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH"
            ]

        }

    });


/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    cors({
        origin: "*"
    })
);

app.use(
    express.json({
        limit: "20mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "20mb"
    })
);


/* =========================================
   ROOT
========================================= */

app.get(
    "/",
    (req, res) => {

        return res.json({

            success: true,

            app: "ChatKu Backend",

            version: "1.0.0",

            status: "ONLINE"

        });

    }
);


/* =========================================
   HEALTH
========================================= */

app.get(
    "/api/health",
    async (req, res) => {

        return res.json({

            success: true,

            server: "ONLINE",

            database: "CONNECTED",

            socket: "ENABLED",

            otp: "ENABLED",

            chat: "ENABLED",

            users: "ENABLED",

            time:
                new Date().toISOString()

        });

    }
);


/* =========================================
   AUTH
========================================= */

app.use(
    "/api/auth",
    authRoutes
);


/* =========================================
   OTP
========================================= */

app.use(
    "/api/otp",
    otpRoutes
);


/* =========================================
   VERIFICATION
========================================= */

app.use(
    "/api/verification",
    verificationRoutes
);


/* =========================================
   ADMIN
========================================= */

app.use(
    "/api/admin",
    adminRoutes
);


/* =========================================
   CHAT
========================================= */

app.use(
    "/api/chat",
    chatRoutes
);


/* =========================================
   USER ROUTES
========================================= */

app.use(
    "/api/users",
    userRoutes
);


/* =========================================
   ONLINE USERS
========================================= */

const onlineUsers =
    new Map();


const userSockets =
    new Map();


/* =========================================
   HELPER
========================================= */

/*
 * Cek apakah user merupakan anggota
 * conversation.
 */

async function isConversationMember(
    conversationId,
    userId
) {

    try {

        if (
            !conversationId ||
            !userId
        ) {

            return false;

        }


        const [rows] =
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


        return rows.length > 0;

    } catch (error) {

        console.error(
            "isConversationMember:",
            error
        );

        return false;

    }

}


/*
 * Ambil data message lengkap.
 *
 * Ini dipakai ketika server perlu
 * mengirim informasi message melalui
 * Socket.IO.
 */

async function getMessageById(
    messageId
) {

    try {

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
                [
                    messageId
                ]
            );


        if (
            rows.length === 0
        ) {

            return null;

        }


        return rows[0];

    } catch (error) {

        console.error(
            "getMessageById:",
            error
        );

        return null;

    }

}


/* =========================================
   SOCKET CONNECTION
========================================= */

io.on(
    "connection",
    (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );


        /* =====================================
           USER ONLINE
        ===================================== */

        socket.on(
            "user_online",
            (userId) => {

                if (!userId) {

                    return;

                }


                const id =
                    String(userId);


                socket.userId =
                    id;


                if (
                    !userSockets.has(id)
                ) {

                    userSockets.set(
                        id,
                        new Set()
                    );

                }


                userSockets
                    .get(id)
                    .add(
                        socket.id
                    );


                onlineUsers.set(
                    id,
                    true
                );


                /*
                 * Room khusus user.
                 */

                socket.join(
                    `user:${id}`
                );


                io.emit(
                    "user_status",
                    {

                        user_id:
                            id,

                        status:
                            "online"

                    }
                );


                console.log(
                    `User ${id} ONLINE`
                );

            }
        );


        /* =====================================
           TYPING START
        ===================================== */

        socket.on(
            "typing_start",
            async (data) => {

                if (
                    !data ||
                    !socket.userId
                ) {

                    return;

                }


                const conversationId =
                    Number(
                        data.conversation_id
                    );


                if (
                    !conversationId
                ) {

                    return;

                }


                /*
                 * Pastikan user benar-benar
                 * anggota conversation.
                 */

                const member =
                    await isConversationMember(
                        conversationId,
                        Number(socket.userId)
                    );


                if (!member) {

                    return;

                }


                /*
                 * Kirim hanya ke anggota
                 * conversation.
                 *
                 * User yang sedang mengetik
                 * tidak menerima event sendiri.
                 */

                socket
                    .to(
                        `conversation:${conversationId}`
                    )
                    .emit(
                        "typing_start",
                        {

                            user_id:
                                socket.userId,

                            conversation_id:
                                conversationId

                        }
                    );

            }
        );


        /* =====================================
           TYPING STOP
        ===================================== */

        socket.on(
            "typing_stop",
            async (data) => {

                if (
                    !data ||
                    !socket.userId
                ) {

                    return;

                }


                const conversationId =
                    Number(
                        data.conversation_id
                    );


                if (
                    !conversationId
                ) {

                    return;

                }


                const member =
                    await isConversationMember(
                        conversationId,
                        Number(socket.userId)
                    );


                if (!member) {

                    return;

                }


                socket
                    .to(
                        `conversation:${conversationId}`
                    )
                    .emit(
                        "typing_stop",
                        {

                            user_id:
                                socket.userId,

                            conversation_id:
                                conversationId

                        }
                    );

            }
        );


        /* =====================================
           JOIN CONVERSATION
        ===================================== */

        socket.on(
            "join_conversation",
            async (conversationId) => {

                if (
                    !socket.userId
                ) {

                    return;

                }


                const id =
                    Number(
                        conversationId
                    );


                if (!id) {

                    return;

                }


                /*
                 * Validasi anggota.
                 */

                const member =
                    await isConversationMember(
                        id,
                        Number(socket.userId)
                    );


                if (!member) {

                    console.log(
                        `User ${socket.userId} gagal join conversation ${id}`
                    );

                    return;

                }


                const room =
                    `conversation:${id}`;


                socket.join(
                    room
                );


                console.log(
                    `Socket ${socket.id} joined ${room}`
                );

            }
        );


        /* =====================================
           LEAVE CONVERSATION
        ===================================== */

        socket.on(
            "leave_conversation",
            (conversationId) => {

                if (!conversationId) {

                    return;

                }


                const id =
                    Number(
                        conversationId
                    );


                if (!id) {

                    return;

                }


                const room =
                    `conversation:${id}`;


                socket.leave(
                    room
                );


                console.log(
                    `Socket ${socket.id} left ${room}`
                );

            }
        );


        /* =====================================
           MESSAGE READ
        ===================================== */

        socket.on(
            "message_read",
            async (data) => {

                try {

                    if (
                        !data ||
                        !socket.userId
                    ) {

                        return;

                    }


                    const messageId =
                        Number(
                            data.message_id
                        );


                    const conversationId =
                        Number(
                            data.conversation_id
                        );


                    if (
                        !messageId ||
                        !conversationId
                    ) {

                        return;

                    }


                    const userId =
                        Number(
                            socket.userId
                        );


                    /* =========================
                       CEK MEMBER
                    ========================= */

                    const member =
                        await isConversationMember(
                            conversationId,
                            userId
                        );


                    if (!member) {

                        console.log(
                            `MESSAGE READ ditolak: user ${userId} bukan member conversation ${conversationId}`
                        );

                        return;

                    }


                    /* =========================
                       CEK MESSAGE
                    ========================= */

                    const [messageRows] =
                        await pool.query(
                            `
                            SELECT

                                id,
                                conversation_id,
                                sender_id

                            FROM messages

                            WHERE
                                id = ?

                                AND
                                conversation_id = ?

                            LIMIT 1
                            `,
                            [
                                messageId,
                                conversationId
                            ]
                        );


                    if (
                        messageRows.length === 0
                    ) {

                        return;

                    }


                    /* =========================
                       JANGAN BACA PESAN SENDIRI
                    ========================= */

                    if (
                        Number(
                            messageRows[0].sender_id
                        )
                        ===
                        userId
                    ) {

                        return;

                    }


                    /* =========================
                       INSERT / UPDATE STATUS
                    ========================= */

                    await pool.query(
                        `
                        INSERT INTO message_status
                        (
                            message_id,
                            user_id,
                            status,
                            delivered_at,
                            read_at
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            'read',
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )

                        ON DUPLICATE KEY UPDATE

                            status =
                                'read',

                            delivered_at =
                                COALESCE(
                                    delivered_at,
                                    CURRENT_TIMESTAMP
                                ),

                            read_at =
                                CURRENT_TIMESTAMP,

                            updated_at =
                                CURRENT_TIMESTAMP
                        `,
                        [
                            messageId,
                            userId
                        ]
                    );


                    /* =========================
                       EVENT REALTIME
                    ========================= */

                    io
                        .to(
                            `conversation:${conversationId}`
                        )
                        .emit(
                            "message_read",
                            {

                                message_id:
                                    messageId,

                                conversation_id:
                                    conversationId,

                                user_id:
                                    userId,

                                status:
                                    "read"

                            }
                        );


                    console.log(
                        `Message ${messageId} READ oleh user ${userId}`
                    );


                } catch (error) {

                    console.error(
                        "message_read:",
                        error
                    );

                }

            }
        );


        /* =====================================
           MESSAGE DELIVERED
        ===================================== */

        socket.on(
            "message_delivered",
            async (data) => {

                try {

                    if (
                        !data ||
                        !socket.userId
                    ) {

                        return;

                    }


                    const messageId =
                        Number(
                            data.message_id
                        );


                    const conversationId =
                        Number(
                            data.conversation_id
                        );


                    if (
                        !messageId ||
                        !conversationId
                    ) {

                        return;

                    }


                    const userId =
                        Number(
                            socket.userId
                        );


                    /* =========================
                       CEK MEMBER
                    ========================= */

                    const member =
                        await isConversationMember(
                            conversationId,
                            userId
                        );


                    if (!member) {

                        console.log(
                            `MESSAGE DELIVERED ditolak: user ${userId} bukan member conversation ${conversationId}`
                        );

                        return;

                    }


                    /* =========================
                       CEK MESSAGE
                    ========================= */

                    const [messageRows] =
                        await pool.query(
                            `
                            SELECT

                                id,
                                conversation_id,
                                sender_id

                            FROM messages

                            WHERE
                                id = ?

                                AND
                                conversation_id = ?

                            LIMIT 1
                            `,
                            [
                                messageId,
                                conversationId
                            ]
                        );


                    if (
                        messageRows.length === 0
                    ) {

                        return;

                    }


                    /*
                     * Jangan tandai delivered
                     * untuk pesan yang dikirim
                     * oleh diri sendiri.
                     */

                    if (
                        Number(
                            messageRows[0].sender_id
                        )
                        ===
                        userId
                    ) {

                        return;

                    }


                    /* =========================
                       INSERT / UPDATE STATUS
                    ========================= */

                    await pool.query(
                        `
                        INSERT INTO message_status
                        (
                            message_id,
                            user_id,
                            status,
                            delivered_at
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            'delivered',
                            CURRENT_TIMESTAMP
                        )

                        ON DUPLICATE KEY UPDATE

                            status =
                                CASE

                                    WHEN status = 'read'
                                    THEN 'read'

                                    ELSE 'delivered'

                                END,

                            delivered_at =
                                COALESCE(
                                    delivered_at,
                                    CURRENT_TIMESTAMP
                                ),

                            updated_at =
                                CURRENT_TIMESTAMP
                        `,
                        [
                            messageId,
                            userId
                        ]
                    );


                    /* =========================
                       EVENT REALTIME
                    ========================= */

                    io
                        .to(
                            `conversation:${conversationId}`
                        )
                        .emit(
                            "message_delivered",
                            {

                                message_id:
                                    messageId,

                                conversation_id:
                                    conversationId,

                                user_id:
                                    userId,

                                status:
                                    "delivered"

                            }
                        );


                    console.log(
                        `Message ${messageId} DELIVERED ke user ${userId}`
                    );


                } catch (error) {

                    console.error(
                        "message_delivered:",
                        error
                    );

                }

            }
        );


        /* =====================================
           DISCONNECT
        ===================================== */

        socket.on(
            "disconnect",
            () => {

                if (
                    socket.userId
                ) {

                    const userId =
                        socket.userId;


                    const sockets =
                        userSockets.get(
                            userId
                        );


                    if (sockets) {

                        sockets.delete(
                            socket.id
                        );


                        /*
                         * Hanya offline kalau
                         * semua device/socket user
                         * sudah disconnect.
                         */

                        if (
                            sockets.size === 0
                        ) {

                            userSockets.delete(
                                userId
                            );


                            onlineUsers.delete(
                                userId
                            );


                            io.emit(
                                "user_status",
                                {

                                    user_id:
                                        userId,

                                    status:
                                        "offline"

                                }
                            );


                            console.log(
                                `User ${userId} OFFLINE`
                            );

                        }

                    }

                }


                console.log(
                    "Socket disconnected:",
                    socket.id
                );

            }
        );

    }
);


/* =========================================
   404
========================================= */

app.use(
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                "Endpoint tidak ditemukan",

            path:
                req.originalUrl

        });

    }
);


/* =========================================
   ERROR HANDLER
========================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                error.message

        });

    }
);


/* =========================================
   PORT
========================================= */

const PORT =
    Number(
        process.env.PORT || 5000
    );


/* =========================================
   START SERVER
========================================= */

async function startServer() {

    try {

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            "        CHECK DATABASE"
        );

        console.log(
            "===================================="
        );


        await testDatabase();


        console.log(
            "Database : CONNECTED"
        );


        server.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log("");

                console.log(
                    "===================================="
                );

                console.log(
                    "           CHATKU BACKEND"
                );

                console.log(
                    "===================================="
                );


                console.log(
                    `Server   : http://localhost:${PORT}`
                );


                console.log(
                    `Health   : http://localhost:${PORT}/api/health`
                );


                console.log(
                    "Socket   : ENABLED"
                );


                console.log(
                    "OTP      : ENABLED"
                );


                console.log(
                    "Chat     : ENABLED"
                );


                console.log(
                    "Users    : ENABLED"
                );


                console.log(
                    "Message Status : ENABLED"
                );


                console.log(
                    "Database : CONNECTED"
                );


                console.log(
                    "Status   : ONLINE"
                );


                console.log(
                    "===================================="
                );


                console.log("");

            }
        );


    } catch (error) {

        console.error("");

        console.error(
            "===================================="
        );

        console.error(
            "   DATABASE CONNECTION FAILED"
        );

        console.error(
            "===================================="
        );


        console.error(
            error.message
        );


        console.error("");


        process.exit(1);

    }

}


startServer();


/* =========================================
   EXPORT
========================================= */

module.exports = {

    app,

    server,

    io,

    onlineUsers,

    userSockets

};