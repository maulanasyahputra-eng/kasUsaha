@php
    $fontFamily = "'Inter', 'Helvetica', 'Arial', sans-serif";
@endphp
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <style>
        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            src: url("{{ public_path('inter/Inter_24pt-Regular.ttf') }}") format('truetype')
        }

        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 500;
            src: url("{{ public_path('inter/Inter_24pt-Medium.ttf') }}") format('truetype')
        }

        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 600;
            src: url("{{ public_path('inter/Inter_24pt-SemiBold.ttf') }}") format('truetype')
        }

        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 700;
            src: url("{{ public_path('inter/Inter_24pt-Bold.ttf') }}") format('truetype')
        }

        * {
            box-sizing: border-box
        }

        body {
            font-family: {{ $fontFamily }};
            margin: 0;
            padding: 24px;
            color: #1e293b;
            line-height: 1.5;
        }

        .header {
            margin-bottom: 20px
        }

        .store {
            display: flex;
            gap: 16px;
            align-items: center;
        }

        .logo {
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #f1f5f9;
            border-radius: 8px;
        }

        .logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain
        }

        .logo-placeholder {
            font-size: 20px;
            color: #4aa377;
            text-transform: uppercase;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            background: #e6f3ec;
            color: #4aa377;
        }

        .qty {
            text-align: center;
            vertical-align: middle
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 8px;
            margin-top: 5px
        }

        th.produk,
        td.produk {
            text-align: left
        }

        thead th {
            background: #4aa377;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 14px;
            border: none
        }

        thead th:first-child {
            border-radius: 6px 0 0 6px
        }

        thead th:last-child {
            border-radius: 0 6px 6px 0
        }

        tbody td {
            background: #f8fafc;
            padding: 10px 14px;
            font-size: 12.5px;
            font-weight: 500;
            border: none
        }

        tbody tr td:first-child {
            border-radius: 6px 0 0 6px
        }

        tbody tr td:last-child {
            border-radius: 0 6px 6px 0
        }

        tbody tr:nth-child(even) td {
            background: #f1f5f9
        }

        .right {
            text-align: right
        }

        .footer {
            margin-top: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px
        }

        .barcode {
            text-align: center
        }

        .barcode img {
            height: 32px
        }
        
        .text-muted {
            color: #64748b;
        }
    </style>
</head>

<body>
    <table class="header" style="width:100%; table-layout:fixed;">
        <tr>
            <td style="width:65%; vertical-align:top; background:transparent; padding:0;">
                <div class="store">
                    <div class="logo">
                        @if ($store['logo_data'])
                            <img src="{{ $store['logo_data'] }}" alt="DuoBlossom Gallery">
                        @elseif($store['logo'])
                            <img src="{{ $store['logo'] }}" alt="DuoBlossom Gallery">
                        @else
                            <strong class="logo-placeholder">DB</strong>
                        @endif
                    </div>
                    <div>
                        <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:-0.5px; color:#0f172a;">DuoBlossom Gallery</h1>
                        @if ($store['address'])
                            <div style="font-size:12px; color:#475569; margin-top:3px;">{{ $store['address'] }}</div>
                        @endif
                        <div style="font-size:12px; color:#475569; margin-top:2px;">
                            {{ $store['phone'] ? 'Telp: ' . $store['phone'] . ' • ' : '' }}{{ $store['email'] }}
                        </div>
                    </div>
                </div>
            </td>
            <td style="width:35%; vertical-align:top; text-align:right; background:transparent; padding:0;">
                <div class="badge">INVOICE RESMI</div>
                <div style="font-size:24px; font-weight:700; margin-top:6px; color:#0f172a; letter-spacing:-0.5px;">{{ $transaction->invoice }}</div>
                <div style="font-size:12px; color:#475569; margin-top:4px;">
                    {{ \Carbon\Carbon::parse($transaction->created_at)->format('d M Y H:i') }}
                </div>
            </td>
        </tr>
    </table>

    <table style="width:100%; margin-top:20px; table-layout:fixed;">
        <tr>
            <td style="width:50%; vertical-align:top; font-size:13px; background:transparent; padding:0;">
                <div class="text-muted" style="font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">Tujuan Tagihan</div>
                <div style="font-weight:700; margin-top:4px; font-size:14px; color:#0f172a;">{{ $transaction->customer->name ?? 'Umum' }}</div>
                @if ($transaction->customer?->no_telp)
                    <div style="color:#475569; margin-top:2px;">{{ $transaction->customer->no_telp }}</div>
                @endif
                @if ($transaction->customer)
                    <div style="color:#475569; margin-top:2px; font-size:12px;">
                        {{ $transaction->customer->village_name ?? '' }}
                        @if ($transaction->customer->regency_name)
                            , {{ $transaction->customer->regency_name }}
                        @endif
                        @if ($transaction->customer->province_name)
                            , {{ $transaction->customer->province_name }}
                        @endif
                    </div>
                @endif
            </td>
            <td style="width:50%; vertical-align:top; font-size:13px; text-align:right; background:transparent; padding:0;">
                <div class="text-muted" style="font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">Detail Transaksi</div>
                <div style="font-weight:700; margin-top:4px; font-size:14px; color:#0f172a;">Kasir: {{ $transaction->cashier->name ?? '-' }}</div>
                <div style="margin-top:6px; font-size:12px; color:#475569; line-height:1.6;">
                    <div><strong>Status Pembayaran:</strong> <span style="color:#4aa377; font-weight:600;">{{ $transaction->payment_status }}</span></div>
                    <div><strong>Metode Transaksi:</strong> {{ $transaction->payment_method }}</div>
                    @if ($transaction->receivable && $transaction->receivable->due_date)
                        <div style="color:#e11d48;"><strong>Jatuh Tempo:</strong> {{ \Carbon\Carbon::parse($transaction->receivable->due_date)->format('d M Y') }}</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <table style="margin-top:24px;">
        <thead>
            <tr>
                <th class="produk" style="width: 45%;">Nama Produk</th>
                <th class="qty" style="width: 10%;">Qty</th>
                <th class="right" style="width: 20%;">Harga Satuan</th>
                <th class="right" style="width: 25%;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($transaction->details as $index => $detail)
                <tr>
                    <td>
                        <div style="color: #0f172a; font-weight: 600;">{{ $detail->product->title ?? 'Produk' }}</div>
                        @if ($detail->discount_total > 0 && ($detail->pricing_group_label || $detail->pricing_rule_name))
                            <div style="font-size:11px; color:#e11d48; margin-top:2px; font-weight:500;">
                                🏷️ Promo: {{ $detail->pricing_group_label ?: $detail->pricing_rule_name }}
                            </div>
                        @endif
                    </td>
                    <td class="qty" style="color:#0f172a;">{{ $detail->qty }}</td>
                    <td class="right">
                        @if ($detail->discount_total > 0 && $detail->base_unit_price > $detail->unit_price)
                            <div style="font-size:11px; color:#94a3b8; text-decoration:line-through; font-weight:400; margin-bottom:1px;">
                                {{ number_format($detail->base_unit_price, 0, ',', '.') }}
                            </div>
                        @endif
                        <span style="color:#0f172a;">{{ number_format($detail->unit_price ?: ($detail->price / max(1, $detail->qty)), 0, ',', '.') }}</span>
                    </td>
                    <td class="right" style="color:#0f172a; font-weight:700;">{{ number_format($detail->price, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @php
        $promoDiscount = $transaction->details->sum('discount_total');
        $discount = $transaction->discount ?? 0;
        $voucherDiscount = $transaction->customer_voucher_discount ?? 0;
        $loyaltyDiscount = $transaction->loyalty_discount_total ?? 0;
        $shipping = $transaction->shipping_cost ?? 0;
        $grandTotal = $transaction->grand_total ?? 0;
        $subtotal = $grandTotal + $discount - $shipping + $promoDiscount + $voucherDiscount + $loyaltyDiscount;
    @endphp

    <table style="width:100%; margin-top:12px;">
        <tr>
            <td style="width:50%; background:transparent; padding:0;"></td>
            <td style="width:50%; background:transparent; padding:0;">
                <table style="width:100%; border-collapse:separate; border-spacing:0 6px; font-size:12.5px;">
                    <tr>
                        <td style="color:#475569; background:transparent; padding:4px 0;">Subtotal Sebelum Diskon</td>
                        <td class="right" style="font-weight:600; background:transparent; padding:4px 0; color:#0f172a;">
                            {{ number_format($subtotal, 0, ',', '.') }}
                        </td>
                    </tr>
                    @if ($promoDiscount > 0)
                        <tr>
                            <td style="color:#475569; background:transparent; padding:4px 0;">Potongan Promo Toko</td>
                            <td class="right" style="font-weight:600; color:#e11d48; background:transparent; padding:4px 0;">
                                - {{ number_format($promoDiscount, 0, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                    @if ($discount > 0)
                        <tr>
                            <td style="color:#475569; background:transparent; padding:4px 0;">Diskon Manual Kasir</td>
                            <td class="right" style="font-weight:600; color:#e11d48; background:transparent; padding:4px 0;">
                                - {{ number_format($discount, 0, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                    @if ($voucherDiscount > 0)
                        <tr>
                            <td style="color:#475569; background:transparent; padding:4px 0;">Kupon Kemitraan (Voucher)</td>
                            <td class="right" style="font-weight:600; color:#e11d48; background:transparent; padding:4px 0;">
                                - {{ number_format($voucherDiscount, 0, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                    @if ($loyaltyDiscount > 0)
                        <tr>
                            <td style="color:#475569; background:transparent; padding:4px 0;">Penukaran Poin Loyalitas</td>
                            <td class="right" style="font-weight:600; color:#e11d48; background:transparent; padding:4px 0;">
                                - {{ number_format($loyaltyDiscount, 0, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                    @if ($shipping > 0)
                        <tr>
                            <td style="color:#475569; background:transparent; padding:4px 0;">Biaya Pengiriman (Ongkir)</td>
                            <td class="right" style="font-weight:600; background:transparent; padding:4px 0; color:#0f172a;">
                                + {{ number_format($shipping, 0, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                    @if (($transaction->tax_total ?? 0) > 0)
                        <tr>
                            <td style="color:#475569; background:transparent; padding:4px 0;">PPN {{ number_format($transaction->tax_rate ?? 11, 0) }}%</td>
                            <td class="right" style="font-weight:600; background:transparent; padding:4px 0; color:#0f172a;">
                                + {{ number_format($transaction->tax_total, 0, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                    <tr style="border-top: 1px solid #cbd5e1;">
                        <td style="font-weight:700; font-size:14px; color:#0f172a; background:transparent; padding:10px 0 4px 0;">Total Akhir Net</td>
                        <td class="right" style="font-weight:800; font-size:16px; color:#4aa377; background:transparent; padding:10px 0 4px 0;">
                            {{ number_format($grandTotal, 0, ',', '.') }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="footer">
        <div class="barcode" style="margin-top: 30px">
            <img src="{{ $barcode }}" alt="Barcode Bukti Invoice">
            <div style="font-size:11px; color:#475569; margin-top: 6px; font-weight:600; letter-spacing:0.5px;">{{ $transaction->invoice }}</div>
        </div>
        <div style="font-size:12px; color:#94a3b8; text-align:center; margin-top: 15px; font-style:italic;">
            Terima kasih atas kunjungan dan kepercayaan Anda di **DuoBlossom Gallery**.
        </div>
    </div>
</body>

</html>