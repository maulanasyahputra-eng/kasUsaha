package com.example.chatku;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.chatku.model.AuthResponse;
import com.example.chatku.network.ApiClient;
import com.example.chatku.network.ApiService;
import com.example.chatku.utils.SessionManager;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity
        extends AppCompatActivity {


    private EditText phoneInput;

    private Button sendOtpButton;

    private ProgressBar progressBar;


    @Override
    protected void onCreate(
            Bundle savedInstanceState
    ) {

        super.onCreate(
                savedInstanceState
        );

        setContentView(
                R.layout.activity_login
        );


        SessionManager session =
                new SessionManager(this);


        /*
         * Kalau sudah login,
         * langsung ke Home.
         */

        if (session.isLoggedIn()) {

            startActivity(
                    new Intent(
                            LoginActivity.this,
                            MainActivity.class
                    )
            );

            finish();

            return;
        }


        phoneInput =
                findViewById(
                        R.id.phoneInput
                );

        sendOtpButton =
                findViewById(
                        R.id.sendOtpButton
                );

        progressBar =
                findViewById(
                        R.id.progressBar
                );


        sendOtpButton.setOnClickListener(
                v -> sendOtp()
        );
    }


    private void sendOtp() {

        String phone =
                phoneInput
                        .getText()
                        .toString()
                        .trim();


        if (phone.isEmpty()) {

            phoneInput.setError(
                    "Nomor HP wajib diisi"
            );

            phoneInput.requestFocus();

            return;
        }


        if (phone.length() < 10) {

            phoneInput.setError(
                    "Nomor HP tidak valid"
            );

            phoneInput.requestFocus();

            return;
        }


        setLoading(true);


        Map<String, String> body =
                new HashMap<>();

        body.put(
                "phone",
                phone
        );


        ApiService api =
                ApiClient
                        .getClient()
                        .create(
                                ApiService.class
                        );


        api.sendOtp(body)
                .enqueue(
                        new Callback<AuthResponse>() {

                            @Override
                            public void onResponse(
                                    Call<AuthResponse> call,
                                    Response<AuthResponse> response
                            ) {

                                setLoading(false);


                                if (
                                        response.isSuccessful()
                                                &&
                                                response.body() != null
                                                &&
                                                response.body().success
                                ) {

                                    Toast.makeText(
                                            LoginActivity.this,
                                            "Kode OTP berhasil dikirim",
                                            Toast.LENGTH_SHORT
                                    ).show();


                                    Intent intent =
                                            new Intent(
                                                    LoginActivity.this,
                                                    VerifyOtpActivity.class
                                            );


                                    intent.putExtra(
                                            "phone",
                                            phone
                                    );


                                    startActivity(
                                            intent
                                    );

                                } else {

                                    String message =
                                            "Gagal mengirim OTP";

                                    if (
                                            response.body() != null
                                                    &&
                                                    response.body().message != null
                                    ) {

                                        message =
                                                response.body().message;
                                    }


                                    Toast.makeText(
                                            LoginActivity.this,
                                            message,
                                            Toast.LENGTH_LONG
                                    ).show();
                                }
                            }


                            @Override
                            public void onFailure(
                                    Call<AuthResponse> call,
                                    Throwable t
                            ) {

                                setLoading(false);


                                Toast.makeText(
                                        LoginActivity.this,
                                        "Tidak dapat terhubung ke server: "
                                                + t.getMessage(),
                                        Toast.LENGTH_LONG
                                ).show();
                            }
                        }
                );
    }


    private void setLoading(
            boolean loading
    ) {

        sendOtpButton
                .setEnabled(!loading);

        progressBar.setVisibility(
                loading
                        ? ProgressBar.VISIBLE
                        : ProgressBar.GONE
        );
    }
}