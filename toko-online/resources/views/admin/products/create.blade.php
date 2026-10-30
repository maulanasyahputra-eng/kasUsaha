<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tambah Produk — DouBlossom Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-[#F8F9FA] text-[#2D3748] p-8" style="font-family: 'Plus Jakarta Sans', sans-serif;">

    <div class="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <div class="flex justify-between items-center border-b pb-4 mb-6">
            <h2 class="text-xl font-bold text-gray-800">Tambah Mahakarya Baru</h2>
            <a href="{{ route('admin.products.index') }}" class="text-sm text-gray-500 hover:text-gray-800">← Kembali</a>
        </div>

        <form action="{{ route('admin.products.store') }}" method="POST" enctype="multipart/form-data" class="space-y-5">
            @csrf
            
            <div>
                <label class="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Nama Produk</label>
                <input type="text" name="name" required class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#D49A73]" placeholder="Contoh: Midnight Rose Bouquet">
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Kategori</label>
                    <select name="category" required class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#D49A73]">
                        <option value="Premium Bouquet">Premium Bouquet</option>
                        <option value="Luxury Hampers">Luxury Hampers</option>
                        <option value="Art Decor">Art Decor</option>
                        <option value="Custom Gift">Custom Gift</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Foto Produk (Multi)</label>
                    <input type="file" name="images[]" accept="image/*" required multiple id="imagesInput" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#28362E] file:text-white hover:file:bg-[#3E5246] focus:outline-none focus:border-[#D49A73]">
                    <p class="text-[11px] text-gray-500 mt-2">Upload minimal 1 foto.</p>

                    <div class="mt-4">
                        <label class="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Harga Per Foto</label>
                        <div id="pricesContainer" class="space-y-3"></div>
                        <p class="text-[11px] text-gray-500 mt-2">Harga sesuai urutan foto (index).</p>
                    </div>
                </div>
            </div>


            <div>
                <label class="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Harga (Rupiah)</label>
                <input type="number" name="price" required class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#D49A73]" placeholder="Contoh: 350000">
            </div>

            <div>
                <label class="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Deskripsi Mahakarya</label>
                <textarea name="description" rows="4" required class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#D49A73]" placeholder="Ceritakan keistimewaan dari susunan bunga atau isi paket hadiah ini..."></textarea>
            </div>

            <button type="submit" class="w-full bg-[#28362E] hover:bg-[#3E5246] text-white p-4 rounded-xl font-bold text-sm tracking-wide transition shadow-md">
                Pajang Karya di Galeri
            </button>
        </form>
    </div>

<script>
    (function () {
        const input = document.getElementById('imagesInput');
        const container = document.getElementById('pricesContainer');

        function renderPrices(count) {
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                container.insertAdjacentHTML('beforeend', `
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wide text-gray-600 mb-1">Harga Foto #${i+1}</label>
                        <input type="number" min="0" name="prices[${i}]" required class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#D49A73]" placeholder="Contoh: 350000">
                    </div>
                `);
            }
        }

        if (input) {
            input.addEventListener('change', function () {
                const files = input.files;
                if (!files || files.length === 0) {
                    container.innerHTML = '';
                    return;
                }
                renderPrices(files.length);
            });
        }
    })();
</script>
</body>
</html>