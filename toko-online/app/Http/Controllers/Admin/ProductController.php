<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::latest()->get();
        return view('admin.products.index', compact('products'));
    }

    private function storeImages($product, Request $request): void
    {
        if (!$request->hasFile('images')) {
            return;
        }

        $files = $request->file('images');
        $sortOrder = 0;

        foreach ($files as $file) {
            if (!$file) {
                continue;
            }

            $path = $file->store('products', 'public');

            $priceInput = $request->input('prices.' . $sortOrder);
            $imgPrice = is_numeric($priceInput) ? (int) $priceInput : 0;

            $product->images()->create([
                'path' => $path,
                'alt' => $product->name,
                'sort_order' => $sortOrder,
                'price' => $imgPrice,
            ]);

            $sortOrder++;
        }
    }

    public function create()
    {
        return view('admin.products.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'images' => 'required|array|min:1',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);


        $data = $request->except(['images']);

        // Simpan produk dulu (emoji dipakai fallback untuk foto pertama)
        $product = Product::create($data);

        // Simpan multi foto
        $this->storeImages($product, $request);

        // Isi emoji dengan foto pertama jika kosong
        if (!$product->emoji) {
            $first = $product->images()->first();
            if ($first) {
                $product->update(['emoji' => $first->path]);
            }
        }

        return redirect()->route('admin.products.index')->with('success', 'Mahakarya produk dan foto berhasil dipajang!');
    }

    public function edit(Product $product)
    {
        return view('admin.products.edit', compact('product'));
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'image_mode' => 'nullable|in:reset,add',
        ]);


        $data = $request->except(['images']);
        $product->update($data);

        $mode = $request->input('image_mode', 'add');

        // Reset: hapus semua foto lama dari product_images
        if ($mode === 'reset' && $request->hasFile('images')) {
            foreach ($product->images as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
            $product->refresh();
        }

        // Tambah foto baru
        if ($request->hasFile('images')) {
            $this->storeImages($product, $request);
        }

        // Update emoji fallback ke foto pertama
        $first = $product->images()->first();
        if ($first) {
            $product->update(['emoji' => $first->path]);
        }

        return redirect()->route('admin.products.index')->with('success', 'Karya berhasil diperbarui.');
    }

    public function destroy(Product $product)
    {
        // Hapus foto multi
        foreach ($product->images as $img) {
            Storage::disk('public')->delete($img->path);
            $img->delete();
        }

        // Hapus emoji fallback
        if ($product->emoji) {
            Storage::disk('public')->delete($product->emoji);
        }

        $product->delete();
        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil dihapus.');
    }
}