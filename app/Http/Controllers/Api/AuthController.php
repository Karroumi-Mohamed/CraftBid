<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request) {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|string|in:buyer,artisan',
            'password' => 'required|string|min:8|confirmed',
        ]);

        User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'role' => $fields['role'],
            'password' => bcrypt($fields['password']),
        ]);
    }
    public function login() {}
}
