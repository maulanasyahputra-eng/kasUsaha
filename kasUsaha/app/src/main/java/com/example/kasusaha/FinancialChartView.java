package com.example.kasusaha;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

public class FinancialChartView extends View {

    private Paint paint;

    private double pemasukan = 0;
    private double pengeluaran = 0;
    private double saldo = 0;

    public FinancialChartView(Context context) {
        super(context);
        init();
    }

    public FinancialChartView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public FinancialChartView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {

        paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        setLayerType(View.LAYER_TYPE_SOFTWARE, null);
    }

    public void setData(
            double pemasukan,
            double pengeluaran,
            double saldo
    ) {

        this.pemasukan = Math.max(0, pemasukan);
        this.pengeluaran = Math.max(0, pengeluaran);
        this.saldo = Math.max(0, saldo);

        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {

        super.onDraw(canvas);

        float width = getWidth();
        float height = getHeight();

        if (width <= 0 || height <= 0) {
            return;
        }

        // =====================================================
        // AREA GRAFIK
        // =====================================================

        float left = 45;
        float right = width - 20;
        float top = 15;
        float bottom = height - 45;

        float chartHeight = bottom - top;

        // =====================================================
        // NILAI TERBESAR
        // =====================================================

        double nilaiMaksimum =
                Math.max(
                        pemasukan,
                        Math.max(
                                pengeluaran,
                                saldo
                        )
                );

        if (nilaiMaksimum <= 0) {
            nilaiMaksimum = 1;
        }

        // =====================================================
        // GARIS PEMBANTU
        // =====================================================

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        paint.setColor(Color.parseColor("#E2E8F0"));

        for (int i = 0; i <= 4; i++) {

            float y =
                    top +
                            (chartHeight / 4f) * i;

            canvas.drawLine(
                    left,
                    y,
                    right,
                    y,
                    paint
            );
        }

        // =====================================================
        // BAR
        // =====================================================

        float areaWidth =
                right - left;

        float barWidth = 55;

        float posisi1 =
                left + areaWidth * 0.20f;

        float posisi2 =
                left + areaWidth * 0.50f;

        float posisi3 =
                left + areaWidth * 0.80f;

        // =====================================================
        // TINGGI BAR PEMASUKAN
        // =====================================================

        float tinggiPemasukan =
                (float)
                        (pemasukan /
                                nilaiMaksimum *
                                chartHeight);

        // =====================================================
        // TINGGI BAR PENGELUARAN
        // =====================================================

        float tinggiPengeluaran =
                (float)
                        (pengeluaran /
                                nilaiMaksimum *
                                chartHeight);

        // =====================================================
        // TINGGI BAR SALDO
        // =====================================================

        float tinggiSaldo =
                (float)
                        (saldo /
                                nilaiMaksimum *
                                chartHeight);

        // =====================================================
        // PEMASUKAN
        // =====================================================

        gambarBar(
                canvas,
                posisi1,
                bottom,
                tinggiPemasukan,
                barWidth,
                "#22C55E"
        );

        // =====================================================
        // PENGELUARAN
        // =====================================================

        gambarBar(
                canvas,
                posisi2,
                bottom,
                tinggiPengeluaran,
                barWidth,
                "#EF4444"
        );

        // =====================================================
        // SALDO
        // =====================================================

        gambarBar(
                canvas,
                posisi3,
                bottom,
                tinggiSaldo,
                barWidth,
                "#3B82F6"
        );

        // =====================================================
        // LABEL
        // =====================================================

        paint.setStyle(Paint.Style.FILL);
        paint.setTextSize(11);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setColor(Color.parseColor("#64748B"));

        canvas.drawText(
                "Masuk",
                posisi1 + barWidth / 2,
                height - 15,
                paint
        );

        canvas.drawText(
                "Keluar",
                posisi2 + barWidth / 2,
                height - 15,
                paint
        );

        canvas.drawText(
                "Saldo",
                posisi3 + barWidth / 2,
                height - 15,
                paint
        );

        // =====================================================
        // NILAI DI ATAS BAR
        // =====================================================

        paint.setTextSize(10);
        paint.setTypeface(
                android.graphics.Typeface.DEFAULT_BOLD
        );

        paint.setColor(
                Color.parseColor("#15803D")
        );

        gambarNilai(
                canvas,
                pemasukan,
                posisi1,
                tinggiPemasukan,
                bottom
        );

        paint.setColor(
                Color.parseColor("#DC2626")
        );

        gambarNilai(
                canvas,
                pengeluaran,
                posisi2,
                tinggiPengeluaran,
                bottom
        );

        paint.setColor(
                Color.parseColor("#1D4ED8")
        );

        gambarNilai(
                canvas,
                saldo,
                posisi3,
                tinggiSaldo,
                bottom
        );
    }

    // =====================================================
    // GAMBAR BAR
    // =====================================================

    private void gambarBar(
            Canvas canvas,
            float x,
            float bottom,
            float tinggi,
            float lebar,
            String warna
    ) {

        if (tinggi < 5 && nilaiAda()) {
            tinggi = 5;
        }

        float topBar =
                bottom - tinggi;

        paint.setStyle(Paint.Style.FILL);

        paint.setColor(
                Color.parseColor(warna)
        );

        paint.setShadowLayer(
                7,
                0,
                3,
                0x33000000
        );

        RectF rect =
                new RectF(
                        x,
                        topBar,
                        x + lebar,
                        bottom
                );

        canvas.drawRoundRect(
                rect,
                14,
                14,
                paint
        );

        paint.clearShadowLayer();
    }

    private boolean nilaiAda() {

        return pemasukan > 0 ||
                pengeluaran > 0 ||
                saldo > 0;
    }

    // =====================================================
    // NILAI DI ATAS BAR
    // =====================================================

    private void gambarNilai(
            Canvas canvas,
            double nilai,
            float x,
            float tinggi,
            float bottom
    ) {

        if (nilai <= 0) {
            return;
        }

        String text =
                KeuanganHelper.formatRupiah(nilai);

        // Supaya tidak terlalu panjang
        if (text.length() > 14) {

            if (nilai >= 1000000000) {

                text =
                        String.format(
                                "Rp %.1fM",
                                nilai / 1000000000
                        );

            } else if (nilai >= 1000000) {

                text =
                        String.format(
                                "Rp %.1fJt",
                                nilai / 1000000
                        );

            } else if (nilai >= 1000) {

                text =
                        String.format(
                                "Rp %.0fK",
                                nilai / 1000
                        );
            }
        }

        float y =
                bottom - tinggi - 8;

        if (y < 15) {
            y = 15;
        }

        canvas.drawText(
                text,
                x + 27,
                y,
                paint
        );
    }
}