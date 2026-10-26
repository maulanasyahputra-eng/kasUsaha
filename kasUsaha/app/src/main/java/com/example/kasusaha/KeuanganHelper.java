package com.example.kasusaha;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.NumberFormat;
import java.util.Locale;

public class KeuanganHelper {

    private static final String PREF_NAME = "KasUsahaData";
    private static final String KEY_TRANSAKSI = "transaksi";

    // =====================================================
    // TAMBAH TRANSAKSI
    // =====================================================

    public static void tambahTransaksi(
            Context context,
            String jenis,
            double nominal,
            String kategori,
            String keterangan,
            String tanggal
    ) {

        SharedPreferences preferences =
                context.getSharedPreferences(
                        PREF_NAME,
                        Context.MODE_PRIVATE
                );

        String dataLama =
                preferences.getString(
                        KEY_TRANSAKSI,
                        "[]"
                );

        try {

            JSONArray array =
                    new JSONArray(dataLama);

            JSONObject transaksi =
                    new JSONObject();

            transaksi.put(
                    "jenis",
                    jenis
            );

            transaksi.put(
                    "nominal",
                    nominal
            );

            transaksi.put(
                    "kategori",
                    kategori
            );

            transaksi.put(
                    "keterangan",
                    keterangan
            );

            transaksi.put(
                    "tanggal",
                    tanggal
            );

            array.put(transaksi);

            preferences.edit()
                    .putString(
                            KEY_TRANSAKSI,
                            array.toString()
                    )
                    .apply();

        } catch (JSONException e) {

            e.printStackTrace();
        }
    }

    // =====================================================
    // AMBIL SEMUA TRANSAKSI
    // =====================================================

    public static JSONArray getSemuaTransaksi(
            Context context
    ) {

        SharedPreferences preferences =
                context.getSharedPreferences(
                        PREF_NAME,
                        Context.MODE_PRIVATE
                );

        String data =
                preferences.getString(
                        KEY_TRANSAKSI,
                        "[]"
                );

        try {

            return new JSONArray(data);

        } catch (JSONException e) {

            e.printStackTrace();

            return new JSONArray();
        }
    }

    // =====================================================
    // TOTAL PEMASUKAN
    // =====================================================

    public static double getTotalPemasukan(
            Context context
    ) {

        JSONArray transaksi =
                getSemuaTransaksi(context);

        double total = 0;

        for (
                int i = 0;
                i < transaksi.length();
                i++
        ) {

            try {

                JSONObject data =
                        transaksi.getJSONObject(i);

                if (
                        data.getString("jenis")
                                .equals("Pemasukan")
                ) {

                    total +=
                            data.getDouble("nominal");
                }

            } catch (JSONException e) {

                e.printStackTrace();
            }
        }

        return total;
    }

    // =====================================================
    // TOTAL PENGELUARAN
    // =====================================================

    public static double getTotalPengeluaran(
            Context context
    ) {

        JSONArray transaksi =
                getSemuaTransaksi(context);

        double total = 0;

        for (
                int i = 0;
                i < transaksi.length();
                i++
        ) {

            try {

                JSONObject data =
                        transaksi.getJSONObject(i);

                if (
                        data.getString("jenis")
                                .equals("Pengeluaran")
                ) {

                    total +=
                            data.getDouble("nominal");
                }

            } catch (JSONException e) {

                e.printStackTrace();
            }
        }

        return total;
    }

    // =====================================================
    // SALDO
    // =====================================================

    public static double getSaldo(
            Context context
    ) {

        double pemasukan =
                getTotalPemasukan(context);

        double pengeluaran =
                getTotalPengeluaran(context);

        return pemasukan - pengeluaran;
    }

    // =====================================================
    // KEUNTUNGAN
    // =====================================================

    public static double getKeuntungan(
            Context context
    ) {

        return getSaldo(context);
    }

    // =====================================================
    // FORMAT RUPIAH
    // =====================================================

    public static String formatRupiah(
            double nominal
    ) {

        NumberFormat format =
                NumberFormat.getCurrencyInstance(
                        new Locale("id", "ID")
                );

        return format.format(nominal);
    }

    // =====================================================
    // HAPUS TRANSAKSI
    // =====================================================

    public static void hapusTransaksi(
            Context context,
            int posisi
    ) {

        SharedPreferences preferences =
                context.getSharedPreferences(
                        PREF_NAME,
                        Context.MODE_PRIVATE
                );

        String data =
                preferences.getString(
                        KEY_TRANSAKSI,
                        "[]"
                );

        try {

            JSONArray array =
                    new JSONArray(data);

            if (
                    posisi >= 0 &&
                            posisi < array.length()
            ) {

                array.remove(posisi);

                preferences.edit()
                        .putString(
                                KEY_TRANSAKSI,
                                array.toString()
                        )
                        .apply();
            }

        } catch (JSONException e) {

            e.printStackTrace();
        }
    }

    // =====================================================
    // HAPUS SEMUA DATA
    // =====================================================

    public static void hapusSemuaData(
            Context context
    ) {

        SharedPreferences preferences =
                context.getSharedPreferences(
                        PREF_NAME,
                        Context.MODE_PRIVATE
                );

        preferences.edit()
                .remove(KEY_TRANSAKSI)
                .apply();
    }
}