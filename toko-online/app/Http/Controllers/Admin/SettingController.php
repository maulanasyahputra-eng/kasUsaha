<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index() {
        $flashSaleText = Setting::where('key', 'flash_sale_text')->first()?->value;
        $flashSaleEnd = Setting::where('key', 'flash_sale_end')->first()?->value;
        
        $promoBorders = Setting::where('key', 'promo_borders')->first()?->value;
        $promoBorders = $promoBorders ? json_decode($promoBorders, true) : [];
        
        return view('admin.settings.index', compact('flashSaleText', 'flashSaleEnd', 'promoBorders'));
    }

    public function update(Request $request) {
        $validated = $request->validate([
            'flash_sale_text' => ['nullable', 'string', 'max:255'],
            'flash_sale_end' => ['nullable', 'date'],
            'promo_borders.*' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ], [
            'promo_borders.*.image' => 'File banner harus berupa gambar.',
            'promo_borders.*.mimes' => 'Format gambar banner tidak didukung (izin: jpg, jpeg, png, webp).',
            'promo_borders.*.max' => 'Ukuran gambar banner maksimal 5MB.',
        ]);

        // 1. Simpan Teks Flash Sale
        Setting::updateOrCreate(
            ['key' => 'flash_sale_text'],
            ['value' => $validated['flash_sale_text'] ?? '']
        );

        // 2. Simpan Waktu Berakhir Hitung Mundur
        Setting::updateOrCreate(
            ['key' => 'flash_sale_end'],
            ['value' => $validated['flash_sale_end'] ?? '']
        );

        // 3. Simpan Multi-Foto Banner (MERGE: banner lama tetap ada)
        $existing = Setting::where('key', 'promo_borders')->first()?->value;
        $existingImages = $existing ? json_decode($existing, true) : [];
        if (!is_array($existingImages)) {
            $existingImages = [];
        }

        if ($request->hasFile('promo_borders')) {
            $uploadedImages = [];
            foreach ((array) $request->file('promo_borders') as $file) {
                if (!$file) continue;
                $path = $file->store('promo', 'public');
                $uploadedImages[] = $path;
            }

            $merged = array_values(array_unique(array_merge($existingImages, $uploadedImages)));

            Setting::updateOrCreate(
                ['key' => 'promo_borders'],
                ['value' => json_encode($merged)]
            );
        }

        return redirect()->back()->with('success', 'Pengaturan promosi berhasil disimpan!');
    }

    public function banner_delete(Request $request) {
        $path = $request->input('path');

        if (!$path) {
            return redirect()->back()->with('success', 'Tidak ada banner yang dipilih.');
        }

        $existing = Setting::where('key', 'promo_borders')->first()?->value;
        $existingImages = $existing ? json_decode($existing, true) : [];
        if (!is_array($existingImages)) {
            $existingImages = [];
        }

        $existingImages = array_values(array_filter($existingImages, function ($img) use ($path) {
            return $img !== $path;
        }));

        // hapus file fisiknya jika ada
        try {
            Storage::disk('public')->delete($path);
        } catch (\Throwable $e) {
            // ignore
        }

        Setting::updateOrCreate(
            ['key' => 'promo_borders'],
            ['value' => json_encode($existingImages)]
        );

        return redirect()->back()->with('success', 'Banner berhasil dihapus!');
    }
}

