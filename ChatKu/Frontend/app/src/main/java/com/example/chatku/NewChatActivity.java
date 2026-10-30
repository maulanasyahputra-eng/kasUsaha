package com.example.chatku;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.chatku.adapter.UserAdapter;
import com.example.chatku.model.ConversationResponse;
import com.example.chatku.model.UserResponse;
import com.example.chatku.network.ApiClient;
import com.example.chatku.network.ApiService;
import com.example.chatku.utils.SessionManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class NewChatActivity extends AppCompatActivity {

    private static final String TAG = "CHATKU_SEARCH";

    // =========================================
    // VIEW
    // =========================================

    private EditText searchEditText;
    private RecyclerView recyclerUsers;
    private ProgressBar progressBar;
    private TextView emptyText;

    // =========================================
    // ADAPTER
    // =========================================

    private UserAdapter adapter;

    // =========================================
    // DATA
    // =========================================

    private final List<UserResponse.User> users =
            new ArrayList<>();

    // =========================================
    // SESSION
    // =========================================

    private SessionManager session;

    // =========================================
    // API
    // =========================================

    private ApiService apiService;


    // =========================================
    // ON CREATE
    // =========================================

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_new_chat);


        // =====================================
        // ANDROIDX BACK
        // =====================================

        getOnBackPressedDispatcher().addCallback(
                this,
                new OnBackPressedCallback(true) {

                    @Override
                    public void handleOnBackPressed() {

                        finish();

                    }
                }
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
                    Toast.LENGTH_SHORT
            ).show();

            finish();

            return;
        }


        // =====================================
        // FIND VIEW
        // =====================================

        searchEditText =
                findViewById(
                        R.id.searchEditText
                );


        recyclerUsers =
                findViewById(
                        R.id.recyclerUsers
                );


        progressBar =
                findViewById(
                        R.id.progressBar
                );


        emptyText =
                findViewById(
                        R.id.emptyText
                );


        // =====================================
        // RECYCLER VIEW
        // =====================================

        recyclerUsers.setLayoutManager(
                new LinearLayoutManager(this)
        );


        // =====================================
        // ADAPTER
        // =====================================

        adapter =
                new UserAdapter(
                        users,
                        user -> openConversation(user)
                );


        recyclerUsers.setAdapter(
                adapter
        );


        // =====================================
        // API
        // =====================================

        apiService =
                ApiClient.getApiService();


        // =====================================
        // SEARCH BUTTON
        // =====================================

        View searchButton =
                findViewById(
                        R.id.searchButton
                );


        if (searchButton != null) {

            searchButton.setOnClickListener(
                    v -> searchUsers()
            );
        }


        // =====================================
        // SEARCH ENTER
        // =====================================

        searchEditText.setOnEditorActionListener(
                (v, actionId, event) -> {

                    searchUsers();

                    return true;
                }
        );


        // =====================================
        // DEFAULT STATE
        // =====================================

        showEmpty(
                "Cari nomor telepon atau username"
        );

    }


    // =========================================
    // SEARCH USERS
    // =========================================

    private void searchUsers() {

        String keyword =
                searchEditText
                        .getText()
                        .toString()
                        .trim();


        // =====================================
        // CEK KEYWORD
        // =====================================

        if (keyword.isEmpty()) {

            Toast.makeText(
                    this,
                    "Masukkan nomor telepon atau username",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        // =====================================
        // TOKEN
        // =====================================

        String token =
                session.getToken();


        if (token == null ||
                token.trim().isEmpty()) {

            Toast.makeText(
                    this,
                    "Session login tidak ditemukan",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        // =====================================
        // LOG REQUEST
        // =====================================

        Log.d(
                TAG,
                "================================="
        );

        Log.d(
                TAG,
                "SEARCH USER"
        );

        Log.d(
                TAG,
                "Keyword: " + keyword
        );

        Log.d(
                TAG,
                "Endpoint: /api/users/search"
        );


        // =====================================
        // LOADING
        // =====================================

        showLoading(true);


        // =====================================
        // SEARCH API
        // =====================================

        apiService
                .searchUsers(
                        "Bearer " + token,
                        keyword
                )
                .enqueue(
                        new Callback<UserResponse>() {

                            @Override
                            public void onResponse(
                                    @NonNull Call<UserResponse> call,
                                    @NonNull Response<UserResponse> response
                            ) {

                                showLoading(false);


                                Log.d(
                                        TAG,
                                        "HTTP CODE: "
                                                + response.code()
                                );


                                // =========================
                                // HTTP ERROR
                                // =========================

                                if (!response.isSuccessful()) {

                                    String errorBody = "";

                                    try {

                                        if (response.errorBody() != null) {

                                            errorBody =
                                                    response
                                                            .errorBody()
                                                            .string();
                                        }

                                    } catch (Exception e) {

                                        Log.e(
                                                TAG,
                                                "Gagal membaca error body",
                                                e
                                        );
                                    }


                                    Log.e(
                                            TAG,
                                            "HTTP ERROR: "
                                                    + errorBody
                                    );


                                    showEmpty(
                                            "Server error HTTP "
                                                    + response.code()
                                    );


                                    Toast.makeText(
                                            NewChatActivity.this,
                                            "HTTP "
                                                    + response.code()
                                                    + "\n"
                                                    + errorBody,
                                            Toast.LENGTH_LONG
                                    ).show();

                                    return;
                                }


                                // =========================
                                // BODY
                                // =========================

                                UserResponse body =
                                        response.body();


                                if (body == null) {

                                    Log.e(
                                            TAG,
                                            "Response body NULL"
                                    );

                                    showEmpty(
                                            "Response server kosong"
                                    );

                                    return;
                                }


                                // =========================
                                // LOG RESPONSE
                                // =========================

                                Log.d(
                                        TAG,
                                        "SUCCESS: "
                                                + body.success
                                );

                                Log.d(
                                        TAG,
                                        "MESSAGE: "
                                                + body.message
                                );


                                // =========================
                                // SERVER ERROR
                                // =========================

                                if (!body.success) {

                                    String message =
                                            body.message != null
                                                    ? body.message
                                                    : "Pencarian gagal";


                                    Log.e(
                                            TAG,
                                            "SERVER ERROR: "
                                                    + message
                                    );


                                    showEmpty(message);

                                    return;
                                }


                                // =========================
                                // UPDATE DATA
                                // =========================

                                users.clear();


                                if (body.users != null) {

                                    users.addAll(
                                            body.users
                                    );
                                }


                                adapter.notifyDataSetChanged();


                                // =========================
                                // HASIL PENCARIAN
                                // =========================

                                Log.d(
                                        TAG,
                                        "JUMLAH USER: "
                                                + users.size()
                                );


                                if (users.isEmpty()) {

                                    showEmpty(
                                            "Pengguna tidak ditemukan"
                                    );

                                } else {

                                    hideEmpty();


                                    Toast.makeText(
                                            NewChatActivity.this,
                                            users.size()
                                                    + " pengguna ditemukan",
                                            Toast.LENGTH_SHORT
                                    ).show();
                                }

                            }


                            @Override
                            public void onFailure(
                                    @NonNull Call<UserResponse> call,
                                    @NonNull Throwable t
                            ) {

                                showLoading(false);


                                // =========================
                                // LOG ERROR ASLI
                                // =========================

                                Log.e(
                                        TAG,
                                        "================================="
                                );

                                Log.e(
                                        TAG,
                                        "SEARCH CONNECTION ERROR"
                                );

                                Log.e(
                                        TAG,
                                        "TYPE: "
                                                + t.getClass()
                                                .getName()
                                );

                                Log.e(
                                        TAG,
                                        "MESSAGE: "
                                                + t.getMessage()
                                );

                                Log.e(
                                        TAG,
                                        "FULL ERROR",
                                        t
                                );


                                // =========================
                                // TAMPILKAN ERROR
                                // =========================

                                String errorMessage =
                                        t.getClass()
                                                .getSimpleName()
                                                + ": "
                                                + t.getMessage();


                                showEmpty(
                                        errorMessage
                                );


                                Toast.makeText(
                                        NewChatActivity.this,
                                        errorMessage,
                                        Toast.LENGTH_LONG
                                ).show();

                            }

                        }
                );

    }


    // =========================================
    // OPEN / CREATE CONVERSATION
    // =========================================

    private void openConversation(
            UserResponse.User user
    ) {

        if (user == null) {

            Toast.makeText(
                    this,
                    "Pengguna tidak valid",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        // =====================================
        // TOKEN
        // =====================================

        String token =
                session.getToken();


        if (token == null ||
                token.trim().isEmpty()) {

            Toast.makeText(
                    this,
                    "Session login tidak ditemukan",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }


        // =====================================
        // REQUEST BODY
        // =====================================

        Map<String, Object> requestBody =
                new HashMap<>();


        requestBody.put(
                "user_id",
                user.id
        );


        // =====================================
        // LOADING
        // =====================================

        showLoading(true);


        // =====================================
        // CREATE CONVERSATION
        // =====================================

        apiService
                .createConversation(
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

                                showLoading(false);


                                // =========================
                                // HTTP ERROR
                                // =========================

                                if (!response.isSuccessful()) {

                                    String error = "";

                                    try {

                                        if (response.errorBody() != null) {

                                            error =
                                                    response
                                                            .errorBody()
                                                            .string();
                                        }

                                    } catch (Exception e) {

                                        Log.e(
                                                TAG,
                                                "Gagal membaca error body",
                                                e
                                        );
                                    }


                                    Log.e(
                                            TAG,
                                            "CREATE CHAT HTTP ERROR: "
                                                    + error
                                    );


                                    Toast.makeText(
                                            NewChatActivity.this,
                                            "Gagal membuka chat HTTP "
                                                    + response.code()
                                                    + "\n"
                                                    + error,
                                            Toast.LENGTH_LONG
                                    ).show();

                                    return;
                                }


                                // =========================
                                // BODY
                                // =========================

                                ConversationResponse body =
                                        response.body();


                                if (body == null) {

                                    Toast.makeText(
                                            NewChatActivity.this,
                                            "Response server kosong",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                // =========================
                                // SERVER ERROR
                                // =========================

                                if (!body.success) {

                                    Toast.makeText(
                                            NewChatActivity.this,
                                            body.message != null
                                                    ? body.message
                                                    : "Gagal membuat percakapan",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                // =========================
                                // CONVERSATION ID
                                // =========================

                                if (body.conversationId <= 0) {

                                    Toast.makeText(
                                            NewChatActivity.this,
                                            "Conversation ID tidak valid",
                                            Toast.LENGTH_SHORT
                                    ).show();

                                    return;
                                }


                                // =========================
                                // OPEN CHAT
                                // =========================

                                Intent intent =
                                        new Intent(
                                                NewChatActivity.this,
                                                ChatActivity.class
                                        );


                                intent.putExtra(
                                        "conversation_id",
                                        body.conversationId
                                );


                                // =========================
                                // DISPLAY NAME
                                // =========================

                                String displayName =
                                        user.getDisplayName();


                                if (displayName == null ||
                                        displayName.trim().isEmpty()) {

                                    if (user.phone != null &&
                                            !user.phone.trim().isEmpty()) {

                                        displayName =
                                                user.phone;

                                    } else {

                                        displayName =
                                                "Pengguna ChatKu";
                                    }
                                }


                                intent.putExtra(
                                        "conversation_name",
                                        displayName
                                );


                                // =========================
                                // OTHER USER ID
                                // =========================

                                intent.putExtra(
                                        "other_user_id",
                                        user.id
                                );


                                // =========================
                                // OTHER USER PHONE
                                // =========================

                                if (user.phone != null) {

                                    intent.putExtra(
                                            "other_user_phone",
                                            user.phone
                                    );
                                }


                                // =========================
                                // START CHAT
                                // =========================

                                startActivity(intent);

                                finish();

                            }


                            @Override
                            public void onFailure(
                                    @NonNull Call<ConversationResponse> call,
                                    @NonNull Throwable t
                            ) {

                                showLoading(false);


                                Log.e(
                                        TAG,
                                        "CREATE CONVERSATION ERROR",
                                        t
                                );


                                Toast.makeText(
                                        NewChatActivity.this,
                                        t.getClass()
                                                .getSimpleName()
                                                + ": "
                                                + t.getMessage(),
                                        Toast.LENGTH_LONG
                                ).show();

                            }

                        }
                );

    }


    // =========================================
    // SHOW LOADING
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


        if (recyclerUsers != null) {

            recyclerUsers.setVisibility(
                    loading
                            ? View.GONE
                            : View.VISIBLE
            );
        }

    }


    // =========================================
    // SHOW EMPTY
    // =========================================

    private void showEmpty(
            String message
    ) {

        users.clear();


        if (adapter != null) {

            adapter.notifyDataSetChanged();
        }


        if (emptyText != null) {

            emptyText.setText(
                    message
            );

            emptyText.setVisibility(
                    View.VISIBLE
            );
        }


        if (recyclerUsers != null) {

            recyclerUsers.setVisibility(
                    View.VISIBLE
            );
        }

    }


    // =========================================
    // HIDE EMPTY
    // =========================================

    private void hideEmpty() {

        if (emptyText != null) {

            emptyText.setVisibility(
                    View.GONE
            );
        }


        if (recyclerUsers != null) {

            recyclerUsers.setVisibility(
                    View.VISIBLE
            );
        }

    }

}