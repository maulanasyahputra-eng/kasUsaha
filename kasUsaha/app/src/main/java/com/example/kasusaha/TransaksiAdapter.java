package com.example.kasusaha;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Locale;

public class TransaksiAdapter extends BaseAdapter {

    private Context context;
    private JSONArray data;

    // Menyimpan posisi asli data
    private ArrayList<Integer> posisiAsli;

    public TransaksiAdapter(
            Context context,
            JSONArray data
    ) {

        this.context = context;
        this.data = data;

        this.posisiAsli =
                new ArrayList<>();

        buatPosisiAsli();
    }

    // =====================================================
    // MEMBUAT URUTAN TERBARU → TERLAMA
    // =====================================================

    private void buatPosisiAsli() {

        posisiAsli.clear();

        for (
                int i = data.length() - 1;
                i >= 0;
                i--
        ) {

            posisiAsli.add(i);
        }
    }

    // =====================================================
    // JUMLAH DATA
    // =====================================================

    @Override
    public int getCount() {

        return data.length();
    }

    // =====================================================
    // MENGAMBIL DATA
    // =====================================================

    @Override
    public Object getItem(int position) {

        try {

            int indexAsli =
                    posisiAsli.get(position);

            return data.getJSONObject(
                    indexAsli
            );

        } catch (Exception e) {

            return null;
        }
    }

    // =====================================================
    // ID DATA
    // =====================================================

    @Override
    public long getItemId(int position) {

        return position;
    }

    // =====================================================
    // TAMPILKAN ITEM
    // =====================================================

    @Override
    public View getView(
            int position,
            View convertView,
            ViewGroup parent
    ) {

        if (convertView == null) {

            convertView =
                    LayoutInflater
                            .from(context)
                            .inflate(
                                    R.layout.item_transaksi,
                                    parent,
                                    false
                            );
        }

        // =================================================
        // HUBUNGKAN KOMPONEN
        // =================================================

        TextView tvJenis =
                convertView.findViewById(
                        R.id.tvJenis
                );

        TextView tvKategori =
                convertView.findViewById(
                        R.id.tvKategori
                );

        TextView tvKeterangan =
                convertView.findViewById(
                        R.id.tvKeterangan
                );

        TextView tvTanggal =
                convertView.findViewById(
                        R.id.tvTanggal
                );

        TextView tvNominal =
                convertView.findViewById(
                        R.id.tvNominal
                );

        Button btnHapus =
                convertView.findViewById(
                        R.id.btnHapus
                );

        try {

            // =================================================
            // POSISI ASLI DATA
            // =================================================

            int indexAsli =
                    posisiAsli.get(position);

            JSONObject transaksi =
                    data.getJSONObject(
                            indexAsli
                    );

            // =================================================
            // AMBIL DATA
            // =================================================

            String jenis =
                    transaksi.optString(
                            "jenis",
                            "-"
                    );

            String kategori =
                    transaksi.optString(
                            "kategori",
                            "-"
                    );

            String keterangan =
                    transaksi.optString(
                            "keterangan",
                            "-"
                    );

            String tanggal =
                    transaksi.optString(
                            "tanggal",
                            "-"
                    );

            double nominal =
                    transaksi.optDouble(
                            "nominal",
                            0
                    );

            // =================================================
            // FORMAT RUPIAH
            // =================================================

            NumberFormat formatRupiah =
                    NumberFormat.getCurrencyInstance(
                            new Locale(
                                    "id",
                                    "ID"
                            )
                    );

            // =================================================
            // TAMPILKAN DATA
            // =================================================

            tvJenis.setText(
                    jenis
            );

            tvKategori.setText(
                    "Kategori: " + kategori
            );

            tvKeterangan.setText(
                    keterangan
            );

            tvTanggal.setText(
                    "Tanggal: " + tanggal
            );

            // =================================================
            // WARNA DAN NOMINAL
            // =================================================

            if (
                    jenis.equals(
                            "Pemasukan"
                    )
            ) {

                tvNominal.setText(
                        "+ " +
                                formatRupiah.format(
                                        nominal
                                )
                );

                tvNominal.setTextColor(
                        Color.rgb(
                                22,
                                163,
                                74
                        )
                );

            } else {

                tvNominal.setText(
                        "- " +
                                formatRupiah.format(
                                        nominal
                                )
                );

                tvNominal.setTextColor(
                        Color.rgb(
                                220,
                                38,
                                38
                        )
                );
            }

            // =================================================
            // TOMBOL HAPUS
            // =================================================

            btnHapus.setOnClickListener(v -> {

                KeuanganHelper.hapusTransaksi(
                        context,
                        indexAsli
                );

                Toast.makeText(
                        context,
                        "Transaksi berhasil dihapus",
                        Toast.LENGTH_SHORT
                ).show();

                // Ambil data terbaru
                data =
                        KeuanganHelper
                                .getSemuaTransaksi(
                                        context
                                );

                // Buat ulang posisi
                buatPosisiAsli();

                // Refresh tampilan
                notifyDataSetChanged();
            });

        } catch (Exception e) {

            e.printStackTrace();
        }

        return convertView;
    }
}