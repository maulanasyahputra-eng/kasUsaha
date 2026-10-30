<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 10mm; }
        body { 
            font-family: 'Inter', 'Helvetica Neue', 'Arial', sans-serif; 
            margin: 0; 
            background: #f8fafc; 
            color: #1e293b; 
            line-height: 1.5;
        }
        .sheet { 
            max-width: 900px; 
            margin: 20px auto; 
            background: white; 
            border: 1px solid #e2e8f0; 
            border-radius: 16px; 
            padding: 24px 28px; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            gap: 16px; 
            border-bottom: 2px solid #f1f5f9; 
            padding-bottom: 16px; 
        }
        .store { 
            display: flex; 
            gap: 16px; 
            align-items: center; 
            flex: 1; 
            min-width: 0; 
        }
        .logo { 
            width: 56px; 
            height: 56px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            overflow: hidden; 
            background: #f1f5f9;
            border-radius: 8px;
        }
        .logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .logo-placeholder { font-size: 18px; color: #4aa377; text-transform: uppercase; }
        .store-info { line-height: 1.4; }
        .store-name { font-weight: 700; font-size: 20px; color: #0f172a; letter-spacing: -0.5px; }
        .muted { color: #64748b; font-size: 12.5px; }
        .badge { 
            display: inline-block;
            padding: 4px 12px; 
            border-radius: 999px; 
            background: #e0f2fe; 
            color: #0369a1; 
            font-weight: 700; 
            font-size: 11px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc { text-align: right; min-width: 200px; }
        .doc-number { font-size: 18px; font-weight: 800; margin: 6px 0 4px 0; color: #0f172a; }
        .section { 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 16px; 
            margin-top: 16px; 
            background: #ffffff;
        }
        .section-title { 
            font-size: 11px; 
            text-transform: uppercase; 
            color: #94a3b8; 
            letter-spacing: 0.8px; 
            font-weight: 700; 
            margin-bottom: 10px; 
        }
        .grid-2 { display: flex; gap: 16px; justify-content: space-between; }
        .customer-box { width: 45%; }
        .stats-box { width: 55%; display: flex; gap: 12px; }
        .stat { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 10px; 
            padding: 12px; 
            flex: 1;
        }
        .stat-label { font-size: 10.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .stat-value { font-size: 15px; font-weight: 700; margin-top: 4px; color: #0f172a; }
        .stat-positive { color: #16a34a; }
        .stat-warning { color: #ea580c; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { padding: 10px 12px; font-size: 13px; text-align: left; }
        th { 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            font-size: 11px; 
            font-weight: 700;
            background: #f8fafc;
        }
        tr td { border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:last-child td { border-bottom: none; }
        .footer { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
        .barcode img { height: 40px; }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="header">
            <div class="store">
                <div class="logo">
                    @if($store['logo'])
                        <img src="{{ $store['logo'] }}" alt="DuoBlossom Gallery">
                    @else
                        <strong class="logo-placeholder">DB</strong>
                    @endif
                </div>
                <div class="store-info">
                    <div class="store-name">DuoBlossom Gallery</div>
                    @if($store['address'])<div class="muted" style="margin-top: 2px;">{{ $store['address'] }}</div>@endif
                    <div class="muted">{{ $store['phone'] ? 'Telp: '.$store['phone'].' • ' : '' }}{{ $store['email'] }}</div>
                </div>
            </div>
            <div class="doc">
                <div class="badge">Tagihan Piutang</div>
                <div class="doc-number">{{ $receivable->invoice }}</div>
                <div class="muted">Jatuh tempo: <span style="font-weight: 600; color: #ea580c;">{{ $receivable->due_date ?? '-' }}</span></div>
            </div>
        </div>

        <div class="section grid-2">
            <div class="customer-box">
                <div class="section-title">Pelanggan / Pembeli</div>
                <div style="font-weight: 700; font-size: 16px; color: #0f172a;">{{ $receivable->customer->name ?? 'Umum' }}</div>
                @if($receivable->customer?->phone)
                    <div class="muted" style="margin-top: 4px;">📞 {{ $receivable->customer->phone }}</div>
                @endif
            </div>
            
            <div class="stats-box">
                <div class="stat">
                    <div class="stat-label">Total Piutang</div>
                    <div class="stat-value">Rp {{ number_format($receivable->total,0,',','.') }}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Telah Dibayar</div>
                    <div class="stat-value stat-positive">Rp {{ number_format($receivable->paid,0,',','.') }}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Sisa Tagihan</div>
                    <div class="stat-value stat-warning">
                        Rp {{ number_format(max(0, $receivable->total - $receivable->paid),0,',','.') }}
                    </div>
                </div>
            </div>
        </div>

        <div class="section" style="padding: 0; overflow: hidden;">
            <div style="padding: 16px 16px 4px 16px;">
                <div class="section-title" style="margin-bottom: 0;">Riwayat Cicilan & Pembayaran Masuk</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 35%; padding-left: 16px;">Tanggal Bayar</th>
                        <th style="width: 35%;">Metode Pembayaran</th>
                        <th style="text-align: right; padding-right: 16px;">Jumlah Nominal</th>
                    </tr>
                </thead>
                <tbody>
                @forelse($receivable->payments as $pay)
                    <tr>
                        <td style="padding-left: 16px;">{{ \Carbon\Carbon::parse($pay->paid_at)->format('d M Y') }}</td>
                        <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{{ strtoupper($pay->method ?? '-') }}</span></td>
                        <td style="text-align: right; padding-right: 16px; font-weight: 700; color: #0f172a;">Rp {{ number_format($pay->amount,0,',','.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="3" style="color: #94a3b8; text-align: center; padding: 24px 0; font-style: italic;">
                            Belum ada rekam jejak cicilan pembayaran dari pelanggan.
                        </td>
                    </tr>
                @endforelse
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div class="muted" style="font-size: 12px;">Lembar piutang ini dicetak otomatis pada: <strong>{{ now()->format('d M Y H:i') }}</strong></div>
            <div class="barcode">
                <img src="{{ $barcode }}" alt="Barcode Bukti">
                <div class="muted" style="font-size: 10px; margin-top: 2px; font-weight: 600;">{{ $receivable->invoice }}</div>
            </div>
        </div>
    </div>
</body>
</html>