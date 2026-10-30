<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DouBlossom Gallery — Premium Florist & Luxury Gifts</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; scroll-behavior: smooth; }
        .font-serif { font-family: 'Playfair Display', serif; }
        
        /* Smooth marquee animation */
        @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover { animation-play-state: paused; }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #FAF8F5; }
        ::-webkit-scrollbar-thumb { background: #DECBC0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #C48B71; }
    </style>
</head>
<body class="bg-[#FAF8F5] text-[#28362E] antialiased">

    <div class="relative bg-gradient-to-r from-[#28362E] via-[#3A4D41] to-[#28362E] border-b-4 border-[#D49A73] py-5 px-6 shadow-md text-[#F3EFE9] z-50">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            <div class="w-full md:w-1/2 overflow-hidden relative">
                <!-- LIVE badge + ticker premium -->
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <span class="relative flex h-2.5 w-2.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D49A73] opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D49A73]"></span>
                        </span>
                        <span class="text-[10px] font-extrabold tracking-widest uppercase text-[#F3EFE9]">LIVE FLASH SALE</span>
                    </div>

                    <div class="flex-1 relative">
                        <div class="animate-marquee whitespace-nowrap text-[11px] tracking-[0.16em] font-semibold uppercase relative">
                            <span class="px-4">⚡ {{ $flashSaleText }} ⚡</span>
                            <span class="px-4">⚡ {{ $flashSaleText }} ⚡</span>
                            <span class="px-4">⚡ {{ $flashSaleText }} ⚡</span>
                            <span class="px-4">⚡ {{ $flashSaleText }} ⚡</span>
                        </div>
                        <!-- gradient mask supaya rapi di pinggir -->
                        <div class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#28362E] to-transparent"></div>
                        <div class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#28362E] to-transparent"></div>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3 bg-[#FAF8F5]/10 border border-[#D49A73]/60 px-5 py-2 rounded-2xl backdrop-blur-sm shadow-inner flex-shrink-0">
                <span class="text-[10px] font-bold tracking-widest uppercase text-[#D49A73]">Countdown</span>

                <div class="flash-timer flex items-center gap-2">
                    <div class="flex flex-col items-center min-w-[42px] bg-[#28362E]/60 border border-[#D49A73]/70 rounded-xl p-1.5 shadow">
                        <span id="countdown-hours" class="font-mono text-sm font-bold tracking-wider text-white">00</span>
                        <span class="text-[7px] uppercase text-[#A2B5A8] font-bold mt-0.5">Jam</span>
                    </div>
                    <span class="font-bold text-[#D49A73]">:</span>
                    <div class="flex flex-col items-center min-w-[42px] bg-[#28362E]/60 border border-[#D49A73]/70 rounded-xl p-1.5 shadow">
                        <span id="countdown-minutes" class="font-mono text-sm font-bold tracking-wider text-white">00</span>
                        <span class="text-[7px] uppercase text-[#A2B5A8] font-bold mt-0.5">Mnt</span>
                    </div>
                    <span class="font-bold text-[#D49A73]">:</span>
                    <div class="flex flex-col items-center min-w-[42px] bg-[#28362E]/80 border border-[#D49A73] rounded-xl p-1.5 shadow">
                        <span id="countdown-seconds" class="font-mono text-sm font-bold tracking-wider text-[#D49A73]">00</span>
                        <span class="text-[7px] uppercase text-[#A2B5A8] font-bold mt-0.5">Dtk</span>
                    </div>
                </div>

                <span id="flash-state" class="ml-2 text-[10px] font-bold tracking-widest uppercase text-[#F3EFE9]/80"></span>
            </div>
        </div>

        <style>
            /* pulse saat detik terakhir */
            .counting-down { animation: countdownPulse 1s ease-in-out infinite; }
            @keyframes countdownPulse {
                0%,100% { filter: drop-shadow(0 0 0 rgba(212,154,115,0.0)); transform: translateY(0); }
                50% { filter: drop-shadow(0 0 10px rgba(212,154,115,0.55)); transform: translateY(-1px); }
            }
        </style>
    </div>

    <script>
        let adminTarget = "{{ $flashSaleEnd }}"; 
        let targetTime;

        if (adminTarget) {
            targetTime = new Date(adminTarget).getTime();
        } else {
            // Pengaman default jika admin belum mengatur tanggal
            targetTime = new Date().getTime() + (5 * 60 * 60 * 1000); 
        }

        function updateCountdown() {
            const now = new Date().getTime();
            const difference = targetTime - now;

            const flashStateEl = document.getElementById('flash-state');
            const secondsEl = document.getElementById('countdown-seconds');

            if (difference <= 0) {
                document.getElementById('countdown-hours').innerText = "00";
                document.getElementById('countdown-minutes').innerText = "00";
                document.getElementById('countdown-seconds').innerText = "00";
                if (flashStateEl) flashStateEl.innerText = "PROMO SELESAI";
                secondsEl?.classList.remove('counting-down');
                return;
            }

            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            document.getElementById('countdown-hours').innerText = hours.toString().padStart(2, '0');
            document.getElementById('countdown-minutes').innerText = minutes.toString().padStart(2, '0');
            document.getElementById('countdown-seconds').innerText = seconds.toString().padStart(2, '0');

            const totalSeconds = Math.floor(difference / 1000);
            if (flashStateEl) {
                if (totalSeconds <= 300) {
                    flashStateEl.innerText = "MENIT TERAKHIR";
                } else if (totalSeconds <= 3600) {
                    flashStateEl.innerText = "HANYA SAMPAI";
                } else {
                    flashStateEl.innerText = "MASIH BERJALAN";
                }
            }

            // animasi glow saat 5 menit terakhir
            if (totalSeconds <= 300) {
                secondsEl?.classList.add('counting-down');
            } else {
                secondsEl?.classList.remove('counting-down');
            }
        }

        setInterval(updateCountdown, 1000);
        updateCountdown();
    </script>

    <header class="sticky top-0 z-40">
        <div class="bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EFE5D8]/60">
            <div class="max-w-7xl mx-auto px-6 sm:px-12 h-20 md:h-24 flex items-center justify-between">
                <a href="#" class="group inline-flex items-center gap-2">
                    <span class="relative w-10 h-10 rounded-2xl bg-[#28362E] flex items-center justify-center shadow-sm">
                        <span class="text-[#D49A73] text-xl">🌸</span>
                        <span class="absolute inset-0 rounded-2xl border border-[#D49A73]/30"></span>
                    </span>
                    <span class="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#28362E]">
                        DouBlossom<span class="text-[#D49A73] italic font-normal">.</span>
                    </span>
                </a>

                <nav class="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase text-[#5C6E63]">
                    <a href="#promosi" class="relative hover:text-[#D49A73] transition-colors px-1">
                        Penawaran
                        <span class="absolute left-0 -bottom-2 w-full h-[2px] bg-[#D49A73] rounded-full opacity-0 group-hover:opacity-100"></span>
                    </a>
                    <a href="#koleksi" class="hover:text-[#D49A73] transition-colors">Katalog Mahakarya</a>
                    <a href="#footer" class="hover:text-[#D49A73] transition-colors">Kontak</a>
                </nav>

                <div class="flex items-center gap-3">
                    <a href="https://wa.me/628123456789" target="_blank" class="bg-[#28362E] hover:bg-[#3E5246] text-white font-bold px-5 py-3 rounded-full text-[10px] tracking-widest uppercase transition-all duration-300 shadow-sm">
                        Chat WhatsApp
                    </a>
                    <a href="#koleksi" class="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#D49A73]/10 border border-[#D49A73]/30 text-[#D49A73] hover:bg-[#D49A73]/20 transition">
                        ✨
                    </a>
                </div>
            </div>
        </div>
    </header>

    <section class="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-[#F2EFE9]/40 to-[#FAF8F5]">
        <div class="max-w-7xl mx-auto px-6 sm:px-12 grid lg:grid-cols-12 gap-12 items-center">
            <div class="lg:col-span-7 space-y-8 text-center lg:text-left">
                <span class="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-[#D49A73] bg-[#D49A73]/10 px-4 py-2 rounded-full">
                    Curated Luxury Florist &amp; Gift
                </span>
                <h1 class="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.15] text-[#28362E]">
                    Elegansi Rangkaian <br class="hidden sm:inline">
                    <span class="italic font-medium text-[#D49A73]">Bunga Abadi</span>
                </h1>
                <p class="text-[#5C6E63] text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                    Menghadirkan rangkaian bunga segar pilihan dan hampers mewah yang dikurasi khusus untuk momen paling berharga dalam hidup Anda.
                </p>
                <div class="pt-4">
                    <a href="#koleksi" class="inline-block bg-[#28362E] hover:bg-[#3E5246] text-white font-bold px-10 py-5 rounded-xl shadow-xl shadow-[#28362E]/10 transition-all text-xs tracking-widest uppercase">
                        Lihat Galeri Produk
                    </a>
                </div>
            </div>
            
            <div class="lg:col-span-5 grid grid-cols-2 gap-4">
                <div class="space-y-4">
                    <div class="bg-[#EAD8BF]/30 rounded-2xl p-8 border border-white text-center shadow-sm">
                        <span class="text-4xl block mb-2">💐</span>
                        <span class="font-serif font-bold text-[#28362E]">Bouquet</span>
                    </div>
                    <div class="bg-[#CCDCD3]/30 rounded-2xl p-8 border border-white text-center shadow-sm">
                        <span class="text-4xl block mb-2">🌿</span>
                        <span class="font-serif font-bold text-[#28362E]">Decor</span>
                    </div>
                </div>
                <div class="space-y-4 pt-8">
                    <div class="bg-[#DECBC0]/30 rounded-2xl p-8 border border-white text-center shadow-sm">
                        <span class="text-4xl block mb-2">🎁</span>
                        <span class="font-serif font-bold text-[#28362E]">Hampers</span>
                    </div>
                    <div class="bg-[#E3DDD2]/30 rounded-2xl p-8 border border-white text-center shadow-sm">
                        <span class="text-4xl block mb-2">🤍</span>
                        <span class="font-serif font-bold text-[#28362E]">Custom</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    @if(!empty($promoBorders))
    <section id="promosi" class="py-12 bg-white border-y border-[#EFE5D8]/50 shadow-inner">
        <div class="max-w-7xl mx-auto px-6 sm:px-12">
            <div class="relative overflow-hidden rounded-[2rem] shadow-2xl max-h-[450px] group">
                
                <div id="promoSlider" class="flex transition-transform duration-1000 ease-out w-full h-full">
                    @foreach($promoBorders as $borderImage)
                    <div class="w-full flex-shrink-0">
                        <img src="{{ asset('storage/' . $borderImage) }}" class="w-full h-full object-cover aspect-[21/9] lg:aspect-[3/1]" alt="Banner Promosi DouBlossom">
                    </div>
                    @endforeach
                </div>

                <button onclick="moveSlider(-1)" class="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#28362E] w-12 h-12 rounded-full flex items-center justify-center shadow-lg font-bold text-sm transition opacity-0 group-hover:opacity-100 backdrop-blur-sm">❮</button>
                <button onclick="moveSlider(1)" class="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#28362E] w-12 h-12 rounded-full flex items-center justify-center shadow-lg font-bold text-sm transition opacity-0 group-hover:opacity-100 backdrop-blur-sm">❯</button>
                
                <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    @foreach($promoBorders as $index => $banner)
                        <span class="slider-dot w-2 h-2 rounded-full bg-white/50 transition-all cursor-pointer" onclick="goToSlide({{ $index }})"></span>
                    @endforeach
                </div>
            </div>
        </div>
    </section>

    <script>


        let currentSlide = 0;
        const slides = document.querySelectorAll('#promoSlider > div');
        const sliderContainer = document.getElementById('promoSlider');
        const dots = document.querySelectorAll('.slider-dot');

        function updateSlider() {
            sliderContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((dot, idx) => {
                if(idx === currentSlide) {
                    dot.classList.add('bg-white', 'w-6');
                    dot.classList.remove('bg-white/50');
                } else {
                    dot.classList.remove('bg-white', 'w-6');
                    dot.classList.add('bg-white/50');
                }
            });
        }
        
        function moveSlider(direction) {
            if(slides.length === 0) return;
            currentSlide = (currentSlide + direction + slides.length) % slides.length;
            updateSlider();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateSlider();
        }

        if(dots.length > 0) updateSlider();
        setInterval(() => moveSlider(1), 6000);
    </script>
    @endif

    <section id="koleksi" class="py-24 max-w-7xl mx-auto px-6 sm:px-12 scroll-mt-20">
        <div class="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span class="text-[10px] text-[#D49A73] font-bold tracking-[0.25em] uppercase block">Seasonal Masterpiece</span>
            <h2 class="font-serif text-3xl sm:text-5xl font-normal text-[#28362E]">Koleksi Mahakarya Galeri</h2>
            <div class="w-16 h-[1px] bg-[#D49A73] mx-auto"></div>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
            @forelse($products as $product)
            <div class="bg-white rounded-[2rem] border border-[#EFE5D8]/50 overflow-hidden group shadow-[0_4px_30px_rgba(40,54,46,0.02)] hover:shadow-[0_20px_50px_rgba(196,139,113,0.1)] transition-all duration-500 flex flex-col">
                
                <div class="h-96 w-full relative overflow-hidden bg-[#F2EFE9] flex-shrink-0">
                    <span class="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md text-[#28362E] text-[9px] font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-[#EFE5D8]/60">
                        {{ $product->category }}
                    </span>
                    <img src="{{ asset('storage/' . $product->emoji) }}" alt="{{ $product->name }}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700">
                </div>

                <div class="p-8 flex flex-col flex-grow justify-between border-t border-[#FAF8F5]">
                    <div class="space-y-3">
                        <h3 class="font-serif text-2xl font-semibold text-[#28362E] group-hover:text-[#D49A73] transition-colors line-clamp-1">
                            {{ $product->name }}
                        </h3>
                        <p class="text-[#5C6E63] text-sm font-light leading-relaxed line-clamp-2">
                            {{ $product->description }}
                        </p>
                    </div>
                    
                    <div class="pt-6 mt-8 border-t border-[#F2EFE9]/60 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[9px] uppercase tracking-wider text-[#A2B5A8] font-bold">Mulai</span>
                            <span class="text-2xl text-[#D49A73] font-bold tracking-tight">
                                Rp {{ number_format($product->price, 0, ',', '.') }}
                            </span>
                        </div>
                    </div>

                    <!-- Detail Inline / Variasi (UI siap diperluas)
                         Catatan: saat ini model Product hanya punya 1 foto (emoji) & 1 price.
                         Bagian ini tetap rapi & siap ditambah field variasi & multi-foto jika ditambahkan di backend.
                    -->
                    <div class="mt-6">
                        <a href="{{ route('products.show', $product) }}"
                           class="block text-center w-full bg-[#28362E] hover:bg-[#3E5246] text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all duration-300 shadow-sm">
                            Lihat Detail
                        </a>

                        <div id="product-detail-{{ $product->id }}" class="hidden mt-4 rounded-2xl border border-[#EFE5D8]/60 bg-white/80 backdrop-blur-sm p-4">
                            <div class="grid sm:grid-cols-3 gap-3">
                                <div class="sm:col-span-2">
                                    <div class="text-sm font-semibold text-[#28362E]">{{ $product->name }}</div>
                                    <div class="text-xs text-[#5C6E63] mt-1 line-clamp-3">{{ $product->description }}</div>

                                    <!-- variasi harga (UI) -->
                                    <div class="mt-4">
                                        <div class="text-[10px] uppercase tracking-widest text-[#A2B5A8] font-bold">Variasi</div>
                                        <div class="mt-2 grid grid-cols-2 gap-2">
                                            <div class="rounded-xl border border-[#EFE5D8]/60 p-2 text-center bg-[#F8F4EE]">
                                                <div class="text-[10px] font-bold text-[#28362E]">Varian 1</div>
                                                <div class="text-[12px] font-semibold text-[#D49A73]">
                                                    Rp {{ number_format($product->price + 20000, 0, ',', '.') }}
                                                </div>
                                            </div>
                                            <div class="rounded-xl border border-[#EFE5D8]/60 p-2 text-center bg-[#F8F4EE]">
                                                <div class="text-[10px] font-bold text-[#28362E]">Varian 2</div>
                                                <div class="text-[12px] font-semibold text-[#D49A73]">
                                                    Rp {{ number_format($product->price + 40000, 0, ',', '.') }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- multi foto (UI) -->
                                <div class="rounded-xl overflow-hidden border border-[#EFE5D8]/60 bg-[#F2EFE9]">
                                    <div class="grid grid-cols-3 gap-1 p-1">
                                        @php
                                            $img = asset('storage/' . $product->emoji);
                                        @endphp
                                        <img src="{{ $img }}" class="w-full h-20 object-cover rounded-lg" alt="Foto 1">
                                        <img src="{{ $img }}" class="w-full h-20 object-cover rounded-lg" alt="Foto 2">
                                        <img src="{{ $img }}" class="w-full h-20 object-cover rounded-lg" alt="Foto 3">
                                        <img src="{{ $img }}" class="w-full h-20 object-cover rounded-lg" alt="Foto 4">
                                        <img src="{{ $img }}" class="w-full h-20 object-cover rounded-lg" alt="Foto 5">
                                        <img src="{{ $img }}" class="w-full h-20 object-cover rounded-lg" alt="Foto 6">
                                    </div>
                                    <div class="px-2 pb-2">
                                        <div class="text-[10px] text-gray-400">Katalog mendukung banyak foto (contoh 6 thumbnail).</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            @empty
            <div class="col-span-full text-center py-20 border border-dashed border-[#DECBC0] rounded-3xl bg-white p-8">
                <div class="text-5xl mb-4">🍃</div>
                <h3 class="font-serif text-xl text-[#28362E]">Galeri Masih Kosong</h3>
                <p class="text-xs text-[#5C6E63] mt-1">Silakan tambahkan mahakarya produk Anda melalui Panel Admin.</p>
            </div>
            @endforelse
        </div>
    </section>

    <footer id="footer" class="bg-[#28362E] text-[#F3EFE9] pt-16 pb-12 border-t border-[#EFE5D8]/10 text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-6 space-y-6 relative z-10">
            <p class="font-serif text-3xl font-bold tracking-wide">DouBlossom<span class="text-[#D49A73]">.</span></p>
            <p class="text-[#A2B5A8] text-sm max-w-md mx-auto font-light leading-relaxed">
                Ruko Gallery Blossom No. 12, Jakarta Barat. <br>
                WhatsApp: +62 812-3456-789 | Instagram: @doublossom.gallery
            </p>
            <div class="w-12 h-[1px] bg-white/10 mx-auto my-6"></div>
            <p class="text-[10px] text-[#5C6E63] uppercase tracking-[0.2em]">&copy; 2026 DouBlossom Gallery. Crafted For Perfection.</p>
        </div>
    </footer>

</body>
</html>