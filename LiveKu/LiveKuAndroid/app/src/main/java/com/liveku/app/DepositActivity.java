package com.liveku.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.card.MaterialCardView;
import com.google.gson.JsonObject;
import com.liveku.app.network.ApiClient;
import com.liveku.app.network.ApiService;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DepositActivity extends AppCompatActivity {

    private EditText etAmount;

    private Button btnDeposit;
    private Button btnBack;

    private TextView tvStatus;

    // Deklarasi CardView Pilihan Cepat
    private MaterialCardView card100, card500, card1000, card5000;

    // Variabel untuk menyimpan nominal cepat yang dipilih
    private double selectedAmount = 0;

    private SharedPreferences preferences;

    private ApiService apiService;

    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_deposit);

        // =====================================
        // STORAGE
        // =====================================

        preferences =
                getSharedPreferences(
                        "LiveKu",
                        MODE_PRIVATE
                );

        token =
                preferences.getString(
                        "token",
                        null
                );

        // =====================================
        // CEK TOKEN
        // =====================================

        if (
                token == null ||
                        token.trim().isEmpty()
        ) {

            finish();

            return;
        }

        // =====================================
        // VIEW
        // =====================================

        etAmount =
                findViewById(
                        R.id.etAmount
                );

        btnDeposit =
                findViewById(
                        R.id.btnDeposit
                );

        btnBack =
                findViewById(
                        R.id.btnBack
                );

        tvStatus =
                findViewById(
                        R.id.tvStatus
                );

        // Inisialisasi CardView Pilihan Cepat dari XML
        card100 = findViewById(R.id.cardCoin100);
        card500 = findViewById(R.id.cardCoin500);
        card1000 = findViewById(R.id.cardCoin1000);
        card5000 = findViewById(R.id.cardCoin5000);

        // =====================================
        // PILIHAN NOMINAL CEPAT (INTERAKTIF)
        // =====================================

        if (card100 != null) card100.setOnClickListener(v -> selectCard(card100, 10000));
        if (card500 != null) card500.setOnClickListener(v -> selectCard(card500, 50000));
        if (card1000 != null) card1000.setOnClickListener(v -> selectCard(card1000, 100000));
        if (card5000 != null) card5000.setOnClickListener(v -> selectCard(card5000, 500000));

        // Jika user mengetik manual di EditText, reset pilihan kartu cepat
        etAmount.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                clearCardSelection();
            }
        });

        etAmount.setOnClickListener(v -> clearCardSelection());

        // =====================================
        // API
        // =====================================

        apiService =
                ApiClient.getApiService();

        // =====================================
        // BUTTON
        // =====================================

        btnDeposit.setOnClickListener(
                v -> createDeposit()
        );

        btnBack.setOnClickListener(
                v -> finish()
        );
    }

    // =========================================
    // PILIHAN KARTU CEPAT (EFEK AKTIF)
    // =========================================

    private void selectCard(MaterialCardView selectedCard, double amount) {
        clearCardSelection();

        // Efek visual saat kartu dipilih (background agak terang & border warna pink/magenta)
        selectedCard.setCardBackgroundColor(Color.parseColor("#252538"));
        selectedCard.setStrokeColor(Color.parseColor("#FF2A85"));
        selectedCard.setStrokeWidth(4);

        selectedAmount = amount;
        etAmount.setText(String.valueOf((int) amount));
        tvStatus.setText("Dipilih: Rp" + (int) amount);
    }

    private void clearCardSelection() {
        selectedAmount = 0;

        MaterialCardView[] cards = {card100, card500, card1000, card5000};
        for (MaterialCardView card : cards) {
            if (card != null) {
                card.setCardBackgroundColor(Color.parseColor("#1A1A26"));
                card.setStrokeColor(Color.parseColor("#2A2A3D"));
                card.setStrokeWidth(2);
            }
        }
    }

    // =========================================
    // CREATE DEPOSIT
    // =========================================

    private void createDeposit() {

        double finalAmount = 0;
        String amountText =
                etAmount
                        .getText()
                        .toString()
                        .trim();

        // Cek apakah mengambil dari pilihan cepat atau ketik manual
        if (selectedAmount > 0) {
            finalAmount = selectedAmount;
        } else if (!amountText.isEmpty()) {
            try {
                finalAmount = Double.parseDouble(amountText);
            } catch (Exception e) {
                finalAmount = 0;
            }
        }

        if (finalAmount <= 0) {

            tvStatus.setText(
                    "Masukkan nominal deposit."
            );

            return;
        }

        long amount = (long) finalAmount;

        // =====================================
        // MINIMUM
        // =====================================

        if (amount < 10000) {

            tvStatus.setText(
                    "Minimal deposit Rp10.000."
            );

            return;
        }

        // =====================================
        // BUTTON LOADING
        // =====================================

        btnDeposit.setEnabled(false);

        btnDeposit.setText(
                "Memproses..."
        );

        tvStatus.setText(
                "Membuat pembayaran..."
        );

        // =====================================
        // REQUEST
        // =====================================

        JsonObject body =
                new JsonObject();

        body.addProperty(
                "amount",
                amount
        );

        apiService
                .createPayment(
                        "Bearer " + token,
                        body
                )
                .enqueue(
                        new Callback<JsonObject>() {

                            @Override
                            public void onResponse(
                                    Call<JsonObject> call,
                                    Response<JsonObject> response
                            ) {

                                btnDeposit.setEnabled(
                                        true
                                );

                                btnDeposit.setText(
                                        "Bayar Sekarang"
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

                                    Toast.makeText(
                                            DepositActivity.this,
                                            message,
                                            Toast.LENGTH_LONG
                                    ).show();

                                    // =================================
                                    // TAMPILKAN HASIL PAYMENT (BISA URL / REDIRECT)
                                    // =================================

                                    if (
                                            data.has(
                                                    "payment_url"
                                            )
                                    ) {

                                        String paymentUrl =
                                                data.get(
                                                        "payment_url"
                                                ).getAsString();

                                        showPaymentUrl(
                                                paymentUrl
                                        );
                                    } else if (data.has("payment")) {
                                        // Menyesuaikan jika response JSON membungkus objek payment (seperti redirect_url dari midtrans snap)
                                        JsonObject paymentObj = data.getAsJsonObject("payment");
                                        if (paymentObj.has("redirect_url")) {
                                            String redirectUrl = paymentObj.get("redirect_url").getAsString();
                                            showPaymentUrl(redirectUrl);
                                        }
                                    }

                                } else {

                                    tvStatus.setText(
                                            "Deposit gagal. HTTP "
                                                    + response.code()
                                    );
                                }
                            }

                            @Override
                            public void onFailure(
                                    Call<JsonObject> call,
                                    Throwable t
                            ) {

                                btnDeposit.setEnabled(
                                        true
                                );

                                btnDeposit.setText(
                                        "Bayar Sekarang"
                                );

                                tvStatus.setText(
                                        "Tidak dapat terhubung ke backend."
                                );

                                Toast.makeText(
                                        DepositActivity.this,
                                        t.getMessage(),
                                        Toast.LENGTH_LONG
                                ).show();
                            }
                        }
                );
    }

    // =========================================
    // PAYMENT URL
    // =========================================

    private void showPaymentUrl(
            String url
    ) {

        if (
                url == null ||
                        url.trim().isEmpty()
        ) {

            return;
        }

        tvStatus.setText(
                "Pembayaran berhasil dibuat."
        );

        Toast.makeText(
                DepositActivity.this,
                "Membuka halaman pembayaran...",
                Toast.LENGTH_LONG
        ).show();

        // Otomatis membuka halaman pembayaran Midtrans Snap di Browser / WebView HP
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        startActivity(browserIntent);
    }

    // =========================================
    // MESSAGE
    // =========================================

    private String getMessage(
            JsonObject data
    ) {

        if (
                data.has("message")
                        &&
                        !data
                                .get("message")
                                .isJsonNull()
        ) {

            return data
                    .get("message")
                    .getAsString();
        }

        return "Pembayaran berhasil dibuat.";
    }
}