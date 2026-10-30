package com.example.chatku.network;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class SocketManager {

    private static final String TAG = "ChatKuSocket";

    /*
     * Android Emulator:
     * localhost komputer = 10.0.2.2
     *
     * Backend kamu berjalan di port 5000.
     */
    private static final String SOCKET_URL =
            "http://10.0.2.2:5000";

    private static Socket socket;

    private SocketManager() {
        // Prevent instance
    }


    /* =========================================
       GET SOCKET
    ========================================= */

    public static Socket getSocket() {

        if (socket == null) {

            try {

                IO.Options options =
                        new IO.Options();

                options.transports =
                        new String[]{"websocket"};

                options.reconnection = true;

                options.reconnectionAttempts = 10;

                options.reconnectionDelay = 1000;

                socket =
                        IO.socket(
                                SOCKET_URL,
                                options
                        );

            } catch (Exception e) {

                Log.e(
                        TAG,
                        "Gagal membuat Socket",
                        e
                );

            }

        }

        return socket;
    }


    /* =========================================
       CONNECT
    ========================================= */

    public static void connect(
            final long userId
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        /*
         * Hindari listener
         * terpasang berkali-kali.
         */

        s.off(
                Socket.EVENT_CONNECT
        );


        s.on(
                Socket.EVENT_CONNECT,
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        Log.d(
                                TAG,
                                "Socket CONNECTED"
                        );


                        /*
                         * Beritahu backend
                         * bahwa user online.
                         */

                        s.emit(
                                "user_online",
                                String.valueOf(userId)
                        );

                    }

                }
        );


        s.on(
                Socket.EVENT_CONNECT_ERROR,
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        Log.e(
                                TAG,
                                "Socket connection error"
                        );

                    }

                }
        );


        if (!s.connected()) {

            s.connect();

        } else {

            s.emit(
                    "user_online",
                    String.valueOf(userId)
            );

        }

    }


    /* =========================================
       DISCONNECT
    ========================================= */

    public static void disconnect() {

        if (socket != null) {

            socket.disconnect();

            Log.d(
                    TAG,
                    "Socket DISCONNECTED"
            );

        }

    }


    /* =========================================
       JOIN CONVERSATION
    ========================================= */

    public static void joinConversation(
            long conversationId
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        if (!s.connected()) {

            Log.w(
                    TAG,
                    "Socket belum connected"
            );

            return;

        }


        s.emit(
                "join_conversation",
                String.valueOf(conversationId)
        );


        Log.d(
                TAG,
                "Join conversation: "
                        + conversationId
        );

    }


    /* =========================================
       LEAVE CONVERSATION
    ========================================= */

    public static void leaveConversation(
            long conversationId
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.emit(
                "leave_conversation",
                String.valueOf(conversationId)
        );


        Log.d(
                TAG,
                "Leave conversation: "
                        + conversationId
        );

    }


    /* =========================================
       TYPING START
    ========================================= */

    public static void typingStart(
            long conversationId
    ) {

        Socket s =
                getSocket();

        if (s == null || !s.connected()) {
            return;
        }


        try {

            JSONObject data =
                    new JSONObject();

            data.put(
                    "conversation_id",
                    conversationId
            );


            s.emit(
                    "typing_start",
                    data
            );

        } catch (JSONException e) {

            Log.e(
                    TAG,
                    "Typing start error",
                    e
            );

        }

    }


    /* =========================================
       TYPING STOP
    ========================================= */

    public static void typingStop(
            long conversationId
    ) {

        Socket s =
                getSocket();

        if (s == null || !s.connected()) {
            return;
        }


        try {

            JSONObject data =
                    new JSONObject();

            data.put(
                    "conversation_id",
                    conversationId
            );


            s.emit(
                    "typing_stop",
                    data
            );

        } catch (JSONException e) {

            Log.e(
                    TAG,
                    "Typing stop error",
                    e
            );

        }

    }


    /* =========================================
       MESSAGE READ
    ========================================= */

    public static void messageRead(
            long messageId,
            long conversationId
    ) {

        Socket s =
                getSocket();

        if (s == null || !s.connected()) {
            return;
        }


        try {

            JSONObject data =
                    new JSONObject();

            data.put(
                    "message_id",
                    messageId
            );

            data.put(
                    "conversation_id",
                    conversationId
            );


            s.emit(
                    "message_read",
                    data
            );

        } catch (JSONException e) {

            Log.e(
                    TAG,
                    "Message read error",
                    e
            );

        }

    }


    /* =========================================
       MESSAGE DELIVERED
    ========================================= */

    public static void messageDelivered(
            long messageId,
            long conversationId
    ) {

        Socket s =
                getSocket();

        if (s == null || !s.connected()) {
            return;
        }


        try {

            JSONObject data =
                    new JSONObject();

            data.put(
                    "message_id",
                    messageId
            );

            data.put(
                    "conversation_id",
                    conversationId
            );


            s.emit(
                    "message_delivered",
                    data
            );

        } catch (JSONException e) {

            Log.e(
                    TAG,
                    "Message delivered error",
                    e
            );

        }

    }


    /* =========================================
       LISTEN NEW MESSAGE
    ========================================= */

    public static void onNewMessage(
            Emitter.Listener listener
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.off(
                "new_message"
        );


        s.on(
                "new_message",
                listener
        );

    }


    /* =========================================
       REMOVE NEW MESSAGE LISTENER
    ========================================= */

    public static void removeNewMessageListener() {

        if (socket != null) {

            socket.off(
                    "new_message"
            );

        }

    }


    /* =========================================
       USER STATUS
    ========================================= */

    public static void onUserStatus(
            Emitter.Listener listener
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.off(
                "user_status"
        );


        s.on(
                "user_status",
                listener
        );

    }


    /* =========================================
       TYPING START LISTENER
    ========================================= */

    public static void onTypingStart(
            Emitter.Listener listener
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.off(
                "typing_start"
        );


        s.on(
                "typing_start",
                listener
        );

    }


    /* =========================================
       TYPING STOP LISTENER
    ========================================= */

    public static void onTypingStop(
            Emitter.Listener listener
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.off(
                "typing_stop"
        );


        s.on(
                "typing_stop",
                listener
        );

    }


    /* =========================================
       MESSAGE READ LISTENER
    ========================================= */

    public static void onMessageRead(
            Emitter.Listener listener
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.off(
                "message_read"
        );


        s.on(
                "message_read",
                listener
        );

    }


    /* =========================================
       MESSAGE DELIVERED LISTENER
    ========================================= */

    public static void onMessageDelivered(
            Emitter.Listener listener
    ) {

        Socket s =
                getSocket();

        if (s == null) {
            return;
        }


        s.off(
                "message_delivered"
        );


        s.on(
                "message_delivered",
                listener
        );

    }

}