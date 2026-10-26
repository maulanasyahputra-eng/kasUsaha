package com.example.kasusaha;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Calendar;

public class PemasukanActivity extends AppCompatActivity {

    EditText etNominal;
    EditText etKeterangan;
    EditText etTanggal;

    Spinner spKategori;

    Button btnSimpanPemasukan;
    Button btnKembali;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_pemasukan);

        // =========================
        // HUBUNGKAN KOMPONEN
        // =========================

        etNominal =
                findViewById(R.id.etNominal);

        etKeterangan =
                findViewById(R.id.etKeterangan);

        etTanggal =
                findViewById(R.id.etTanggal);

        spKategori =
                findViewById(R.id.spKategori);

        btnSimpanPemasukan =
                findViewById(R.id.btnSimpanPemasukan);

        btnKembali =
                findViewById(R.id.btnKembali);

        // =========================
        // DATA KATEGORI
        // =========================

        String[] kategori = {
                "Penjualan",
                "Modal",
                "Piutang",
                "Bonus",
                "Lainnya"
        };

        ArrayAdapter<String> adapter =
                new ArrayAdapter<>(
                        this,
                        android.R.layout.simple_spinner_item,
                        kategori
                );

        adapter.setDropDownViewResource(
                android.R.layout.simple_spinner_dropdown_item
        );

        spKategori.setAdapter(adapter);

        // =========================
        // PILIH TANGGAL
        // =========================

        etTanggal.setOnClickListener(v -> {

            Calendar kalender =
                    Calendar.getInstance();

            int tahun =
                    kalender.get(Calendar.YEAR);

            int bulan =
                    kalender.get(Calendar.MONTH);

            int hari =
                    kalender.get(Calendar.DAY_OF_MONTH);

            DatePickerDialog datePickerDialog =
                    new DatePickerDialog(
                            PemasukanActivity.this,
                            (view, year, month, dayOfMonth) -> {

                                String tanggal =
                                        String.format(
                                                "%02d/%02d/%04d",
                                                dayOfMonth,
                                                month + 1,
                                                year
                                        );

                                etTanggal.setText(
                                        tanggal
                                );

                            },
                            tahun,
                            bulan,
                            hari
                    );

            datePickerDialog.show();
        });

        // =========================
        // SIMPAN PEMASUKAN
        // =========================

        btnSimpanPemasukan.setOnClickListener(v -> {

            String nominalText =
                    etNominal.getText()
                            .toString()
                            .trim();

            String keterangan =
                    etKeterangan.getText()
                            .toString()
                            .trim();

            String tanggal =
                    etTanggal.getText()
                            .toString()
                            .trim();

            String kategoriDipilih =
                    spKategori
                            .getSelectedItem()
                            .toString();

            // =========================
            // VALIDASI NOMINAL
            // =========================

            if (nominalText.isEmpty()) {

                etNominal.setError(
                        "Nominal harus diisi"
                );

                etNominal.requestFocus();

                return;
            }

            double nominal;

            try {

                nominal =
                        Double.parseDouble(
                                nominalText
                        );

            } catch (NumberFormatException e) {

                etNominal.setError(
                        "Nominal tidak valid"
                );

                etNominal.requestFocus();

                return;
            }

            if (nominal <= 0) {

                etNominal.setError(
                        "Nominal harus lebih dari 0"
                );

                etNominal.requestFocus();

                return;
            }

            // =========================
            // VALIDASI KETERANGAN
            // =========================

            if (keterangan.isEmpty()) {

                etKeterangan.setError(
                        "Keterangan harus diisi"
                );

                etKeterangan.requestFocus();

                return;
            }

            // =========================
            // VALIDASI TANGGAL
            // =========================

            if (tanggal.isEmpty()) {

                Toast.makeText(
                        this,
                        "Silakan pilih tanggal",
                        Toast.LENGTH_SHORT
                ).show();

                return;
            }

            // =========================
            // SIMPAN DATA
            // =========================

            KeuanganHelper.tambahTransaksi(
                    this,
                    "Pemasukan",
                    nominal,
                    kategoriDipilih,
                    keterangan,
                    tanggal
            );

            // =========================
            // PESAN BERHASIL
            // =========================

            Toast.makeText(
                    this,
                    "Pemasukan berhasil disimpan",
                    Toast.LENGTH_SHORT
            ).show();

            // =========================
            // KEMBALI KE DASHBOARD
            // =========================

            finish();
        });

        // =========================
        // TOMBOL KEMBALI
        // =========================

        btnKembali.setOnClickListener(v -> {
            finish();
        });
    }
}