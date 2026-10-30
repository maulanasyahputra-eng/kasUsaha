package com.liveku.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class ProfileActivity extends AppCompatActivity {

    private TextView tvUsername, tvEmail, tvCoin, tvSaldo;
    private Button btnWallet, btnLogout, btnBack;

    private SharedPreferences preferences;
    private SharedPreferences.OnSharedPreferenceChangeListener preferenceChangeListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        // ==========================================
        // 1. INISIALISASI VIEW UTAMA
        // ==========================================
        tvUsername = findViewById(R.id.tvUsername);
        tvEmail = findViewById(R.id.tvEmail);
        tvCoin = findViewById(R.id.tvCoin);
        tvSaldo = findViewById(R.id.tvSaldo);

        btnWallet = findViewById(R.id.btnWallet);
        btnLogout = findViewById(R.id.btnLogout);
        btnBack = findViewById(R.id.btnBack);

        // ==========================================
        // 2. STORAGE & REAL-TIME LISTENER
        // ==========================================
        preferences = getSharedPreferences("LiveKu", MODE_PRIVATE);

        preferenceChangeListener = (sharedPreferences, key) -> {
            // Mendengarkan perubahan pada berbagai kemungkinan nama kunci data
            loadProfile();
        };

        preferences.registerOnSharedPreferenceChangeListener(preferenceChangeListener);

        // Muat profil saat pertama kali dibuka
        loadProfile();

        // ==========================================
        // 3. AKSI TOMBOL & NAVIGASI
        // ==========================================

        // Tombol Dompet / Top Up
        btnWallet.setOnClickListener(v -> {
            Intent intent = new Intent(ProfileActivity.this, WalletActivity.class);
            startActivity(intent);
        });

        // Tombol Logout / Keluar Akun
        btnLogout.setOnClickListener(v -> {
            preferences.edit().clear().apply();

            Toast.makeText(ProfileActivity.this, "Berhasil logout", Toast.LENGTH_SHORT).show();

            Intent intent = new Intent(ProfileActivity.this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });

        // Tombol Kembali (‹)
        btnBack.setOnClickListener(v -> finish());
    }

    // ==========================================
    // LOAD PROFILE DATA (FLEKSIBEL TERHADAP KEY)
    // ==========================================
    private void loadProfile() {
        String username = preferences.getString("username", "Pengguna LiveKu");
        String email = preferences.getString("email", "email@example.com");

        // Mendukung berbagai macam kemungkinan key SharedPreferences dari backend/login Anda
        int coin = preferences.contains("coin_balance") ? preferences.getInt("coin_balance", 0) :
                preferences.contains("coin") ? preferences.getInt("coin", 0) : 0;

        long saldo = preferences.contains("cash_balance") ? preferences.getLong("cash_balance", 0) :
                preferences.contains("balance") ? preferences.getLong("balance", 0) :
                preferences.contains("saldo") ? preferences.getLong("saldo", 0) : 0;

        tvUsername.setText(username);
        tvEmail.setText(email);
        tvCoin.setText(formatNumber(coin) + " Koin");
        tvSaldo.setText("Rp " + formatNumber(saldo));
    }

    // ==========================================
    // FORMAT NUMBER (Pemisah Titik Ribuan)
    // ==========================================
    private String formatNumber(long number) {
        return String.format(
                java.util.Locale.US,
                "%,d",
                number
        ).replace(",", ".");
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadProfile(); // Memastikan data tetap sinkron saat kembali ke halaman ini
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (preferences != null && preferenceChangeListener != null) {
            preferences.unregisterOnSharedPreferenceChangeListener(preferenceChangeListener);
        }
    }
}