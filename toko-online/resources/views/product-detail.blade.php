<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $product->name }} — DouBlossom</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
    </style>
</head>
<body class="bg-[#FAF8F5] text-[#28362E] antialiased">

    <header class="bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EFE5D8]/60 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-6 sm:px-12 h-16 flex items-center justify-between">
            <a href="/" class="inline-flex items-center gap-2 text-[#28362E] font-bold">
                <span class="w-10 h-10 rounded-2xl bg-[#28362E] text-[#D49A73] flex items-center justify-center">🌸</span>
                <span class="font-serif text-xl sm:text-2xl">DouBlossom</span>
            </a>
            <a href="https://wa.me/628123456789" target="_blank" class="bg-[#28362E] hover:bg-[#3E5246] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-3 rounded-full">
                Pesan via WA
            </a>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 sm:px-12 py-10">
        <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-7">
                <div class="rounded-[2rem] border border-[#EFE5D8]/60 bg-white overflow-hidden shadow-sm">
                    <div class="p-5 bg-gradient-to-b from-white to-[#F2EFE9]/40">
                        <div class="text-xs uppercase tracking-widest font-bold text-[#A2B5A8]">{{ $product->category }}</div>
                        <h1 class="font-serif text-4xl mt-2 leading-tight">{{ $product->name }}</h1>
                        <p class="text-[#5C6E63] mt-3 leading-relaxed">{{ $product->description }}</p>
                    </div>

                    <script>
                        function setActiveImage(index, price, btnEl) {
                            // highlight ring pada semua thumbnail
                            const thumbs = document.querySelectorAll('button[data-thumb-img]');
                            thumbs.forEach(b => {
                                const img = b.querySelector('img');
                                img?.classList.remove('ring-2', 'ring-[#D49A73]');
                            });

                            if (btnEl) {
                                const img = btnEl.querySelector('img');
                                img?.classList.add('ring-2', 'ring-[#D49A73]');
                            }

                            const el = document.getElementById('activePrice');
                            if (el) {
                                el.textContent = 'Rp ' + Number(price || 0).toLocaleString('id-ID');
                            }
                        }
                    </script>

                    <div class="grid grid-cols-3 gap-1 p-2 bg-[#FAF8F5]">
                        @php
                            $fallback = $product->emoji ? asset('storage/'.$product->emoji) : null;
                            $images = $product->images ?? collect();
                        @endphp

                        @php
                            $activeIndex = 0;
                            $hasImages = $images->count() > 0;
                        @endphp

                        @if($hasImages)
                            @foreach($images as $i => $img)
                                @php
                                    $src = asset('storage/' . $img->path);
                                    $price = (int) ($img->price ?? 0);
                                @endphp
                                <button type="button"
                                        data-thumb-img="1"
                                        class="w-full h-40 object-cover focus:outline-none"
                                        onclick="setActiveImage({{ $i }}, {{ $price }}, this)"
                                        aria-label="Pilih foto {{ $i+1 }}">
                                    <img src="{{ $src }}"
                                         class="w-full h-40 object-cover {{ $i === 0 ? 'ring-2 ring-[#D49A73]' : '' }}"
                                         alt="{{ $img->alt ?? $product->name }}">
                                </button>
                            @endforeach
                        @elseif($fallback)
                            <div class="col-span-3">
                                <img src="{{ $fallback }}" class="w-full h-40 object-cover" alt="Foto produk">
                            </div>
                        @else
                            <div class="col-span-3 text-center py-16 text-sm text-gray-400">Foto produk belum tersedia.</div>
                        @endif
                    </div>

                </div>
            </div>

            <aside class="lg:col-span-5">
                <div class="rounded-[2rem] border border-[#EFE5D8]/60 bg-white p-6 shadow-sm sticky top-24">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-xs uppercase tracking-widest font-bold text-[#A2B5A8]">Mulai</div>
                            @php
                                $firstImg = ($product->images ?? collect())->first();
                                $initialPrice = (int)($firstImg->price ?? 0);
                            @endphp
                            <div id="activePrice" class="text-3xl font-bold text-[#D49A73] mt-1">Rp {{ number_format($initialPrice, 0, ',', '.') }}</div>
                        </div>

                        <div class="w-14 h-14 rounded-2xl border border-[#D49A73]/30 bg-[#D49A73]/10 flex items-center justify-center text-2xl">✨</div>
                    </div>

                    <div class="mt-6">
                        <div class="text-[11px] uppercase tracking-widest font-bold text-[#A2B5A8]">Variasi</div>
                        <p class="text-xs text-gray-400 mt-3">Harga mengikuti foto yang Anda klik.</p>
                    </div>


                    <div class="mt-6">
                        <a href="https://wa.me/628123456789?text=Halo%20DouBlossom,%20saya%20tertarik%20untuk%20memesan%20{{ urlencode($product->name) }}" target="_blank" class="block w-full text-center bg-[#28362E] hover:bg-[#3E5246] text-white font-bold text-[10px] tracking-widest uppercase px-6 py-4 rounded-xl transition shadow-sm">
                            Chat untuk Pemesanan
                        </a>
                    </div>

                    <div class="mt-4">
                        <a href="/" class="block w-full text-center border border-[#EFE5D8]/60 bg-[#FAF8F5] hover:bg-white text-[#28362E] font-bold text-[10px] tracking-widest uppercase px-6 py-4 rounded-xl transition">
                            Kembali ke Katalog
                        </a>
                    </div>
                </div>
            </aside>
        </div>
    </main>

</body>
</html>

