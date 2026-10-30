<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductControllerPublic extends Controller
{
    public function show(Product $product)
    {
        $product->load('images');
        return view('product-detail', compact('product'));
    }
}

