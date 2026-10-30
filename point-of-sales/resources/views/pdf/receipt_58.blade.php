@php
    $formatPrice = fn($v) => 'Rp ' . number_format($v ?? 0, 0, ',', '.');
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0; }
        body { 
            font-family: 'Inter', 'Helvetica Neue', 'Arial', sans-serif; 
            width: 58mm; 
            margin: 0; 
            padding: 4px 8px; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #1e293b;
        }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .store-name { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .divider-solid { border-top: 1px solid #000; margin: 6px 0; }
        .divider-dashed { border-top: 1px dashed #475569; margin: 6px 0; }
        .flex-between { display: flex; justify-content: space-between; }
        .item-row { margin-bottom: 4px; }
        .barcode img { height: 28px; margin: 6px 0 2px 0; }
        .text-muted { color: #64748b; font-size: 9.5px; }
    </style>
</head>
<body>
    <div class="center" style="margin-top: 4px;">
        <div class="bold store-name" style="margin-bottom: 3px;">DuoBlossom Gallery</div>
        @if($store['address'])<div class="text-muted">{{ $store['address'] }}</div>@endif
        @if($store['phone'])<div class="text-muted">Telp: {{ $store['phone'] }}</div>@endif
        @if($store['email'])<div class="text-muted">{{ $store['email'] }}</div>@endif
        @if($store['website'])<div class="text-muted">{{ $store['website'] }}</div>@endif
    </div>

    <div class="divider-solid"></div>

    <div style="margin: 4px 0;">
        <div class="flex-between">
            <span>No. Invoice</span>
            <span class="bold">{{ $transaction->invoice }}</span>
        </div>
        <div class="flex-between">
            <span>Tanggal</span>
            <span>{{ \Carbon\Carbon::parse($transaction->created_at)->format('d/m/Y H:i') }}</span>
        </div>
        <div class="flex-between">
            <span>Kasir</span>
            <span>{{ $transaction->cashier->name ?? '-' }}</span>
        </div>
        <div class="flex-between">
            <span>Pelanggan</span>
            <span>{{ $transaction->customer->name ?? 'Umum' }}</span>
        </div>
    </div>

    <div class="divider-solid"></div>

    <div style="margin: 4px 0;">
        @foreach($transaction->details as $item)
            @php
                $qty = max(1, $item->qty);
                $total = $item->price;
                $unit = $item->unit_price ?: ($qty ? $total / $qty : $total);
            @endphp
            <div class="item-row">
                <div style="font-weight: 600;">{{ $item->product->title ?? 'Produk' }}</div>
                
                @if($item->discount_total > 0 && ($item->pricing_group_label || $item->pricing_rule_name))
                    <div class="flex-between text-muted" style="font-style: italic;">
                        <span>Promo: {{ $item->pricing_group_label ?: $item->pricing_rule_name }}</span>
                        <span>{{ $formatPrice($item->base_unit_price) }}</span>
                    </div>
                @endif
                
                <div class="flex-between">
                    <span class="text-muted">{{ $qty }} x {{ $formatPrice($unit) }}</span>
                    <span>{{ $formatPrice($total) }}</span>
                </div>
            </div>
        @endforeach
    </div>

    <div class="divider-dashed"></div>

    @php
        $promoDiscount = $transaction->details->sum('discount_total');
        $voucherDiscount = $transaction->customer_voucher_discount ?? 0;
        $loyaltyDiscount = $transaction->loyalty_discount_total ?? 0;
        $subtotal = ($transaction->grand_total ?? 0) + ($transaction->discount ?? 0) - ($transaction->shipping_cost ?? 0) - ($transaction->tax_total ?? 0) + $promoDiscount + $voucherDiscount + $loyaltyDiscount;
        $discount = $transaction->discount ?? 0;
        $total = $transaction->grand_total ?? 0;
        $shipping = $transaction->shipping_cost ?? 0;
        $taxTotal = $transaction->tax_total ?? 0;
        $taxRate = $transaction->tax_rate ?? 0;
        $cash = $transaction->cash ?? 0;
        $change = $transaction->change ?? 0;
        $paymentMethod = strtoupper($transaction->payment_method ?? 'TUNAI');
    @endphp

    <div style="margin: 4px 0;">
        <div class="flex-between">
            <span>Subtotal</span>
            <span>{{ $formatPrice($subtotal) }}</span>
        </div>
        @if($promoDiscount > 0)
            <div class="flex-between text-muted">
                <span>Diskon Promo</span>
                <span>-{{ $formatPrice($promoDiscount) }}</span>
            </div>
        @endif
        @if($discount > 0)
            <div class="flex-between text-muted">
                <span>Diskon Manual</span>
                <span>-{{ $formatPrice($discount) }}</span>
            </div>
        @endif
        @if($voucherDiscount > 0)
            <div class="flex-between text-muted">
                <span>Voucher</span>
                <span>-{{ $formatPrice($voucherDiscount) }}</span>
            </div>
        @endif
        @if($loyaltyDiscount > 0)
            <div class="flex-between text-muted">
                <span>Poin Ditukar</span>
                <span>-{{ $formatPrice($loyaltyDiscount) }}</span>
            </div>
        @endif
        @if($shipping > 0)
            <div class="flex-between">
                <span>Ongkos Kirim</span>
                <span>{{ $formatPrice($shipping) }}</span>
            </div>
        @endif
        @if($taxTotal > 0)
            <div class="flex-between">
                <span>PPN {{ number_format($taxRate, 0) }}%</span>
                <span>{{ $formatPrice($taxTotal) }}</span>
            </div>
        @endif
        
        <div class="flex-between bold" style="font-size: 12px; margin-top: 4px; padding-top: 2px; border-top: 0.5px solid #e2e8f0;">
            <span>TOTAL</span>
            <span>{{ $formatPrice($total) }}</span>
        </div>
    </div>

    <div class="divider-dashed"></div>

    <div style="margin: 4px 0;">
        <div class="flex-between">
            <span>Bayar ({{ $paymentMethod }})</span>
            <span>{{ $formatPrice($cash) }}</span>
        </div>
        @if($change > 0)
            <div class="flex-between bold" style="font-size: 11.5px;">
                <span>Kembali</span>
                <span>{{ $formatPrice($change) }}</span>
            </div>
        @endif
    </div>

    <div class="divider-solid"></div>

    <div class="center" style="margin-top: 8px;">
        <div class="barcode">
            <img src="{{ $barcode }}" alt="barcode">
        </div>
        <div class="text-muted" style="margin-bottom: 6px;">{{ $transaction->invoice }}</div>
        <div class="bold" style="font-size: 11px; letter-spacing: 0.5px;">~~ Terima Kasih ~~</div>
        <div class="text-muted" style="margin-top: 2px;">Selamat Berbelanja Kembali</div>
    </div>
</body>
</html>