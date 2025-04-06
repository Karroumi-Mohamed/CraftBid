<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes (e.g., login, register - to be implemented)
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Route::post('/logout', [AuthController::class, 'logout']);

    // Add other authenticated API routes here...
    // e.g., Route::apiResource('/products', ProductController::class);
});
