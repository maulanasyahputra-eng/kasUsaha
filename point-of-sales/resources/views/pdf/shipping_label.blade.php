@php
    $formatPrice = fn($v) => 'Rp ' . number_format($v ?? 0, 0, ',', '.');
    $formatDate = fn($v) => \Carbon\Carbon::parse($v)->format('d M Y');
@endphp
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <style>
        /* Ukuran 150mm x 100mm dalam Points */
        @page {
            margin: 0;
            size: 425.2pt 283.5pt;
        }

        body {
            font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            width: 425.2pt;
            height: 283.5pt;
            color: #1e293b;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
        }

        .container {
            padding: 14pt 16pt;
            position: relative;
            height: 283.5pt;
            box-sizing: border-box;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        td {
            vertical-align: top;
            overflow: hidden;
        }

        .header {
            width: 100%;
            table-layout: auto !important;
            margin-bottom: 4pt;
        }

        .header td {
            vertical-align: middle;
            padding: 0;
        }

        .logo-box {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            border-radius: 4pt;
        }

        .divider {
            border-top: 1.5pt solid #cbd5e1;
            margin: 6pt 0 8pt 0;
        }

        .section-box {
            border: 1px solid #e2e8f0;
            border-radius: 6pt;
            padding: 6pt 8pt;
            height: 68pt;
            box-sizing: border-box;
            background: #f8fafc;
        }

        .title-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 3pt;
        }

        .text-bold {
            font-size: 10.5pt;
            font-weight: 700;
            color: #0f172a;
        }

        .text-small {
            font-size: 8.5pt;
            line-height: 1.3;
        }

        .text-muted {
            color: #475569;
            font-size: 7.5pt;
        }

        /* Footer dipaksa berada di paling bawah label */
        .footer-absolute {
            position: absolute;
            bottom: 14pt;
            left: 16pt;
            right: 16pt;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6pt;
        }

        .barcode-container {
            text-align: right;
            width: 140pt;
            float: right;
        }

        .barcode-img {
            height: 30pt;
            max-width: 140pt;
            display: block;
            margin-left: auto;
        }

        .invoice-number {
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 1px;
            margin-top: 3pt;
            color: #000;
            text-align: right;
            padding-right: 2pt;
        }

        ul {
            margin: 0;
            padding-left: 12pt;
        }

        li {
            font-size: 8.5pt;
            margin-bottom: 2pt;
            color: #334155;
        }
    </style>
</head>

<body>
    <div class="container">
        <table class="header">
            <tr>
                <td style="width: 1%; padding-right: 8pt;">
                    <div class="logo-box" style="width: 38pt; height: 38pt;">
                        @if ($store['logo_data'] ?? false)
                            <img src="{{ $store['logo_data'] }}" alt="DuoBlossom Gallery"
                                style="max-width: 38pt; max-height: 38pt; object-fit: contain;">
                        @else
                            <div style="line-height: 38pt; text-align: center; font-weight: 800; font-size: 14pt; color: #0f172a;">
                                DB
                            </div>
                        @endif
                    </div>
                </td>
                <td style="text-align: left;">
                    <div class="text-bold" style="font-size: 13pt; line-height: 1.1; letter-spacing: -0.3px;">DuoBlossom Gallery</div>
                    <div class="text-small text-muted" style="margin-top: 2pt; font-size: 7.5pt; line-height: 1.2;">{{ Str::limit($store['address'], 65) }}</div>
                    <div class="text-small text-muted" style="margin-top: 1pt; font-weight: 500;">
                        {{ $store['phone'] }}@if ($store['phone'] && $store['email']) • @endif{{ $store['email'] }}
                    </div>
                </td>
                <td width="130pt" style="text-align: right; vertical-align: middle;">
                    <div class="text-muted" style="font-size: 7pt; font-weight: 700; letter-spacing: 0.5px;">INVOICE BILL</div>
                    <div class="text-bold" style="font-size: 13pt; color: #0f172a; line-height: 1.1; margin: 1pt 0;">
                        {{ $transaction->invoice }}
                    </div>
                    <div class="text-small" style="font-weight: 500; color: #64748b;">{{ $formatDate($transaction->created_at) }}</div>
                </td>
            </tr>
        </table>

        <div class="divider"></div>

        <table>
            <tr>
                <td style="padding-right: 5pt; width: 62%;">
                    <div class="section-box">
                        <div class="title-label">Tujuan Pengiriman / Penerima</div>
                        <div class="text-bold" style="font-size: 9.5pt;">{{ $transaction->customer->name ?? 'Pelanggan Umum' }}</div>
                        <div class="text-small text-muted" style="margin: 1pt 0; font-weight: 600; color: #334155;">
                            {{ $transaction->customer->no_telp ?? '-' }}
                        </div>
                        <div class="text-small text-muted" style="line-height: 1.2; font-size: 7.5pt;">
                            {{ Str::limit($transaction->customer->address ?? 'Tanpa Alamat Rumah', 75) }}
                            <span style="display: block; margin-top: 1pt;">
                                {{ $transaction->customer->village_name ?? '-' }}
                                {!! $transaction->customer->district_name ? ', ' . $transaction->customer->district_name : '' !!}
                                {!! $transaction->customer->regency_name ? ', ' . $transaction->customer->regency_name : '' !!}
                            </span>
                        </div>
                    </div>
                </td>
                <td style="padding-left: 5pt; width: 38%;">
                    <div class="section-box" style="background: #f1f5f9; border-color: #cbd5e1;">
                        <div class="title-label">Ringkasan Nilai</div>
                        <table class="text-small" style="margin-top: 2pt;">
                            <tr>
                                <td style="color: #64748b;">Kuantitas</td>
                                <td style="text-align: right; font-weight: 600;">{{ $transaction->details->count() }} Item</td>
                            </tr>
                            <tr>
                                <td style="padding-top: 12pt; font-weight: 700; color: #0f172a;">Total Tagihan</td>
                                <td style="padding-top: 12pt; text-align: right; font-weight: 800; color: #16a34a; font-size: 11pt;">
                                    {{ $formatPrice($transaction->grand_total) }}
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <div class="title-label" style="margin-top: 8pt; margin-bottom: 2pt;">Isi Paket / Item Produk</div>
        <div style="height: 46pt; overflow: hidden;">
            <ul>
                @foreach ($transaction->details->take(3) as $detail)
                    <li><strong>{{ $detail->qty }}x</strong> — {{ Str::limit($detail->product->title, 48) }}</li>
                @endforeach
            </ul>
        </div>

        <div class="footer-absolute">
            <table style="table-layout: auto;">
                <tr>
                    <td class="text-muted" style="vertical-align: middle; line-height: 1.4; font-size: 7.5pt;">
                        Kasir: <span style="font-weight: 600; color: #0f172a;">{{ $transaction->cashier->name ?? '-' }}</span><br>
                        Waktu Cetak: {{ now()->format('d/m/Y H:i') }}
                    </td>

                    <td style="text-align: right; width: 140pt; vertical-align: middle;">
                        <div class="barcode-container">
                            <img src="{{ $barcode }}" class="barcode-img" alt="barcode">
                            <div class="invoice-number">{{ $transaction->invoice }}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>

</html>