package com.liveku.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.JsonObject;
import com.liveku.app.network.ApiClient;
import com.liveku.app.network.ApiService;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WithdrawActivity extends AppCompatActivity {

    private EditText etWithdrawAmount, etBank, etRekening, etNama;
    private Button btnSubmitWithdraw;
    private ApiService apiService;
    private SharedPreferences preferences;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_withdraw);

        etWithdrawAmount = findViewById(R.id.etWithdrawAmount);
        etBank = findViewById(R.id.etBank);
        etRekening = findViewById(R.id.etRekening);
        etNama = findViewById(R.id.etNama);
        btnSubmitWithdraw = findViewById(R.id.btnSubmitWithdraw);

        apiService = ApiClient.getApiService();

        preferences = getSharedPreferences("LiveKu", MODE_PRIVATE);
        token = preferences.getString("token", null);

        btnSubmitWithdraw.setOnClickListener(v -> {
            String amountStr = etWithdrawAmount.getText().toString().trim();
            String bank = etBank.getText().toString().trim();
            String rekening = etRekening.getText().toString().trim();
            String nama = etNama.getText().toString().trim();

            if (amountStr.isEmpty() || bank.isEmpty() || rekening.isEmpty() || nama.isEmpty()) {
                Toast.makeText(WithdrawActivity.this, "Semua kolom harus diisi!", Toast.LENGTH_SHORT).show();
                return;
            }

            int amount = Integer.parseInt(amountStr);

            // Validasi minimal withdraw sesuai backend (Rp 50.000)
            if (amount < 50000) {
                Toast.makeText(WithdrawActivity.this, "Minimal withdraw Rp 50.000", Toast.LENGTH_SHORT).show();
                return;
            }

            btnSubmitWithdraw.setEnabled(false);
            Toast.makeText(WithdrawActivity.this, "Mengirim permintaan...", Toast.LENGTH_SHORT).show();

            // Sesuai persis dengan req.body di backend Node.js
            JsonObject body = new JsonObject();
            body.addProperty("amount", amount);
            body.addProperty("bank_name", bank);          // Sesuai backend
            body.addProperty("account_number", rekening); // Sesuai backend
            body.addProperty("account_name", nama);       // Sesuai backend

            apiService.createWithdraw("Bearer " + token, body).enqueue(new Callback<JsonObject>() {
                @Override
                public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                    btnSubmitWithdraw.setEnabled(true);
                    if (response.isSuccessful()) {
                        Toast.makeText(WithdrawActivity.this, "Withdraw berhasil diajukan!", Toast.LENGTH_LONG).show();
                        finish();
                    } else {
                        try {
                            String errorMsg = response.errorBody() != null ? response.errorBody().string() : "Gagal (HTTP " + response.code() + ")";
                            Toast.makeText(WithdrawActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                        } catch (Exception e) {
                            Toast.makeText(WithdrawActivity.this, "Gagal mengajukan withdraw (HTTP " + response.code() + ")", Toast.LENGTH_LONG).show();
                        }
                    }
                }

                @Override
                public void onFailure(Call<JsonObject> call, Throwable t) {
                    btnSubmitWithdraw.setEnabled(true);
                    Toast.makeText(WithdrawActivity.this, "Koneksi gagal: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        });
    }
}