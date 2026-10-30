<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DouBlossom Admin — Dashboard Galeri</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-[#F8F9FA] text-[#2D3748]" style="font-family: 'Plus Jakarta Sans', sans-serif;">

    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <div class="w-64 bg-[#28362E] text-white p-6 space-y-6 flex-shrink-0">
            <h1 class="text-xl font-bold tracking-tight border-b border-white/10 pb-4">DouBlossom Admin</h1>
            <nav class="space-y-2">
                <!-- Menu Kelola Produk -->
                <a href="{{ route('admin.products.index') }}" class="block py-2.5 px-4 rounded-xl bg-[#D49A73] text-white font-semibold transition shadow-sm">
                    🌸 Kelola Produk
                </a>
                
                <!-- MENU BARU: Kelola Banner Promosi & Teks Berjalan -->
                <a href="{{ route('admin.settings.index') }}" class="block py-2.5 px-4 rounded-xl text-gray-300 hover:bg-white/5 transition">
                    ⚙️ Atur Promosi
                </a>
                
                <a href="/" target="_blank" class="block py-2.5 px-4 rounded-xl text-gray-300 hover:bg-white/5 transition">
                    🌐 Lihat Toko Anda
                </a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-y-auto">
            <!-- Header -->
            <header class="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center flex-shrink-0">
                <h2 class="text-xl font-bold text-gray-800">Daftar Mahakarya Produk</h2>
                <a href="{{ route('admin.products.create') }}" class="bg-[#28362E] hover:bg-[#3E5246] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition">
                    + Tambah Produk Baru
                </a>
            </header>

            <!-- Dashboard Content -->
            <main class="p-8">
                @if(session('success'))
                    <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2 shadow-sm animate-fade-in">
                        <span>✨</span> {{ session('success') }}
                    </div>
                @endif

                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th class="p-5 w-24">Foto Produk</th>
                                <th class="p-5">Nama Produk</th>
                                <th class="p-5">Kategori</th>
                                <th class="p-5">Harga</th>
                                <th class="p-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 text-sm">
                            @foreach($products as $product)
                            <tr class="hover:bg-gray-50/80 transition">
                                <td class="p-5">
                                    <div class="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
                                        <img src="{{ $product->emoji ? asset('storage/' . $product->emoji) : '' }}" 
                                             alt="{{ $product->name }}" 
                                             class="w-full h-full object-cover object-center">

                                    </div>
                                </td>
                                <td class="p-5 font-semibold text-gray-900">{{ $product->name }}</td>
                                <td class="p-5">
                                    <span class="bg-[#28362E]/5 px-3 py-1 rounded-full text-xs text-[#28362E] font-medium border border-[#28362E]/10">
                                        {{ $product->category }}
                                    </span>
                                </td>
                                <td class="p-5 font-bold text-[#D49A73]">
                                    Rp {{ number_format($product->price, 0, ',', '.') }}
                                </td>
                                <td class="p-5 text-right space-x-2">
                                    <a href="{{ route('admin.products.edit', $product->id) }}" class="inline-block text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/60 transition">
                                        Edit
                                    </a>
                                    
                                    <form action="{{ route('admin.products.destroy', $product->id) }}" method="POST" class="inline-block" onsubmit="return confirm('Apakah Anda yakin ingin menghapus mahakarya ini?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200/60 transition">
                                            Hapus
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            @endforeach

                            @if($products->isEmpty())
                            <tr>
                                <td colspan="5" class="p-16 text-center text-gray-400">
                                    <div class="text-4xl mb-2">🍃</div>
                                    <p class="text-sm font-medium text-gray-500">Belum ada produk di dalam galeri.</p>
                                    <p class="text-xs text-gray-400 mt-1">Silakan tambahkan produk baru melalui tombol di atas.</p>
                                </td>
                            </tr>
                            @endif
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    </div>

</body>
</html>