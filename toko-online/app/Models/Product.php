<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Daftarkan kolom yang boleh diisi secara massal
    protected $fillable = [
        'name',
        'category',
        'description',
        'price',
        'emoji'
    ];

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }
}

