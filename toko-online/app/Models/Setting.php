<?php

namespace App\Models; // Pastikan ini benar

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value']; // Jangan lupa tambahkan fillable sesuai error sebelumnya
}