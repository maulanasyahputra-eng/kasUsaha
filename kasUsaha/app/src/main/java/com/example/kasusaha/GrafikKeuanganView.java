package com.example.kasusaha;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

public class GrafikKeuanganView extends View {

    private Paint paint;

    private double pemasukan = 0;
    private double pengeluaran = 0;

    public GrafikKeuanganView(Context context) {
        super(context);
        init();
    }

    public GrafikKeuanganView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public GrafikKeuanganView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {

        paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        setLayerType(View.LAYER_TYPE_SOFTWARE, null);
    }

    // =====================================================
    // UPDATE DATA GRAFIK
    // =====================================================

    public void setData(double pemasukan, double pengeluaran) {

        this.pemasukan = pemasukan;
        this.pengeluaran = pengeluaran;

        invalidate();
    }

    // =====================================================
    // GAMBAR GRAFIK
    // =====================================================

    @Override
    protected void onDraw(Canvas canvas) {

        super.onDraw(canvas);

        float width = getWidth();
        float height = getHeight();

        // Background
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0xFFFFFFFF);

        canvas.drawRoundRect(
                new RectF(
                        0,
                        0,
                        width,
                        height
                ),
                28,
                28,
                paint
        );

        // =================================================
        // JUDUL
        // =================================================

        paint.setColor(0xFF0F172A);
        paint.setTextSize(17);
        paint.setTypeface(
                android.graphics.Typeface.DEFAULT_BOLD
        );

        canvas.drawText(
                "Grafik Keuangan",
                24,
                32,
                paint
        );

        // =================================================
        // SUBJUDUL
        // =================================================

        paint.setColor(0xFF64748B);
        paint.setTextSize(11);
        paint.setTypeface(
                android.graphics.Typeface.DEFAULT
        );

        canvas.drawText(
                "Ringkasan pemasukan dan pengeluaran",
                24,
                52,
                paint
        );

        // =================================================
        // AREA GRAFIK
        // =================================================

        float chartLeft = 55;
        float chartRight = width - 25;
        float chartTop = 80;
        float chartBottom = height - 55;

        // Garis horizontal grafik

        paint.setStrokeWidth(1);

        paint.setColor(0xFFE2E8F0);

        for (int i = 0; i <= 4; i++) {

            float y =
                    chartTop +
                            ((chartBottom - chartTop) / 4)
                                    * i;

            canvas.drawLine(
                    chartLeft,
                    y,
                    chartRight,
                    y,
                    paint
            );
        }

        // =================================================
        // NILAI MAKSIMUM
        // =================================================

        double nilaiMaksimum =
                Math.max(
                        pemasukan,
                        pengeluaran
                );

        if (nilaiMaksimum <= 0) {
            nilaiMaksimum = 1;
        }

        // =================================================
        // BAR PEMASUKAN
        // =================================================

        float areaWidth =
                chartRight - chartLeft;

        float barWidth =
                areaWidth / 5;

        float pemasukanHeight =
                (float)
                        ((pemasukan / nilaiMaksimum)
                                * (chartBottom - chartTop - 10));

        float pengeluaranHeight =
                (float)
                        ((pengeluaran / nilaiMaksimum)
                                * (chartBottom - chartTop - 10));

        // Bar pemasukan

        paint.setColor(0xFF22C55E);
        paint.setStyle(Paint.Style.FILL);

        float pemasukanLeft =
                chartLeft + barWidth;

        float pemasukanRight =
                pemasukanLeft + barWidth;

        canvas.drawRoundRect(
                new RectF(
                        pemasukanLeft,
                        chartBottom - pemasukanHeight,
                        pemasukanRight,
                        chartBottom
                ),
                16,
                16,
                paint
        );

        // =================================================
        // BAR PENGELUARAN
        // =================================================

        paint.setColor(0xFFEF4444);

        float pengeluaranLeft =
                chartLeft + (barWidth * 3);

        float pengeluaranRight =
                pengeluaranLeft + barWidth;

        canvas.drawRoundRect(
                new RectF(
                        pengeluaranLeft,
                        chartBottom - pengeluaranHeight,
                        pengeluaranRight,
                        chartBottom
                ),
                16,
                16,
                paint
        );

        // =================================================
        // LABEL PEMASUKAN
        // =================================================

        paint.setColor(0xFF166534);
        paint.setTextSize(11);
        paint.setTypeface(
                android.graphics.Typeface.DEFAULT_BOLD
        );

        canvas.drawText(
                "Pemasukan",
                pemasukanLeft - 5,
                chartBottom + 25,
                paint
        );

        // =================================================
        // LABEL PENGELUARAN
        // =================================================

        paint.setColor(0xFF991B1B);

        canvas.drawText(
                "Pengeluaran",
                pengeluaranLeft - 8,
                chartBottom + 25,
                paint
        );

        // =================================================
        // NILAI PEMASUKAN
        // =================================================

        paint.setColor(0xFF15803D);
        paint.setTextSize(10);

        canvas.drawText(
                formatRupiah(pemasukan),
                pemasukanLeft - 5,
                chartBottom - pemasukanHeight - 8,
                paint
        );

        // =================================================
        // NILAI PENGELUARAN
        // =================================================

        paint.setColor(0xFFDC2626);

        canvas.drawText(
                formatRupiah(pengeluaran),
                pengeluaranLeft - 8,
                chartBottom - pengeluaranHeight - 8,
                paint
        );
    }

    // =====================================================
    // FORMAT RUPIAH
    // =====================================================

    private String formatRupiah(double nilai) {

        if (nilai >= 1000000000) {

            return String.format(
                    "Rp %.1fM",
                    nilai / 1000000000
            );

        } else if (nilai >= 1000000) {

            return String.format(
                    "Rp %.1fJt",
                    nilai / 1000000
            );

        } else if (nilai >= 1000) {

            return String.format(
                    "Rp %.0fK",
                    nilai / 1000
            );

        } else {

            return String.format(
                    "Rp %.0f",
                    nilai
            );
        }
    }
}