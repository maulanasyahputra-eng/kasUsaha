package com.example.kasusaha;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    TextView tvSaldo;
    TextView tvPemasukan;
    TextView tvPengeluaran;
    TextView tvStatusSaldo;

    Button btnPemasukan;
    Button btnPengeluaran;
    Button btnRiwayat;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);

        // =========================
        // HUBUNGKAN KOMPONEN XML
        // =========================

        tvSaldo =
                findViewById(R.id.tvSaldo);

        tvPemasukan =
                findViewById(R.id.tvPemasukan);

        tvPengeluaran =
                findViewById(R.id.tvPengeluaran);

        btnPemasukan =
                findViewById(R.id.btnPemasukan);

        btnPengeluaran =
                findViewById(R.id.btnPengeluaran);

        btnRiwayat =
                findViewById(R.id.btnRiwayat);

        // =========================
        // TOMBOL PEMASUKAN
        // =========================

        btnPemasukan.setOnClickListener(v -> {

            Intent intent =
                    new Intent(
                            MainActivity.this,
                            PemasukanActivity.class
                    );

            startActivity(intent);

        });

        // =========================
        // TOMBOL PENGELUARAN
        // =========================

        btnPengeluaran.setOnClickListener(v -> {

            Intent intent =
                    new Intent(
                            MainActivity.this,
                            PengeluaranActivity.class
                    );

            startActivity(intent);

        });

        // =========================
        // TOMBOL RIWAYAT
        // =========================

        btnRiwayat.setOnClickListener(v -> {

            Intent intent =
                    new Intent(
                            MainActivity.this,
                            RiwayatActivity.class
                    );

            startActivity(intent);

        });

        // Tampilkan data
        tampilkanDataKeuangan();
    }

    // =====================================================
    // AGAR DATA DASHBOARD SELALU DIPERBARUI
    // =====================================================

    @Override
    protected void onResume() {
        super.onResume();

        tampilkanDataKeuangan();
    }

    // =====================================================
    // MENAMPILKAN DATA KE DASHBOARD
    // =====================================================

    private void tampilkanDataKeuangan() {

        double pemasukan =
                KeuanganHelper.getTotalPemasukan(
                        this
                );

        double pengeluaran =
                KeuanganHelper.getTotalPengeluaran(
                        this
                );

        double saldo =
                KeuanganHelper.getSaldo(
                        this
                );

        tvPemasukan.setText(
                KeuanganHelper.formatRupiah(
                        pemasukan
                )
        );

        tvPengeluaran.setText(
                KeuanganHelper.formatRupiah(
                        pengeluaran
                )
        );

        tvSaldo.setText(
                KeuanganHelper.formatRupiah(
                        saldo
                )
        );
    }
}