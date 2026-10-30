<?php

use App\Models\Product;
use App\Models\Setting; // Ditambahkan agar rute utama bisa membaca database setting
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController; // Ditambahkan untuk panel setting
use App\Http\Controllers\ProductControllerPublic;

// 0. Halaman Detail Produk (Publik)
Route::get('/produk/{product}', [ProductControllerPublic::class, 'show'])
    ->name('products.show');

// 1. Halaman Utama Pembeli (Ditingkatkan untuk Flash Sale, Hitung Mundur & Border Promo)
Route::get('/', function () {
    $products = Product::all();
    
    // Mengambil teks flash sale atau teks default jika belum diatur di admin
    $flashSaleText = Setting::where('key', 'flash_sale_text')->first()?->value ?? '✨ Nikmati Gratis Premium Card & Bebas Ongkir se-Kota Khusus Pemesanan Hari Ini!';
    
    // AMBIL DATA TARGET WAKTU HITUNG MUNDUR (DIATUR DARI ADMIN)
    $flashSaleEnd = Setting::where('key', 'flash_sale_end')->first()?->value;
    
    // Mengambil array foto-foto promosi border banner
    $promoBorders = Setting::where('key', 'promo_borders')->first()?->value;
    $promoBorders = $promoBorders ? json_decode($promoBorders, true) : [];

    // Variabel $flashSaleEnd sekarang ikut dikirim ke halaman welcome
    return view('welcome', compact('products', 'flashSaleText', 'flashSaleEnd', 'promoBorders'));
});

// 2. Dashboard Bawaan Breeze
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// 3. Panel Admin CRUD DouBlossom Gallery (Dilindungi Autentikasi Login)
Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        // --- RUTE UNTUK KELOLA PRODUK ---
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
        Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');

        // --- RUTE BARU: UNTUK PENGATURAN PROMOSI & BANNER ---
        Route::get('/settings', [AdminSettingController::class, 'index'])->name('settings.index');

        // Diubah menjadi PUT agar sesuai dengan @method('PUT') pada form setting admin Anda
        Route::put('/settings', [AdminSettingController::class, 'update'])->name('settings.update');

        // Hapus banner promosi (per slide)
        Route::post('/settings/banner/delete', [AdminSettingController::class, 'banner_delete'])->name('settings.banner_delete');
    });

// 4. Fitur Pengaturan Profil Admin (Bawaan Laravel Breeze)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';