<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public API routes
Route::post('/register', [AuthController::class, 'register']);

// Login route
Route::post('/login', [AuthController::class, 'login'])
    ->name('login');

// CSRF token route for SPA authentication
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Email verification - verify route (public, but secured with signed middleware)
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// Authenticated API routes (using Sanctum middleware)
Route::middleware('auth:sanctum')->group(function () {
    // Route to get the current user's basic info (no longer requires email verification here)
    Route::get('/user', function (Request $request) {
        return $request->user()->load('roles'); // Keep loading roles
    });

    // Route to get detailed verification status
    Route::get('/user/verification-status', [AuthController::class, 'getVerificationStatus'])
        ->name('user.verification.status');

    // Logout route
    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');

    // Resend email verification notification (still needs auth, but not verification)
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');

    // Add other authenticated API routes here...
    // e.g., Route::apiResource('/products', ProductController::class);
});
