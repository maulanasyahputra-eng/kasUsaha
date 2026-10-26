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

public class PengeluaranActivity extends AppCompatActivity {

    private EditText etNominal;
    private EditText etKeterangan;
    private EditText etTanggal;

    private Spinner spKategori;

    private Button btnSimpanPengeluaran;
    private Button btnKembali;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_pengeluaran);

        // =========================
        // HUBUNGKAN KOMPONEN
        // =========================

        etNominal = findViewById(R.id.etNominal);
        etKeterangan = findViewById(R.id.etKeterangan);
        etTanggal = findViewById(R.id.etTanggal);

        spKategori = findViewById(R.id.spKategori);

        btnSimpanPengeluaran =
                findViewById(R.id.btnSimpanPengeluaran);

        btnKembali =
                findViewById(R.id.btnKembali);

        // =========================
        // KATEGORI
        // =========================

        String[] kategori = {
                "Bahan Baku",
                "Transportasi",
                "Operasional",
                "Gaji",
                "Listrik",
                "Sewa",
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
        // TOMBOL KEMBALI
        // =========================

        btnKembali.setOnClickListener(v -> {
            finish();
        });

        // =========================
        // TANGGAL
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

            DatePickerDialog dialog =
                    new DatePickerDialog(
                            PengeluaranActivity.this,
                            (view, year, month, day) -> {

                                String tanggal =
                                        String.format(
                                                "%02d/%02d/%04d",
                                                day,
                                                month + 1,
                                                year
                                        );

                                etTanggal.setText(tanggal);
                            },
                            tahun,
                            bulan,
                            hari
                    );

            dialog.show();
        });

        // =========================
        // SIMPAN
        // =========================

        btnSimpanPengeluaran.setOnClickListener(v -> {

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
                    spKategori.getSelectedItem()
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
            // CEK SALDO
            // =========================

            double saldo =
                    KeuanganHelper.getSaldo(this);

            if (nominal > saldo) {

                Toast.makeText(
                        this,
                        "Saldo tidak mencukupi",
                        Toast.LENGTH_LONG
                ).show();

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
            // SIMPAN TRANSAKSI
            // =========================

            KeuanganHelper.tambahTransaksi(
                    this,
                    "Pengeluaran",
                    nominal,
                    kategoriDipilih,
                    keterangan,
                    tanggal
            );

            Toast.makeText(
                    this,
                    "Pengeluaran berhasil disimpan",
                    Toast.LENGTH_SHORT
            ).show();

            // =========================
            // KEMBALI
            // =========================

            finish();
        });

        // =========================
        // BACK HP
        // =========================

        getOnBackPressedDispatcher()
                .addCallback(
                        this,
                        new androidx.activity.OnBackPressedCallback(true) {

                            @Override
                            public void handleOnBackPressed() {
                                finish();
                            }
                        }
                );
    }
}