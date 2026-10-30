package com.example.chatku;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.adapter.ConversationAdapter;
import com.example.chatku.model.AuthResponse;
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

public class MainActivity extends AppCompatActivity
        implements ConversationAdapter.OnConversationClickListener {

    private SessionManager session;

    private TextView welcomeText;
    private TextView phoneText;
    private TextView statusText;
    private TextView conversationCountText;

    private Button logoutButton;
    private Button newChatButton;

    private EditText searchEditText;

    private RecyclerView conversationRecyclerView;

    private TextView emptyText;

    private View emptyStateLayout;

    private ConversationAdapter adapter;

    private final List<Conversation> conversations =
            new ArrayList<>();

    private final List<Conversation> filteredConversations =
            new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);

        // =====================================
        // SESSION
        // =====================================

        session = new SessionManager(this);

        if (!session.isLoggedIn()) {

            openLogin();

            return;
        }

        // =====================================
        // FIND VIEW
        // =====================================

        welcomeText =
                findViewById(R.id.welcomeText);

        phoneText =
                findViewById(R.id.phoneText);

        statusText =
                findViewById(R.id.statusText);

        logoutButton =
                findViewById(R.id.logoutButton);

        newChatButton =
                findViewById(R.id.newChatButton);

        searchEditText =
                findViewById(R.id.searchEditText);

        conversationRecyclerView =
                findViewById(R.id.conversationRecyclerView);

        emptyText =
                findViewById(R.id.emptyText);

        conversationCountText =
                findViewById(R.id.conversationCountText);

        emptyStateLayout =
                findViewById(R.id.emptyStateLayout);

        // =====================================
        // USER INFO
        // =====================================

        String phone = session.getPhone();

        if (phone != null && !phone.trim().isEmpty()) {

            phoneText.setText(
                    "Nomor: " + phone
            );

        } else {

            phoneText.setText(
                    "Nomor: -"
            );
        }

        // =====================================
        // RECYCLER VIEW
        // =====================================

        conversationRecyclerView.setLayoutManager(
                new LinearLayoutManager(this)
        );

        // =====================================
        // ADAPTER
        // =====================================
        //
        // PENTING:
        // ConversationAdapter kamu sekarang
        // hanya punya constructor:
        //
        // ConversationAdapter(listener)
        //
        // =====================================

        adapter =
                new ConversationAdapter(this);

        conversationRecyclerView.setAdapter(
                adapter
        );

        // =====================================
        // LOGOUT
        // =====================================

        logoutButton.setOnClickListener(
                v -> logout()
        );

        // =====================================
        // NEW CHAT
        // =====================================

        newChatButton.setOnClickListener(
                v -> {

                    Intent intent =
                            new Intent(
                                    MainActivity.this,
                                    NewChatActivity.class
                            );

                    startActivity(intent);
                }
        );

        // =====================================
        // SEARCH
        // =====================================

        searchEditText.addTextChangedListener(
                new TextWatcher() {

                    @Override
                    public void beforeTextChanged(
                            CharSequence s,
                            int start,
                            int count,
                            int after
                    ) {
                    }

                    @Override
                    public void onTextChanged(
                            CharSequence s,
                            int start,
                            int before,
                            int count
                    ) {

                        filterConversations(
                                s.toString()
                        );

                    }

                    @Override
                    public void afterTextChanged(
                            Editable s
                    ) {
                    }
                }
        );

        // =====================================
        // LOAD USER
        // =====================================

        loadCurrentUser();

        // =====================================
        // LOAD CONVERSATIONS
        // =====================================

        loadConversations();
    }

    // =========================================
    // LOAD CURRENT USER
    // =========================================

    private void loadCurrentUser() {

        String token =
                session.getToken();

        if (token == null ||
                token.trim().isEmpty()) {

            return;
        }

        ApiService api =
                ApiClient
                        .getClient()
                        .create(ApiService.class);

        api.getMe(
                "Bearer " + token
        ).enqueue(
                new Callback<AuthResponse>() {

                    @Override
                    public void onResponse(
                            @NonNull Call<AuthResponse> call,
                            @NonNull Response<AuthResponse> response
                    ) {

                        if (
                                response.isSuccessful()
                                        &&
                                        response.body() != null
                                        &&
                                        response.body().success
                        ) {

                            AuthResponse.User user =
                                    response.body().user;

                            if (user == null) {
                                return;
                            }

                            String name =
                                    user.full_name;

                            if (
                                    name == null ||
                                            name.trim().isEmpty()
                            ) {

                                name =
                                        user.username;
                            }

                            if (
                                    name == null ||
                                            name.trim().isEmpty()
                            ) {

                                name =
                                        "Pengguna ChatKu";
                            }

                            welcomeText.setText(
                                    "Halo, " + name
                            );

                            if (
                                    user.phone != null &&
                                            !user.phone.trim().isEmpty()
                            ) {

                                phoneText.setText(
                                        "Nomor: " +
                                                user.phone
                                );
                            }

                            if (user.is_verified) {

                                statusText.setText(
                                        "✓ Akun terverifikasi"
                                );

                            } else {

                                statusText.setText(
                                        "Akun belum terverifikasi"
                                );
                            }

                        } else {

                            statusText.setText(
                                    "Gagal mengambil data akun"
                            );
                        }
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call<AuthResponse> call,
                            @NonNull Throwable t
                    ) {

                        statusText.setText(
                                "Mode offline"
                        );
                    }
                }
        );
    }

    // =========================================
    // LOAD CONVERSATIONS
    // =========================================

    private void loadConversations() {

        String token =
                session.getToken();

        if (
                token == null ||
                        token.trim().isEmpty()
        ) {

            return;
        }

        ApiService api =
                ApiClient
                        .getClient()
                        .create(ApiService.class);

        api.getConversations(
                "Bearer " + token
        ).enqueue(
                new Callback<ConversationResponse>() {

                    @Override
                    public void onResponse(
                            @NonNull Call<ConversationResponse> call,
                            @NonNull Response<ConversationResponse> response
                    ) {

                        if (
                                response.isSuccessful()
                                        &&
                                        response.body() != null
                        ) {

                            ConversationResponse body =
                                    response.body();

                            if (
                                    body.success &&
                                            body.conversations != null
                            ) {

                                conversations.clear();

                                conversations.addAll(
                                        body.conversations
                                );

                                filterConversations(
                                        searchEditText
                                                .getText()
                                                .toString()
                                );

                            } else {

                                conversations.clear();

                                filteredConversations.clear();

                                adapter.setConversations(
                                        filteredConversations
                                );

                                showEmptyState(
                                        "Belum ada percakapan"
                                );
                            }

                        } else {

                            showEmptyState(
                                    "Gagal mengambil percakapan"
                            );
                        }
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call<ConversationResponse> call,
                            @NonNull Throwable t
                    ) {

                        showEmptyState(
                                "Tidak dapat terhubung ke server"
                        );

                        Toast.makeText(
                                MainActivity.this,
                                "Gagal memuat chat: " +
                                        t.getMessage(),
                                Toast.LENGTH_SHORT
                        ).show();
                    }
                }
        );
    }

    // =========================================
    // FILTER
    // =========================================

    private void filterConversations(
            String keyword
    ) {

        filteredConversations.clear();

        String query =
                keyword == null
                        ? ""
                        : keyword
                          .trim()
                          .toLowerCase();

        for (
                Conversation conversation :
                conversations
        ) {

            if (conversation == null) {
                continue;
            }

            String name =
                    conversation.getDisplayName();

            String lastMessage =
                    conversation.getLastMessageText();

            if (name == null) {
                name = "";
            }

            if (lastMessage == null) {
                lastMessage = "";
            }

            String searchable =
                    (
                            name +
                                    " " +
                                    lastMessage
                    ).toLowerCase();

            if (
                    query.isEmpty() ||
                            searchable.contains(query)
            ) {

                filteredConversations.add(
                        conversation
                );
            }
        }

        // =====================================
        // UPDATE ADAPTER
        // =====================================

        adapter.setConversations(
                filteredConversations
        );

        updateEmptyState();
    }

    // =========================================
    // EMPTY STATE
    // =========================================

    private void updateEmptyState() {

        int count =
                filteredConversations.size();

        if (conversationCountText != null) {

            if (count > 0) {

                conversationCountText.setText(
                        String.valueOf(count)
                );

            } else {

                conversationCountText.setText(
                        ""
                );
            }
        }

        if (count == 0) {

            if (conversations.isEmpty()) {

                showEmptyState(
                        "Belum ada percakapan"
                );

            } else {

                showEmptyState(
                        "Percakapan tidak ditemukan"
                );
            }

        } else {

            hideEmptyState();
        }
    }

    // =========================================
    // SHOW EMPTY
    // =========================================

    private void showEmptyState(
            String message
    ) {

        if (emptyText != null) {

            emptyText.setText(
                    message
            );

        }

        if (emptyStateLayout != null) {

            emptyStateLayout.setVisibility(
                    View.VISIBLE
            );

        } else if (emptyText != null) {

            emptyText.setVisibility(
                    View.VISIBLE
            );
        }

        if (conversationRecyclerView != null) {

            conversationRecyclerView.setVisibility(
                    View.VISIBLE
            );
        }
    }

    // =========================================
    // HIDE EMPTY
    // =========================================

    private void hideEmptyState() {

        if (emptyStateLayout != null) {

            emptyStateLayout.setVisibility(
                    View.GONE
            );
        }

        if (emptyText != null) {

            emptyText.setVisibility(
                    View.GONE
            );
        }

        if (conversationRecyclerView != null) {

            conversationRecyclerView.setVisibility(
                    View.VISIBLE
            );
        }
    }

    // =========================================
    // CLICK CONVERSATION
    // =========================================

    @Override
    public void onConversationClick(
            Conversation conversation
    ) {

        if (conversation == null) {
            return;
        }

        Intent intent =
                new Intent(
                        MainActivity.this,
                        ChatActivity.class
                );

        intent.putExtra(
                "conversation_id",
                conversation.id
        );

        intent.putExtra(
                "other_user_id",
                conversation.otherUserId
        );

        intent.putExtra(
                "conversation_name",
                conversation.getDisplayName()
        );

        intent.putExtra(
                "other_user_name",
                conversation.getDisplayName()
        );

        intent.putExtra(
                "other_user_phone",
                conversation.otherUserPhone
        );

        intent.putExtra(
                "other_avatar",
                conversation.getAvatarUrl()
        );

        startActivity(intent);
    }

    // =========================================
    // LOGOUT
    // =========================================

    private void logout() {

        String token =
                session.getToken();

        if (
                token == null ||
                        token.trim().isEmpty()
        ) {

            session.logout();

            openLogin();

            return;
        }

        ApiService api =
                ApiClient
                        .getClient()
                        .create(ApiService.class);

        api.logout(
                "Bearer " + token
        ).enqueue(
                new Callback<AuthResponse>() {

                    @Override
                    public void onResponse(
                            @NonNull Call<AuthResponse> call,
                            @NonNull Response<AuthResponse> response
                    ) {

                        session.logout();

                        openLogin();
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call<AuthResponse> call,
                            @NonNull Throwable t
                    ) {

                        session.logout();

                        openLogin();
                    }
                }
        );
    }

    // =========================================
    // OPEN LOGIN
    // =========================================

    private void openLogin() {

        Intent intent =
                new Intent(
                        MainActivity.this,
                        LoginActivity.class
                );

        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TASK
        );

        startActivity(intent);

        finish();
    }

    // =========================================
    // RESUME
    // =========================================

    @Override
    protected void onResume() {

        super.onResume();

        if (
                session != null &&
                        session.isLoggedIn()
        ) {

            loadConversations();
        }
    }
}