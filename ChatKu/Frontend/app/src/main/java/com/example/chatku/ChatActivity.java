package com.example.chatku;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.adapter.MessageAdapter;
import com.example.chatku.model.ConversationResponse;
import com.example.chatku.model.Message;
import com.example.chatku.network.ApiClient;
import com.example.chatku.network.ApiService;
import com.example.chatku.network.SocketManager;
import com.example.chatku.utils.SessionManager;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.socket.client.Socket;
import io.socket.emitter.Emitter;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;


/**
 * =========================================
 * CHAT ACTIVITY
 * =========================================
 *
 * Fitur:
 *
 * - Load history pesan
 * - Kirim pesan
 * - Socket.IO realtime
 * - Anti duplicate message
 * - Typing indicator
 * - Message delivered
 * - Message read
 * - Join conversation
 * - Leave conversation
 *
 */
public class ChatActivity extends AppCompatActivity {


    /* =========================================
       VIEW
    ========================================= */

    private RecyclerView messageRecyclerView;

    private EditText messageEditText;

    private ImageButton sendButton;

    private TextView chatNameText;

    private TextView emptyText;


    /* =========================================
       ADAPTER
    ========================================= */

    private MessageAdapter adapter;


    /* =========================================
       MESSAGE LIST
    ========================================= */

    private final List<Message> messages =
            new ArrayList<>();


    /* =========================================
       API
    ========================================= */

    private ApiService apiService;

    private SessionManager session;


    /* =========================================
       SOCKET
    ========================================= */

    private Socket socket;


    /* =========================================
       CONVERSATION
    ========================================= */

    private long conversationId;

    private String conversationName;


    /* =========================================
       TYPING
    ========================================= */

    private final Handler typingHandler =
            new Handler(
                    Looper.getMainLooper()
            );


    private boolean typing = false;


    private final Runnable typingStopRunnable =
            new Runnable() {

                @Override
                public void run() {

                    if (typing) {

                        SocketManager.typingStop(
                                conversationId
                        );

                        typing = false;
                    }

                }

            };


    /* =========================================
       ACTIVITY CREATE
    ========================================= */

    @Override
    protected void onCreate(
            Bundle savedInstanceState
    ) {

        super.onCreate(
                savedInstanceState
        );


        setContentView(
                R.layout.activity_chat
        );


        /* =====================================
           SESSION
        ===================================== */

        session =
                new SessionManager(this);


        if (!session.isLoggedIn()) {

            Toast.makeText(
                    this,
                    "Silakan login terlebih dahulu",
                    Toast.LENGTH_SHORT
            ).show();

            finish();

            return;
        }


        /* =====================================
           GET CONVERSATION
        ===================================== */

        conversationId =
                getIntent().getLongExtra(
                        "conversation_id",
                        0
                );


        conversationName =
                getIntent().getStringExtra(
                        "conversation_name"
                );


        if (conversationId <= 0) {

            Toast.makeText(
                    this,
                    "Conversation tidak valid",
                    Toast.LENGTH_LONG
            ).show();

            finish();

            return;
        }


        if (
                conversationName == null
                        ||
                        conversationName.trim().isEmpty()
        ) {

            conversationName =
                    "Chat";

        }


        /* =====================================
           FIND VIEW
        ===================================== */

        chatNameText =
                findViewById(
                        R.id.chatNameText
                );


        messageRecyclerView =
                findViewById(
                        R.id.messageRecyclerView
                );


        messageEditText =
                findViewById(
                        R.id.messageEditText
                );


        sendButton =
                findViewById(
                        R.id.sendButton
                );


        emptyText =
                findViewById(
                        R.id.emptyText
                );


        /* =====================================
           CHAT NAME
        ===================================== */

        if (chatNameText != null) {

            chatNameText.setText(
                    conversationName
            );

        }


        /* =====================================
           RECYCLER VIEW
        ===================================== */

        LinearLayoutManager layoutManager =
                new LinearLayoutManager(
                        this
                );


        layoutManager.setStackFromEnd(
                true
        );


        messageRecyclerView.setLayoutManager(
                layoutManager
        );


        messageRecyclerView.setHasFixedSize(
                false
        );


        /* =====================================
           ADAPTER
        ===================================== */

        adapter =
                new MessageAdapter(
                        messages,
                        session.getUserId()
                );


        messageRecyclerView.setAdapter(
                adapter
        );


        /* =====================================
           API SERVICE
        ===================================== */

        apiService =
                ApiClient
                        .getClient()
                        .create(
                                ApiService.class
                        );


        /* =====================================
           SEND BUTTON
        ===================================== */

        sendButton.setOnClickListener(
                v -> sendMessage()
        );


        /* =====================================
           TEXT WATCHER
        ===================================== */

        messageEditText.addTextChangedListener(
                new TextWatcher() {

                    @Override
                    public void beforeTextChanged(
                            CharSequence s,
                            int start,
                            int count,
                            int after
                    ) {

                        // Tidak digunakan
                    }


                    @Override
                    public void onTextChanged(
                            CharSequence s,
                            int start,
                            int before,
                            int count
                    ) {

                        handleTyping(
                                s != null
                                        ? s.toString()
                                        : ""
                        );

                    }


                    @Override
                    public void afterTextChanged(
                            Editable s
                    ) {

                        // Tidak digunakan
                    }

                }
        );


        /* =====================================
           BACK BUTTON
        ===================================== */

        getOnBackPressedDispatcher()
                .addCallback(
                        this,
                        new OnBackPressedCallback(true) {

                            @Override
                            public void handleOnBackPressed() {

                                finish();

                            }

                        }
                );


        /* =====================================
           LOAD HISTORY
        ===================================== */

        loadMessages();


        /* =====================================
           SOCKET
        ===================================== */

        setupSocket();

    }


    /* =========================================
       SOCKET SETUP
    ========================================= */

    private void setupSocket() {

        final long userId =
                session.getUserId();


        if (userId <= 0) {

            return;
        }


        socket =
                SocketManager.getSocket();


        if (socket == null) {

            Toast.makeText(
                    this,
                    "Socket tidak tersedia",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        /* =====================================
           REMOVE OLD LISTENER
        ===================================== */

        SocketManager.removeNewMessageListener();


        socket.off(
                "message_deleted"
        );


        socket.off(
                "typing_start"
        );


        socket.off(
                "typing_stop"
        );


        socket.off(
                "message_read"
        );


        socket.off(
                "message_delivered"
        );


        /* =====================================
           NEW MESSAGE
        ===================================== */

        SocketManager.onNewMessage(
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        if (
                                args == null
                                        ||
                                        args.length == 0
                        ) {

                            return;
                        }


                        runOnUiThread(
                                () -> {

                                    try {

                                        if (
                                                !(args[0]
                                                        instanceof JSONObject)
                                        ) {

                                            return;
                                        }


                                        JSONObject json =
                                                (JSONObject) args[0];


                                        Message message =
                                                parseMessage(
                                                        json
                                                );


                                        if (
                                                message == null
                                        ) {

                                            return;
                                        }


                                        if (
                                                message.conversationId
                                                        !=
                                                        conversationId
                                        ) {

                                            return;
                                        }


                                        addMessageIfNotExists(
                                                message
                                        );


                                    } catch (Exception e) {

                                        e.printStackTrace();

                                    }

                                }
                        );

                    }

                }
        );


        /* =====================================
           MESSAGE DELETED
        ===================================== */

        socket.on(
                "message_deleted",
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        if (
                                args == null
                                        ||
                                        args.length == 0
                        ) {

                            return;
                        }


                        runOnUiThread(
                                () -> {

                                    try {

                                        if (
                                                !(args[0]
                                                        instanceof JSONObject)
                                        ) {

                                            return;
                                        }


                                        JSONObject json =
                                                (JSONObject) args[0];


                                        long messageId =
                                                json.optLong(
                                                        "id",
                                                        0
                                                );


                                        long convId =
                                                json.optLong(
                                                        "conversation_id",
                                                        0
                                                );


                                        if (
                                                convId
                                                        !=
                                                        conversationId
                                        ) {

                                            return;
                                        }


                                        removeMessage(
                                                messageId
                                        );


                                    } catch (Exception e) {

                                        e.printStackTrace();

                                    }

                                }
                        );

                    }

                }
        );


        /* =====================================
           TYPING START
        ===================================== */

        socket.on(
                "typing_start",
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        if (
                                args == null
                                        ||
                                        args.length == 0
                        ) {

                            return;
                        }


                        runOnUiThread(
                                () -> {

                                    try {

                                        if (
                                                !(args[0]
                                                        instanceof JSONObject)
                                        ) {

                                            return;
                                        }


                                        JSONObject json =
                                                (JSONObject) args[0];


                                        long typingUserId =
                                                json.optLong(
                                                        "user_id",
                                                        0
                                                );


                                        long convId =
                                                json.optLong(
                                                        "conversation_id",
                                                        0
                                                );


                                        if (
                                                convId
                                                        !=
                                                        conversationId
                                        ) {

                                            return;
                                        }


                                        if (
                                                typingUserId
                                                        ==
                                                        session.getUserId()
                                        ) {

                                            return;
                                        }


                                        if (
                                                chatNameText != null
                                        ) {

                                            chatNameText.setText(
                                                    conversationName
                                                            +
                                                            " sedang mengetik..."
                                            );

                                        }


                                    } catch (Exception e) {

                                        e.printStackTrace();

                                    }

                                }
                        );

                    }

                }
        );


        /* =====================================
           TYPING STOP
        ===================================== */

        socket.on(
                "typing_stop",
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        if (
                                args == null
                                        ||
                                        args.length == 0
                        ) {

                            return;
                        }


                        runOnUiThread(
                                () -> {

                                    try {

                                        if (
                                                args[0]
                                                        instanceof JSONObject
                                        ) {

                                            JSONObject json =
                                                    (JSONObject) args[0];


                                            long convId =
                                                    json.optLong(
                                                            "conversation_id",
                                                            0
                                                    );


                                            if (
                                                    convId
                                                            !=
                                                            conversationId
                                            ) {

                                                return;
                                            }

                                        }


                                        if (
                                                chatNameText != null
                                        ) {

                                            chatNameText.setText(
                                                    conversationName
                                            );

                                        }


                                    } catch (Exception e) {

                                        e.printStackTrace();

                                    }

                                }
                        );

                    }

                }
        );


        /* =====================================
           MESSAGE READ
        ===================================== */

        socket.on(
                "message_read",
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        runOnUiThread(
                                () -> {

                                    /*
                                     * Untuk sekarang event
                                     * diterima tanpa mengubah
                                     * tampilan adapter.
                                     *
                                     * Status read bisa kita
                                     * tambahkan setelah struktur
                                     * adapter disesuaikan.
                                     */

                                }
                        );

                    }

                }
        );


        /* =====================================
           MESSAGE DELIVERED
        ===================================== */

        socket.on(
                "message_delivered",
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        runOnUiThread(
                                () -> {

                                    /*
                                     * Untuk sekarang event
                                     * diterima.
                                     *
                                     * Status delivered akan
                                     * dikembangkan di adapter.
                                     */

                                }
                        );

                    }

                }
        );


        /* =====================================
           CONNECT
        ===================================== */

        socket.off(
                Socket.EVENT_CONNECT
        );


        socket.on(
                Socket.EVENT_CONNECT,
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        runOnUiThread(
                                () -> {

                                    SocketManager
                                            .joinConversation(
                                                    conversationId
                                            );

                                }
                        );

                    }

                }
        );


        /* =====================================
           CONNECT ERROR
        ===================================== */

        socket.off(
                Socket.EVENT_CONNECT_ERROR
        );


        socket.on(
                Socket.EVENT_CONNECT_ERROR,
                new Emitter.Listener() {

                    @Override
                    public void call(
                            Object... args
                    ) {

                        runOnUiThread(
                                () -> {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            "Socket gagal terhubung",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                }
                        );

                    }

                }
        );


        /* =====================================
           START SOCKET
        ===================================== */

        SocketManager.connect(
                userId
        );


        /* =====================================
           JIKA SUDAH CONNECT
        ===================================== */

        if (
                socket.connected()
        ) {

            SocketManager
                    .joinConversation(
                            conversationId
                    );

        }

    }


    /* =========================================
       PARSE MESSAGE
    ========================================= */

    private Message parseMessage(
            JSONObject json
    ) {

        try {

            Message message =
                    new Message();


            /*
             * Message.java kamu menggunakan
             * PUBLIC FIELD.
             *
             * Jadi jangan menggunakan:
             *
             * message.setId()
             *
             * message.getId()
             *
             * dll.
             */


            message.id =
                    json.optLong(
                            "id",
                            0
                    );


            message.conversationId =
                    json.optLong(
                            "conversation_id",
                            0
                    );


            message.senderId =
                    json.optLong(
                            "sender_id",
                            0
                    );


            message.messageType =
                    json.optString(
                            "message_type",
                            "text"
                    );


            if (
                    json.has("message_text")
                            &&
                            !json.isNull("message_text")
            ) {

                message.messageText =
                        json.optString(
                                "message_text",
                                ""
                        );

            } else {

                message.messageText =
                        "";

            }


            if (
                    json.has(
                            "reply_to_message_id"
                    )
                            &&
                            !json.isNull(
                                    "reply_to_message_id"
                            )
            ) {

                message.replyToMessageId =
                        json.optLong(
                                "reply_to_message_id",
                                0
                        );

            } else {

                message.replyToMessageId =
                        null;

            }


            message.isEdited =
                    json.optInt(
                            "is_edited",
                            0
                    );


            message.isDeleted =
                    json.optInt(
                            "is_deleted",
                            0
                    );


            message.createdAt =
                    json.optString(
                            "created_at",
                            ""
                    );


            message.updatedAt =
                    json.optString(
                            "updated_at",
                            ""
                    );


            message.phone =
                    json.optString(
                            "phone",
                            ""
                    );


            message.fullName =
                    json.optString(
                            "full_name",
                            ""
                    );


            message.username =
                    json.optString(
                            "username",
                            ""
                    );


            message.avatarUrl =
                    json.optString(
                            "avatar_url",
                            ""
                    );


            message.isVerified =
                    json.optInt(
                            "is_verified",
                            0
                    );


            return message;


        } catch (Exception e) {

            e.printStackTrace();

            return null;

        }

    }


    /* =========================================
       ADD MESSAGE
    ========================================= */

    private void addMessageIfNotExists(
            Message newMessage
    ) {

        if (
                newMessage == null
        ) {

            return;
        }


        /* =====================================
           CEK DUPLICATE ID
        ===================================== */

        if (
                newMessage.id > 0
        ) {

            for (
                    Message oldMessage :
                    messages
            ) {

                if (
                        oldMessage.id
                                ==
                                newMessage.id
                ) {

                    return;
                }

            }

        }


        /* =====================================
           TAMBAHKAN MESSAGE
        ===================================== */

        messages.add(
                newMessage
        );


        adapter.notifyItemInserted(
                messages.size() - 1
        );


        updateEmptyState();


        /* =====================================
           SCROLL
        ===================================== */

        messageRecyclerView
                .post(
                        () -> {

                            if (
                                    !messages.isEmpty()
                            ) {

                                messageRecyclerView
                                        .scrollToPosition(
                                                messages.size() - 1
                                        );

                            }

                        }
                );


        /* =====================================
           DELIVERED + READ
        ===================================== */

        if (
                newMessage.senderId
                        !=
                        session.getUserId()
        ) {

            if (
                    newMessage.id > 0
            ) {

                SocketManager
                        .messageDelivered(
                                newMessage.id,
                                conversationId
                        );


                SocketManager
                        .messageRead(
                                newMessage.id,
                                conversationId
                        );

            }

        }

    }


    /* =========================================
       REMOVE MESSAGE
    ========================================= */

    private void removeMessage(
            long messageId
    ) {

        if (
                messageId <= 0
        ) {

            return;
        }


        for (
                int i = 0;
                i < messages.size();
                i++
        ) {

            Message message =
                    messages.get(i);


            if (
                    message.id
                            ==
                            messageId
            ) {

                messages.remove(i);


                adapter.notifyItemRemoved(
                        i
                );


                updateEmptyState();


                return;

            }

        }

    }


    /* =========================================
       LOAD MESSAGES
    ========================================= */

    private void loadMessages() {

        String token =
                session.getToken();


        if (
                token == null
                        ||
                        token.trim().isEmpty()
        ) {

            Toast.makeText(
                    this,
                    "Session login tidak ditemukan",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        apiService
                .getMessages(
                        "Bearer " + token,
                        conversationId
                )
                .enqueue(
                        new Callback<ConversationResponse>() {

                            @Override
                            public void onResponse(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Response<ConversationResponse> response
                            ) {

                                if (
                                        !response.isSuccessful()
                                ) {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            "Gagal mengambil pesan (" +
                                                    response.code() +
                                                    ")",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                ConversationResponse body =
                                        response.body();


                                if (
                                        body == null
                                ) {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            "Response server kosong",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                if (
                                        !body.success
                                ) {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            body.message != null
                                                    ?
                                                    body.message
                                                    :
                                                    "Gagal mengambil pesan",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                /* =============================
                                   UPDATE MESSAGE
                                ============================= */

                                messages.clear();


                                if (
                                        body.messages != null
                                ) {

                                    messages.addAll(
                                            body.messages
                                    );

                                }


                                adapter.notifyDataSetChanged();


                                updateEmptyState();


                                /* =============================
                                   SCROLL
                                ============================= */

                                if (
                                        !messages.isEmpty()
                                ) {

                                    messageRecyclerView
                                            .scrollToPosition(
                                                    messages.size() - 1
                                            );

                                }

                            }


                            @Override
                            public void onFailure(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Throwable t
                            ) {

                                Toast.makeText(
                                        ChatActivity.this,
                                        "Koneksi gagal: " +
                                                t.getMessage(),
                                        Toast.LENGTH_LONG
                                ).show();

                            }

                        }
                );

    }


    /* =========================================
       SEND MESSAGE
    ========================================= */

    private void sendMessage() {

        String text =
                messageEditText
                        .getText()
                        .toString()
                        .trim();


        if (
                text.isEmpty()
        ) {

            return;
        }


        String token =
                session.getToken();


        if (
                token == null
                        ||
                        token.trim().isEmpty()
        ) {

            Toast.makeText(
                    this,
                    "Session login tidak ditemukan",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        /* =====================================
           DISABLE BUTTON
        ===================================== */

        sendButton.setEnabled(
                false
        );


        /* =====================================
           REQUEST BODY
        ===================================== */

        Map<String, Object> requestBody =
                new HashMap<>();


        requestBody.put(
                "conversation_id",
                conversationId
        );


        requestBody.put(
                "message",
                text
        );


        requestBody.put(
                "message_type",
                "text"
        );


        /* =====================================
           SEND API
        ===================================== */

        apiService
                .sendMessage(
                        "Bearer " + token,
                        requestBody
                )
                .enqueue(
                        new Callback<ConversationResponse>() {

                            @Override
                            public void onResponse(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Response<ConversationResponse> response
                            ) {

                                sendButton.setEnabled(
                                        true
                                );


                                if (
                                        !response.isSuccessful()
                                ) {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            "Pesan gagal dikirim (" +
                                                    response.code() +
                                                    ")",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                ConversationResponse body =
                                        response.body();


                                if (
                                        body == null
                                ) {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            "Response server kosong",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                if (
                                        !body.success
                                ) {

                                    Toast.makeText(
                                            ChatActivity.this,
                                            body.message != null
                                                    ?
                                                    body.message
                                                    :
                                                    "Pesan gagal dikirim",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                /* =============================
                                   CLEAR INPUT
                                ============================= */

                                messageEditText.setText("");


                                /*
                                 * TIDAK melakukan loadMessages()
                                 *
                                 * Backend mengirim:
                                 *
                                 * new_message
                                 *
                                 * melalui Socket.IO.
                                 *
                                 * Listener Socket akan
                                 * memasukkan pesan ke RecyclerView.
                                 */

                            }


                            @Override
                            public void onFailure(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Throwable t
                            ) {

                                sendButton.setEnabled(
                                        true
                                );


                                Toast.makeText(
                                        ChatActivity.this,
                                        "Koneksi gagal: " +
                                                t.getMessage(),
                                        Toast.LENGTH_LONG
                                ).show();

                            }

                        }
                );

    }


    /* =========================================
       TYPING
    ========================================= */

    private void handleTyping(
            String text
    ) {

        if (
                text == null
                        ||
                        text.trim().isEmpty()
        ) {

            typingHandler.removeCallbacks(
                    typingStopRunnable
            );


            if (typing) {

                SocketManager
                        .typingStop(
                                conversationId
                        );

                typing = false;

            }


            return;
        }


        /* =====================================
           START TYPING
        ===================================== */

        if (!typing) {

            typing = true;


            SocketManager
                    .typingStart(
                            conversationId
                    );

        }


        /* =====================================
           RESET TIMER
        ===================================== */

        typingHandler.removeCallbacks(
                typingStopRunnable
        );


        typingHandler.postDelayed(
                typingStopRunnable,
                1200
        );

    }


    /* =========================================
       EMPTY STATE
    ========================================= */

    private void updateEmptyState() {

        if (
                emptyText == null
        ) {

            return;
        }


        if (
                messages.isEmpty()
        ) {

            emptyText.setVisibility(
                    View.VISIBLE
            );

        } else {

            emptyText.setVisibility(
                    View.GONE
            );

        }

    }


    /* =========================================
       RESUME
    ========================================= */

    @Override
    protected void onResume() {

        super.onResume();


        if (
                socket != null
                        &&
                        socket.connected()
        ) {

            SocketManager
                    .joinConversation(
                            conversationId
                    );

        }

    }


    /* =========================================
       PAUSE
    ========================================= */

    @Override
    protected void onPause() {

        super.onPause();


        typingHandler.removeCallbacks(
                typingStopRunnable
        );


        if (typing) {

            SocketManager
                    .typingStop(
                            conversationId
                    );

            typing = false;

        }

    }


    /* =========================================
       DESTROY
    ========================================= */

    @Override
    protected void onDestroy() {

        typingHandler.removeCallbacks(
                typingStopRunnable
        );


        if (typing) {

            SocketManager
                    .typingStop(
                            conversationId
                    );

            typing = false;

        }


        if (
                socket != null
        ) {

            SocketManager
                    .leaveConversation(
                            conversationId
                    );


            socket.off(
                    "message_deleted"
            );

        }


        SocketManager
                .removeNewMessageListener();


        super.onDestroy();

    }

}