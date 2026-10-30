<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DouBlossom Admin — Atur Promosi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-[#F8F9FA] text-[#2D3748]" style="font-family: 'Plus Jakarta Sans', sans-serif;">

    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <div class="w-64 bg-[#28362E] text-white p-6 space-y-6 flex-shrink-0">
            <h1 class="text-xl font-bold tracking-tight border-b border-white/10 pb-4">DouBlossom Admin</h1>
            <nav class="space-y-2">
                <a href="{{ route('admin.products.index') }}" class="block py-2.5 px-4 rounded-xl text-gray-300 hover:bg-white/5 transition">
                    🌸 Kelola Produk
                </a>
                <a href="{{ route('admin.settings.index') }}" class="block py-2.5 px-4 rounded-xl bg-[#D49A73] text-white font-semibold transition shadow-sm">
                    ⚙️ Atur Promosi
                </a>
                <a href="/" target="_blank" class="block py-2.5 px-4 rounded-xl text-gray-300 hover:bg-white/5 transition">
                    🌐 Lihat Toko Anda
                </a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-y-auto">
            <header class="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center flex-shrink-0">
                <h2 class="text-xl font-bold text-gray-800">Pengaturan Promosi Toko</h2>
            </header>

            <main class="p-8 max-w-3xl">
                @if(session('success'))
                    <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2 shadow-sm">
                        <span>✨</span> {{ session('success') }}
                    </div>
                @endif

                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <!-- Form Pengaturan Mengarah ke Proses Update -->
                    <form action="{{ route('admin.settings.update') }}" method="POST" enctype="multipart/form-data" class="space-y-6">
                        @csrf
                        @method('PUT')

                        <!-- 1. INPUT TEKS FLASH SALE -->
                        <div>
                            <label class="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Teks Berjalan Flash Sale</label>
                            <input type="text" name="flash_sale_text" value="{{ $flashSaleText ?? '' }}" placeholder="Contoh: Flash Sale Spesial Hari Ini! Diskon Berkah Hingga 50%..." class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm focus:outline-none focus:border-[#D49A73] transition">
                        </div>

                        <!-- 2. INPUT HITUNG MUNDUR -->
                        <div>
                            <label class="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Waktu Berakhir Flash Sale (Hitung Mundur)</label>
                            <input type="datetime-local" name="flash_sale_end" value="{{ $flashSaleEnd ?? '' }}" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm focus:outline-none focus:border-[#D49A73] transition">
                            <p class="text-xs text-gray-400 mt-1.5">*Angka timer di halaman depan akan otomatis menghitung mundur berjalan sampai tanggal dan jam yang Anda tentukan di sini.</p>
                        </div>

                        <!-- 3. INPUT MULTI-FOTO BANNER BORDER -->
                        <div>
                            <label class="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Upload Banner Promosi / Slide Gambar (Bisa lebih dari 2)</label>
                            <input type="file" name="promo_borders[]" multiple accept="image/*" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm focus:outline-none text-gray-400">
                            <p class="text-xs text-gray-400 mt-1.5">Banner yang Anda upload akan <span class="font-semibold">ditambahkan</span> ke banner yang sudah ada.</p>

                            @if(!empty($promoBorders))
                                <div class="mt-5">
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Preview Banner Tersimpan ({{ count($promoBorders) }})</span>
                                        <span class="text-[10px] text-gray-400">Anda bisa hapus banner per slide</span>
                                    </div>

                                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        @foreach($promoBorders as $img)
                                            <div class="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white group">
                                                <div class="h-16 sm:h-20">
                                                    <img src="{{ asset('storage/' . $img) }}" class="w-full h-full object-cover" alt="Banner Promosi">
                                                </div>

                                                <div class="absolute inset-x-0 bottom-0 bg-black/35 backdrop-blur-sm text-white px-2 py-2">
                                                    <div class="flex items-center justify-between gap-2">
                                                        <span class="text-[10px] font-semibold">Slide</span>

                                                        <form action="{{ route('admin.settings.banner_delete') }}" method="POST" onsubmit="return confirm('Hapus banner ini?')">
                                                            @csrf
                                                            <input type="hidden" name="path" value="{{ $img }}">
                                                            <button type="submit" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/90 hover:bg-red-500 text-white transition">
                                                                Hapus
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @endif
                        </div>

                        <hr class="border-gray-100 my-2">

                        <!-- BUTTON SUBMIT -->
                        <div class="flex justify-end">
                            <button type="submit" class="bg-[#28362E] hover:bg-[#3E5246] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition">
                                💾 Simpan Semua Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    </div>

</body>
</html>