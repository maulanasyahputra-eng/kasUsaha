package com.example.kasusaha;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;

public class RiwayatActivity extends AppCompatActivity {

    // =========================
    // KOMPONEN
    // =========================

    TextView tvTotalPemasukan;
    TextView tvTotalPengeluaran;
    TextView tvSaldoRiwayat;
    TextView tvTidakAdaData;

    ListView listRiwayat;

    Button btnKembali;

    // Layout data kosong
    View layoutDataKosong;

    // =========================
    // ADAPTER & DATA
    // =========================

    TransaksiAdapter adapter;
    JSONArray dataTransaksi;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_riwayat);

        // =========================
        // TEXTVIEW
        // =========================

        tvTotalPemasukan =
                findViewById(R.id.tvTotalPemasukan);

        tvTotalPengeluaran =
                findViewById(R.id.tvTotalPengeluaran);

        tvSaldoRiwayat =
                findViewById(R.id.tvSaldoRiwayat);

        tvTidakAdaData =
                findViewById(R.id.tvTidakAdaData);

        // =========================
        // LAYOUT DATA KOSONG
        // =========================

        layoutDataKosong =
                findViewById(R.id.layoutDataKosong);

        // =========================
        // LIST TRANSAKSI
        // =========================

        listRiwayat =
                findViewById(R.id.listRiwayat);

        // =========================
        // TOMBOL KEMBALI
        // =========================

        btnKembali =
                findViewById(R.id.btnKembali);

        btnKembali.setOnClickListener(v -> {
            finish();
        });

        // =========================
        // TAMPILKAN DATA
        // =========================

        tampilkanData();
    }

    // =====================================================
    // REFRESH SAAT HALAMAN KEMBALI AKTIF
    // =====================================================

    @Override
    protected void onResume() {

        super.onResume();

        tampilkanData();
    }

    // =====================================================
    // MENAMPILKAN DATA
    // =====================================================

    private void tampilkanData() {

        // =========================
        // TOTAL PEMASUKAN
        // =========================

        double pemasukan =
                KeuanganHelper.getTotalPemasukan(this);

        // =========================
        // TOTAL PENGELUARAN
        // =========================

        double pengeluaran =
                KeuanganHelper.getTotalPengeluaran(this);

        // =========================
        // SALDO
        // =========================

        double saldo =
                KeuanganHelper.getSaldo(this);

        // =========================
        // TAMPILKAN TOTAL
        // =========================

        tvTotalPemasukan.setText(
                KeuanganHelper.formatRupiah(pemasukan)
        );

        tvTotalPengeluaran.setText(
                KeuanganHelper.formatRupiah(pengeluaran)
        );

        tvSaldoRiwayat.setText(
                KeuanganHelper.formatRupiah(saldo)
        );

        // =========================
        // AMBIL TRANSAKSI
        // =========================

        dataTransaksi =
                KeuanganHelper.getSemuaTransaksi(this);

        // =================================================
        // TIDAK ADA TRANSAKSI
        // =================================================

        if (dataTransaksi == null ||
                dataTransaksi.length() == 0) {

            // Tampilkan bagian:
            //
            // 📋
            // Belum ada transaksi
            // Tambahkan pemasukan atau pengeluaran

            layoutDataKosong.setVisibility(
                    View.VISIBLE
            );

            // Sembunyikan list transaksi
            listRiwayat.setVisibility(
                    View.GONE
            );

            return;
        }

        // =================================================
        // ADA TRANSAKSI
        // =================================================

        // Hilangkan SELURUH bagian data kosong
        layoutDataKosong.setVisibility(
                View.GONE
        );

        // Tampilkan list transaksi
        listRiwayat.setVisibility(
                View.VISIBLE
        );

        // =========================
        // BUAT ADAPTER
        // =========================

        adapter =
                new TransaksiAdapter(
                        this,
                        dataTransaksi
                );

        // =========================
        // PASANG ADAPTER
        // =========================

        listRiwayat.setAdapter(adapter);

        // =========================
        // REFRESH
        // =========================

        adapter.notifyDataSetChanged();
    }
}