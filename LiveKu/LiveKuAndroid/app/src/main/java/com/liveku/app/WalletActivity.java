package com.liveku.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.JsonObject;
import com.liveku.app.network.ApiClient;
import com.liveku.app.network.ApiService;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WalletActivity extends AppCompatActivity {

    private TextView tvUsername;
    private TextView tvEmail;
    private TextView tvCoin;
    private TextView tvSaldo;
    private TextView tvStatus;

    private Button btnTopup;
    private Button btnLogout;
    private Button btnRefresh;
    private Button btnWithdraw;

    private ApiService apiService;
    private SharedPreferences preferences;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_wallet);

        // ========================================
        // VIEW
        // ========================================
        tvUsername = findViewById(R.id.tvUsername);
        tvEmail = findViewById(R.id.tvEmail);
        tvCoin = findViewById(R.id.tvCoin);
        tvSaldo = findViewById(R.id.tvSaldo);
        tvStatus = findViewById(R.id.tvStatus);

        btnTopup = findViewById(R.id.btnTopup);
        btnLogout = findViewById(R.id.btnLogout);
        btnRefresh = findViewById(R.id.btnRefresh);
        btnWithdraw = findViewById(R.id.btnWithdraw);

        // ========================================
        // API
        // ========================================
        apiService = ApiClient.getApiService();

        // ========================================
        // STORAGE
        // ========================================
        preferences = getSharedPreferences("LiveKu", MODE_PRIVATE);
        token = preferences.getString("token", null);

        // ========================================
        // CEK TOKEN
        // ========================================
        if (token == null || token.isEmpty()) {
            kembaliLogin();
            return;
        }

        // ========================================
        // DATA USER
        // ========================================
        String username = preferences.getString("username", "-");
        String email = preferences.getString("email", "-");

        tvUsername.setText(username);
        tvEmail.setText(email);

        // ========================================
        // LOAD WALLET
        // ========================================
        loadWallet();

        // ========================================
        // REFRESH
        // ========================================
        btnRefresh.setOnClickListener(v -> loadWallet());

        // ========================================
        // TOPUP (PINDAH KE DEPOSIT ACTIVITY)
        // ========================================
        btnTopup.setOnClickListener(v -> {
            Intent intent = new Intent(WalletActivity.this, DepositActivity.class);
            startActivity(intent);
        });

        // ========================================
        // WITHDRAW
        // ========================================
        btnWithdraw.setOnClickListener(v -> {
            Intent intent = new Intent(WalletActivity.this, WithdrawActivity.class);
            startActivity(intent);
        });

        // ========================================
        // LOGOUT
        // ========================================
        btnLogout.setOnClickListener(v -> logout());
    }

    // ==========================================
    // LOAD WALLET
    // ==========================================
    private void loadWallet() {
        setStatus("Mengambil data wallet...");

        apiService.getWallet("Bearer " + token).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject data = response.body();
                    tampilkanWallet(data);
                    setStatus("Wallet berhasil dimuat");
                } else {
                    if (response.code() == 401) {
                        Toast.makeText(WalletActivity.this, "Session login sudah tidak berlaku", Toast.LENGTH_LONG).show();
                        logout();
                    } else {
                        setStatus("Gagal mengambil wallet. HTTP " + response.code());
                    }
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                setStatus("Backend tidak dapat dihubungi: " + t.getMessage());
            }
        });
    }

    // ==========================================
    // TAMPILKAN WALLET
    // ==========================================
    private void tampilkanWallet(JsonObject data) {
        if (!data.has("wallet") || !data.get("wallet").isJsonObject()) {
            setStatus("Data wallet tidak ditemukan");
            return;
        }

        JsonObject wallet = data.getAsJsonObject("wallet");

        // COIN
        if (wallet.has("coin_balance") && !wallet.get("coin_balance").isJsonNull()) {
            String coin = wallet.get("coin_balance").getAsString();
            tvCoin.setText(formatNumber(coin) + " Coin");
        } else {
            tvCoin.setText("0 Coin");
        }

        // SALDO
        if (wallet.has("cash_balance") && !wallet.get("cash_balance").isJsonNull()) {
            String saldo = wallet.get("cash_balance").getAsString();
            tvSaldo.setText("Rp " + formatNumber(saldo));
        } else {
            tvSaldo.setText("Rp 0");
        }
    }

    // ==========================================
    // LOGOUT
    // ==========================================
    private void logout() {
        preferences.edit().clear().apply();
        token = null;
        kembaliLogin();
    }

    // ==========================================
    // KEMBALI LOGIN
    // ==========================================
    private void kembaliLogin() {
        Intent intent = new Intent(WalletActivity.this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    // ==========================================
    // STATUS
    // ==========================================
    private void setStatus(String message) {
        if (tvStatus != null) {
            tvStatus.setText(message);
        }
    }

    // ==========================================
    // FORMAT NUMBER
    // ==========================================
    private String formatNumber(String value) {
        try {
            long number = Long.parseLong(value);
            return String.format(java.util.Locale.US, "%,d", number).replace(",", ".");
        } catch (Exception e) {
            return value;
        }
    }
}