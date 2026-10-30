package com.liveku.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.JsonObject;
import com.liveku.app.network.ApiClient;
import com.liveku.app.network.ApiService;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private EditText etUsername;
    private EditText etEmail;
    private EditText etPassword;

    private Button btnSubmit;
    private TextView tvSwitch;
    private TextView tvMode;
    private TextView tvStatus;

    private boolean registerMode = false;

    private ApiService apiService;

    private SharedPreferences preferences;


    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);


        // ========================================
        // VIEW
        // ========================================

        etUsername =
                findViewById(R.id.etUsername);

        etEmail =
                findViewById(R.id.etEmail);

        etPassword =
                findViewById(R.id.etPassword);

        btnSubmit =
                findViewById(R.id.btnSubmit);

        tvSwitch =
                findViewById(R.id.tvSwitch);

        tvMode =
                findViewById(R.id.tvMode);

        tvStatus =
                findViewById(R.id.tvStatus);


        // ========================================
        // API
        // ========================================

        apiService =
                ApiClient.getApiService();


        // ========================================
        // STORAGE
        // ========================================

        preferences =
                getSharedPreferences(
                        "LiveKu",
                        MODE_PRIVATE
                );


        // ========================================
        // MODE
        // ========================================

        updateMode();


        // ========================================
        // SUBMIT
        // ========================================

        btnSubmit.setOnClickListener(
                v -> submit()
        );


        // ========================================
        // SWITCH LOGIN / REGISTER
        // ========================================

        tvSwitch.setOnClickListener(
                v -> {

                    registerMode =
                            !registerMode;

                    updateMode();

                    etUsername.setText("");

                    etEmail.setText("");

                    etPassword.setText("");

                    tvStatus.setText("");
                }
        );
    }


    // ==========================================
    // MODE
    // ==========================================

    private void updateMode() {

        if (registerMode) {

            tvMode.setText(
                    "Buat Akun Baru"
            );

            etUsername.setVisibility(
                    View.VISIBLE
            );

            btnSubmit.setText(
                    "DAFTAR"
            );

            tvSwitch.setText(
                    "Sudah punya akun? Masuk"
            );

        } else {

            tvMode.setText(
                    "Selamat Datang"
            );

            etUsername.setVisibility(
                    View.GONE
            );

            btnSubmit.setText(
                    "MASUK"
            );

            tvSwitch.setText(
                    "Belum punya akun? Daftar"
            );
        }
    }


    // ==========================================
    // SUBMIT
    // ==========================================

    private void submit() {

        String username =
                etUsername
                        .getText()
                        .toString()
                        .trim();

        String email =
                etEmail
                        .getText()
                        .toString()
                        .trim();

        String password =
                etPassword
                        .getText()
                        .toString();


        if (registerMode) {

            register(
                    username,
                    email,
                    password
            );

        } else {

            login(
                    email,
                    password
            );
        }
    }


    // ==========================================
    // REGISTER
    // ==========================================

    private void register(
            String username,
            String email,
            String password
    ) {

        if (
                username.isEmpty()
                        ||
                        email.isEmpty()
                        ||
                        password.isEmpty()
        ) {

            tvStatus.setText(
                    "Semua data wajib diisi."
            );

            return;
        }


        if (password.length() < 6) {

            tvStatus.setText(
                    "Password minimal 6 karakter."
            );

            return;
        }


        btnSubmit.setEnabled(false);


        tvStatus.setText(
                "Mendaftarkan akun..."
        );


        // ========================================
        // REQUEST BODY
        // ========================================

        JsonObject body =
                new JsonObject();

        body.addProperty(
                "username",
                username
        );

        body.addProperty(
                "email",
                email
        );

        body.addProperty(
                "password",
                password
        );


        // ========================================
        // API REGISTER
        // ========================================

        apiService
                .register(body)
                .enqueue(
                        new Callback<JsonObject>() {

                            @Override
                            public void onResponse(
                                    Call<JsonObject> call,
                                    Response<JsonObject> response
                            ) {

                                btnSubmit.setEnabled(
                                        true
                                );


                                if (
                                        response.isSuccessful()
                                                &&
                                                response.body() != null
                                ) {

                                    JsonObject data =
                                            response.body();


                                    String message =
                                            getMessage(
                                                    data
                                            );


                                    tvStatus.setText(
                                            message
                                    );


                                    // ====================================
                                    // KEMBALI KE LOGIN
                                    // ====================================

                                    registerMode =
                                            false;

                                    updateMode();

                                    etUsername.setText("");

                                    etPassword.setText("");


                                } else {

                                    tvStatus.setText(
                                            "Register gagal. HTTP "
                                                    + response.code()
                                    );
                                }
                            }


                            @Override
                            public void onFailure(
                                    Call<JsonObject> call,
                                    Throwable t
                            ) {

                                btnSubmit.setEnabled(
                                        true
                                );


                                tvStatus.setText(
                                        "Backend tidak dapat dihubungi: "
                                                + t.getMessage()
                                );
                            }
                        }
                );
    }


    // ==========================================
    // LOGIN
    // ==========================================

    private void login(
            String email,
            String password
    ) {

        if (
                email.isEmpty()
                        ||
                        password.isEmpty()
        ) {

            tvStatus.setText(
                    "Email dan password wajib diisi."
            );

            return;
        }


        btnSubmit.setEnabled(false);


        tvStatus.setText(
                "Memeriksa akun..."
        );


        // ========================================
        // REQUEST BODY
        // ========================================

        JsonObject body =
                new JsonObject();

        body.addProperty(
                "email",
                email
        );

        body.addProperty(
                "password",
                password
        );


        // ========================================
        // API LOGIN
        // ========================================

        apiService
                .login(body)
                .enqueue(
                        new Callback<JsonObject>() {

                            @Override
                            public void onResponse(
                                    Call<JsonObject> call,
                                    Response<JsonObject> response
                            ) {

                                btnSubmit.setEnabled(
                                        true
                                );


                                if (
                                        response.isSuccessful()
                                                &&
                                                response.body() != null
                                ) {

                                    JsonObject data =
                                            response.body();


                                    saveLoginData(
                                            data
                                    );


                                } else {

                                    tvStatus.setText(
                                            "Login gagal. HTTP "
                                                    + response.code()
                                    );
                                }
                            }


                            @Override
                            public void onFailure(
                                    Call<JsonObject> call,
                                    Throwable t
                            ) {

                                btnSubmit.setEnabled(
                                        true
                                );


                                tvStatus.setText(
                                        "Backend tidak dapat dihubungi: "
                                                + t.getMessage()
                                );
                            }
                        }
                );
    }


    // ==========================================
    // SAVE LOGIN DATA
    // ==========================================

    private void saveLoginData(
            JsonObject data
    ) {

        // ========================================
        // TOKEN
        // ========================================

        if (
                !data.has("token")
                        ||
                        data.get("token").isJsonNull()
        ) {

            tvStatus.setText(
                    "Login berhasil tetapi token tidak ditemukan."
            );

            return;
        }


        String token =
                data
                        .get("token")
                        .getAsString();


        SharedPreferences.Editor editor =
                preferences.edit();


        editor.putString(
                "token",
                token
        );


        // ========================================
        // USER
        // ========================================

        if (
                data.has("user")
                        &&
                        data.get("user").isJsonObject()
        ) {

            JsonObject user =
                    data.getAsJsonObject(
                            "user"
                    );


            if (
                    user.has("username")
                            &&
                            !user.get("username").isJsonNull()
            ) {

                editor.putString(
                        "username",
                        user
                                .get("username")
                                .getAsString()
                );
            }


            if (
                    user.has("email")
                            &&
                            !user.get("email").isJsonNull()
            ) {

                editor.putString(
                        "email",
                        user
                                .get("email")
                                .getAsString()
                );
            }


            if (
                    user.has("id")
                            &&
                            !user.get("id").isJsonNull()
            ) {

                editor.putInt(
                        "user_id",
                        user
                                .get("id")
                                .getAsInt()
                );
            }
        }


        editor.apply();


        // ========================================
        // STATUS
        // ========================================

        tvStatus.setText(
                "Login berhasil."
        );


        // ========================================
        // MASUK HOME
        // ========================================

        Intent intent =
                new Intent(
                        MainActivity.this,
                        HomeActivity.class
                );


        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        |
                        Intent.FLAG_ACTIVITY_CLEAR_TASK
        );


        startActivity(intent);


        finish();
    }


    // ==========================================
    // MESSAGE
    // ==========================================

    private String getMessage(
            JsonObject data
    ) {

        if (
                data.has("message")
                        &&
                        !data.get("message").isJsonNull()
        ) {

            return data
                    .get("message")
                    .getAsString();
        }


        return "Request berhasil.";
    }
}