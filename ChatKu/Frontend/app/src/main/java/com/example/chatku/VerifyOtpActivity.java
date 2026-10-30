package com.example.chatku;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
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

public class VerifyOtpActivity
        extends AppCompatActivity {


    private EditText otpInput;

    private Button verifyButton;

    private ProgressBar progressBar;

    private TextView phoneText;

    private String phone;


    @Override
    protected void onCreate(
            Bundle savedInstanceState
    ) {

        super.onCreate(
                savedInstanceState
        );

        setContentView(
                R.layout.activity_verify_otp
        );


        otpInput =
                findViewById(
                        R.id.otpInput
                );

        verifyButton =
                findViewById(
                        R.id.verifyButton
                );

        progressBar =
                findViewById(
                        R.id.progressBar
                );

        phoneText =
                findViewById(
                        R.id.phoneText
                );


        phone =
                getIntent()
                        .getStringExtra(
                                "phone"
                        );


        if (phone == null) {

            Toast.makeText(
                    this,
                    "Nomor HP tidak ditemukan",
                    Toast.LENGTH_LONG
            ).show();

            finish();

            return;
        }


        phoneText.setText(
                "Kode OTP dikirim ke\n"
                        + phone
        );


        verifyButton.setOnClickListener(
                v -> verifyOtp()
        );
    }


    private void verifyOtp() {

        String otp =
                otpInput
                        .getText()
                        .toString()
                        .trim();


        if (otp.length() != 6) {

            otpInput.setError(
                    "OTP harus 6 digit"
            );

            otpInput.requestFocus();

            return;
        }


        setLoading(true);


        Map<String, String> body =
                new HashMap<>();

        body.put(
                "phone",
                phone
        );

        body.put(
                "otp",
                otp
        );


        ApiService api =
                ApiClient
                        .getClient()
                        .create(
                                ApiService.class
                        );


        api.verifyOtp(body)
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

                                    AuthResponse result =
                                            response.body();


                                    if (
                                            result.token == null
                                                    ||
                                                    result.token.isEmpty()
                                    ) {

                                        Toast.makeText(
                                                VerifyOtpActivity.this,
                                                "Token login tidak ditemukan",
                                                Toast.LENGTH_LONG
                                        ).show();

                                        return;
                                    }


                                    long userId = 0;

                                    String userPhone =
                                            phone;


                                    if (
                                            result.user != null
                                    ) {

                                        userId =
                                                result.user.id;

                                        if (
                                                result.user.phone != null
                                        ) {

                                            userPhone =
                                                    result.user.phone;
                                        }
                                    }


                                    SessionManager session =
                                            new SessionManager(
                                                    VerifyOtpActivity.this
                                            );


                                    session.saveSession(
                                            result.token,
                                            userId,
                                            userPhone
                                    );


                                    Toast.makeText(
                                            VerifyOtpActivity.this,
                                            "Login berhasil",
                                            Toast.LENGTH_SHORT
                                    ).show();


                                    Intent intent =
                                            new Intent(
                                                    VerifyOtpActivity.this,
                                                    MainActivity.class
                                            );


                                    intent.addFlags(
                                            Intent.FLAG_ACTIVITY_NEW_TASK
                                                    |
                                                    Intent.FLAG_ACTIVITY_CLEAR_TASK
                                    );


                                    startActivity(
                                            intent
                                    );


                                } else {

                                    String message =
                                            "OTP salah";

                                    if (
                                            response.body() != null
                                                    &&
                                                    response.body().message != null
                                    ) {

                                        message =
                                                response.body().message;
                                    }


                                    Toast.makeText(
                                            VerifyOtpActivity.this,
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
                                        VerifyOtpActivity.this,
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

        verifyButton
                .setEnabled(!loading);

        progressBar.setVisibility(
                loading
                        ? ProgressBar.VISIBLE
                        : ProgressBar.GONE
        );
    }
}