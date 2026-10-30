const { Server } = require("socket.io");

const onlineUsers = new Map();
const userSockets = new Map();

function setupSocket(server) {

    const io = new Server(server, {

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


    // =========================================
    // SOCKET CONNECTION
    // =========================================

    io.on("connection", (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );


        // =====================================
        // USER ONLINE
        // =====================================

        socket.on(
            "user_online",
            (userId) => {

                if (!userId) {
                    return;
                }

                const id =
                    String(userId);

                socket.userId = id;


                if (!userSockets.has(id)) {

                    userSockets.set(
                        id,
                        new Set()
                    );

                }


                userSockets
                    .get(id)
                    .add(socket.id);


                onlineUsers.set(
                    id,
                    true
                );


                // Room khusus user
                socket.join(
                    `user:${id}`
                );


                io.emit(
                    "user_status",
                    {
                        user_id: id,
                        status: "online"
                    }
                );


                console.log(
                    `User ${id} ONLINE`
                );

            }
        );


        // =====================================
        // JOIN CONVERSATION
        // =====================================

        socket.on(
            "join_conversation",
            (conversationId) => {

                if (!conversationId) {
                    return;
                }

                const room =
                    `conversation:${conversationId}`;


                socket.join(room);


                console.log(
                    `Socket ${socket.id} joined ${room}`
                );

            }
        );


        // =====================================
        // LEAVE CONVERSATION
        // =====================================

        socket.on(
            "leave_conversation",
            (conversationId) => {

                if (!conversationId) {
                    return;
                }

                const room =
                    `conversation:${conversationId}`;


                socket.leave(room);


                console.log(
                    `Socket ${socket.id} left ${room}`
                );

            }
        );


        // =====================================
        // TYPING START
        // =====================================

        socket.on(
            "typing_start",
            (data) => {

                if (
                    !data ||
                    !socket.userId
                ) {
                    return;
                }


                const conversationId =
                    data.conversation_id;


                if (!conversationId) {
                    return;
                }


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


        // =====================================
        // TYPING STOP
        // =====================================

        socket.on(
            "typing_stop",
            (data) => {

                if (
                    !data ||
                    !socket.userId
                ) {
                    return;
                }


                const conversationId =
                    data.conversation_id;


                if (!conversationId) {
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


        // =====================================
        // MESSAGE READ
        // =====================================

        socket.on(
            "message_read",
            (data) => {

                if (
                    !data ||
                    !socket.userId
                ) {
                    return;
                }


                const {
                    message_id,
                    conversation_id
                } = data;


                if (
                    !message_id ||
                    !conversation_id
                ) {
                    return;
                }


                socket
                    .to(
                        `conversation:${conversation_id}`
                    )
                    .emit(
                        "message_read",
                        {
                            message_id:
                                message_id,

                            conversation_id:
                                conversation_id,

                            user_id:
                                socket.userId
                        }
                    );

            }
        );


        // =====================================
        // MESSAGE DELIVERED
        // =====================================

        socket.on(
            "message_delivered",
            (data) => {

                if (
                    !data ||
                    !socket.userId
                ) {
                    return;
                }


                const {
                    message_id,
                    conversation_id
                } = data;


                if (
                    !message_id ||
                    !conversation_id
                ) {
                    return;
                }


                socket
                    .to(
                        `conversation:${conversation_id}`
                    )
                    .emit(
                        "message_delivered",
                        {
                            message_id:
                                message_id,

                            conversation_id:
                                conversation_id,

                            user_id:
                                socket.userId
                        }
                    );

            }
        );


        // =====================================
        // DISCONNECT
        // =====================================

        socket.on(
            "disconnect",
            () => {

                if (socket.userId) {

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

    });


    return io;
}


module.exports = {
    setupSocket,
    onlineUsers,
    userSockets
};