<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Artisan\ProductController as ArtisanProductController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Artisan\ProfileController;
use App\Http\Controllers\Api\Artisan\DocumentController as ArtisanDocumentController;
use App\Http\Controllers\Api\Admin\ArtisanVerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('roles');
    });

    Route::middleware(['role:artisan'])->prefix('artisan')->name('artisan.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::post('/profile', [ProfileController::class, 'store'])->name('profile.store');
        Route::post('/profile/upload-id', [ProfileController::class, 'uploadIdDocuments'])->name('profile.uploadId');
        Route::post('/documents', [ArtisanDocumentController::class, 'store'])->name('documents.store');
        Route::get('/products', [ArtisanProductController::class, 'index'])->name('products.index');
    });

    Route::middleware(['role:admin', 'verified'])->prefix('admin')->name('admin.')->group(function () {
        Route::apiResource('categories', AdminCategoryController::class);

        Route::prefix('artisans/verification')->name('artisans.verification.')->controller(ArtisanVerificationController::class)->group(function () {
            Route::get('/pending', 'pending')->name('pending');
            Route::get('/approved', 'approved')->name('approved');
            Route::get('/rejected', 'rejected')->name('rejected');
            Route::patch('/{artisan}/approve', 'approve')->name('approve');
            Route::patch('/{artisan}/reject', 'reject')->name('reject');
            Route::patch('/{artisan}/suspend', 'suspend')->name('suspend');
        });
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/verification-status', [AuthController::class, 'getVerificationStatus'])
        ->name('user.verification.status');

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::post('/auth/resend-verification-email', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');
});
