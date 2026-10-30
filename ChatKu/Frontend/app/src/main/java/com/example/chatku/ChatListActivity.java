package com.example.chatku;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.adapter.ConversationAdapter;
import com.example.chatku.model.Conversation;
import com.example.chatku.model.ConversationResponse;
import com.example.chatku.network.ApiClient;
import com.example.chatku.network.ApiService;
import com.example.chatku.utils.SessionManager;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChatListActivity extends AppCompatActivity {

    // =========================================
    // VIEW
    // =========================================

    private RecyclerView recyclerConversations;

    private ProgressBar progressBar;

    private TextView txtEmpty;


    // =========================================
    // ADAPTER
    // =========================================

    private ConversationAdapter adapter;


    // =========================================
    // DATA
    // =========================================

    private final List<Conversation> conversations =
            new ArrayList<>();


    // =========================================
    // API
    // =========================================

    private ApiService apiService;


    // =========================================
    // SESSION
    // =========================================

    private SessionManager session;


    // =========================================
    // ON CREATE
    // =========================================

    @Override
    protected void onCreate(
            Bundle savedInstanceState
    ) {

        super.onCreate(
                savedInstanceState
        );


        setContentView(
                R.layout.activity_chat_list
        );


        // =====================================
        // SESSION
        // =====================================

        session =
                new SessionManager(this);


        if (!session.isLoggedIn()) {

            Toast.makeText(
                    this,
                    "Silakan login terlebih dahulu",
                    Toast.LENGTH_LONG
            ).show();

            finish();

            return;
        }


        // =====================================
        // VIEW
        // =====================================

        recyclerConversations =
                findViewById(
                        R.id.recyclerConversations
                );


        progressBar =
                findViewById(
                        R.id.progressBar
                );


        txtEmpty =
                findViewById(
                        R.id.txtEmpty
                );


        // =====================================
        // RECYCLERVIEW
        // =====================================

        recyclerConversations.setLayoutManager(
                new LinearLayoutManager(this)
        );


        // =====================================
        // ADAPTER
        // =====================================

        adapter =
                new ConversationAdapter(
                        conversation -> {

                            if (conversation == null) {

                                return;
                            }


                            Intent intent =
                                    new Intent(
                                            ChatListActivity.this,
                                            ChatActivity.class
                                    );


                            intent.putExtra(
                                    "conversation_id",
                                    conversation.id
                            );


                            intent.putExtra(
                                    "conversation_name",
                                    conversation.getDisplayName()
                            );


                            startActivity(intent);
                        }
                );


        recyclerConversations.setAdapter(
                adapter
        );


        // =====================================
        // API
        // =====================================

        apiService =
                ApiClient
                        .getClient()
                        .create(
                                ApiService.class
                        );


        // =====================================
        // LOAD CONVERSATIONS
        // =====================================

        loadConversations();
    }


    // =========================================
    // LOAD CONVERSATIONS
    // =========================================

    private void loadConversations() {

        if (session == null ||
                !session.isLoggedIn()) {

            return;
        }


        String token =
                session.getToken();


        if (token == null ||
                token.trim().isEmpty()) {

            Toast.makeText(
                    this,
                    "Token login tidak ditemukan",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        showLoading(true);


        apiService
                .getConversations(
                        "Bearer " + token
                )
                .enqueue(
                        new Callback<ConversationResponse>() {

                            @Override
                            public void onResponse(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Response<ConversationResponse> response
                            ) {

                                showLoading(false);


                                if (!response.isSuccessful()) {

                                    conversations.clear();

                                    adapter.setConversations(
                                            conversations
                                    );

                                    showEmpty(true);


                                    Toast.makeText(
                                            ChatListActivity.this,
                                            "Gagal mengambil chat. HTTP "
                                                    + response.code(),
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                ConversationResponse body =
                                        response.body();


                                if (body == null) {

                                    conversations.clear();

                                    adapter.setConversations(
                                            conversations
                                    );

                                    showEmpty(true);


                                    Toast.makeText(
                                            ChatListActivity.this,
                                            "Response server kosong",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                if (!body.success) {

                                    conversations.clear();

                                    adapter.setConversations(
                                            conversations
                                    );

                                    showEmpty(true);


                                    Toast.makeText(
                                            ChatListActivity.this,
                                            body.message != null
                                                    ? body.message
                                                    : "Gagal mengambil percakapan",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                // =================================
                                // DATA RESPONSE
                                // =================================

                                List<Conversation> data =
                                        body.conversations;


                                conversations.clear();


                                if (data != null &&
                                        !data.isEmpty()) {

                                    conversations.addAll(
                                            data
                                    );

                                    showEmpty(false);

                                } else {

                                    showEmpty(true);
                                }


                                adapter.setConversations(
                                        conversations
                                );
                            }


                            @Override
                            public void onFailure(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Throwable t
                            ) {

                                showLoading(false);


                                conversations.clear();


                                adapter.setConversations(
                                        conversations
                                );


                                showEmpty(true);


                                Toast.makeText(
                                        ChatListActivity.this,
                                        "Koneksi gagal: "
                                                + t.getMessage(),
                                        Toast.LENGTH_LONG
                                ).show();
                            }
                        }
                );
    }


    // =========================================
    // EMPTY STATE
    // =========================================

    private void showEmpty(
            boolean empty
    ) {

        if (txtEmpty != null) {

            txtEmpty.setVisibility(
                    empty
                            ? View.VISIBLE
                            : View.GONE
            );
        }
    }


    // =========================================
    // LOADING
    // =========================================

    private void showLoading(
            boolean loading
    ) {

        if (progressBar != null) {

            progressBar.setVisibility(
                    loading
                            ? View.VISIBLE
                            : View.GONE
            );
        }


        if (recyclerConversations != null) {

            recyclerConversations.setVisibility(
                    loading
                            ? View.GONE
                            : View.VISIBLE
            );
        }
    }


    // =========================================
    // REFRESH SAAT KEMBALI
    // =========================================

    @Override
    protected void onResume() {

        super.onResume();


        if (session != null &&
                session.isLoggedIn()) {

            loadConversations();
        }
    }
}