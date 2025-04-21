<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request) {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|string|in:buyer,artisan',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => bcrypt($fields['password']),
        ]);

        $user->assignRole($fields['role']);


        //TODO
        // $user->createWallet();

        return response([
            'user' => $user,
        ], 201);
    }
    public function login(Request $request) {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);


        if (!Auth::attempt($fields)) {
            return response([
                'message' => 'Invalid credentials'
            ], 401);
        }


        $user = Auth::user();
        $request->session()->regenerate();
        return response([
            'user' => $user,
        ], 200);

    }
}
