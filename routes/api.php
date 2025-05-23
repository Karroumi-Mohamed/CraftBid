<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Artisan\ProductController as ArtisanProductController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Artisan\ProfileController;
use App\Http\Controllers\Api\Artisan\DocumentController as ArtisanDocumentController;
use App\Http\Controllers\Api\Admin\ArtisanVerificationController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Artisan\AuctionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BidController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\WatchlistController;
use App\Http\Controllers\Api\Admin\WalletController as AdminWalletController;
use App\Http\Controllers\Api\Admin\FinancialReportController;
use App\Http\Controllers\Api\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Api\SettingsController as GeneralSettingsController;
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

Route::get('/auctions', [App\Http\Controllers\Api\AuctionController::class, 'index']);
Route::get('/auctions/{auction}', [App\Http\Controllers\Api\AuctionController::class, 'show']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('roles');
    });

    Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [AdminCategoryController::class, 'show'])->name('categories.show');

    Route::middleware(['role:artisan'])->prefix('artisan')->name('artisan.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::post('/profile', [ProfileController::class, 'store'])->name('profile.store');
        Route::post('/profile/upload-id', [ProfileController::class, 'uploadIdDocuments'])->name('profile.uploadId');
        Route::get('/products', [ArtisanProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ArtisanProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}', [ArtisanProductController::class, 'show'])->name('products.show');
        Route::put('/products/{product}', [ArtisanProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [ArtisanProductController::class, 'destroy'])->name('products.destroy');
        Route::patch('/products/{product}/status', [ArtisanProductController::class, 'updateStatus'])->name('products.updateStatus');
        Route::post('/products/{product}/images', [ArtisanProductController::class, 'storeImages'])->name('products.storeImages');
        Route::post('/products/{product}/images/{image}/set-primary', [ArtisanProductController::class, 'setPrimaryImage'])->name('products.setPrimaryImage');
        Route::delete('/products/{product}/images/{image}', [ArtisanProductController::class, 'deleteImage'])->name('products.deleteImage');

        Route::get('/auctions', [AuctionController::class, 'index'])->name('auctions.index');
        Route::post('/auctions', [AuctionController::class, 'store'])->name('auctions.store');
        Route::get('/auctions/{auction}', [AuctionController::class, 'show'])->name('auctions.show');
        Route::post('/auctions/{auction}/cancel', [AuctionController::class, 'cancel'])->name('auctions.cancel');
        Route::patch('/auctions/{auction}/toggle-visibility', [AuctionController::class, 'toggleVisibility'])->name('auctions.toggleVisibility');
    });

    Route::middleware(['role:admin', 'verified'])->prefix('admin')->name('admin.')->group(function () {
        Route::apiResource('categories', AdminCategoryController::class)->except(['index', 'show']);

        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
        Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        Route::patch('/products/{product}/suspend', [App\Http\Controllers\Api\Admin\ProductController::class, 'suspend'])->name('products.suspend');
        Route::patch('/products/{product}/activate', [App\Http\Controllers\Api\Admin\ProductController::class, 'activate'])->name('products.activate');
        Route::patch('/products/{product}/deactivate', [App\Http\Controllers\Api\Admin\ProductController::class, 'deactivate'])->name('products.deactivate');

        Route::apiResource('auctions', App\Http\Controllers\Api\Admin\AuctionController::class);
        Route::patch('/auctions/{auction}/toggle-featured', [App\Http\Controllers\Api\Admin\AuctionController::class, 'toggleFeatured'])->name('auctions.toggleFeatured');
        Route::patch('/auctions/{auction}/cancel', [App\Http\Controllers\Api\Admin\AuctionController::class, 'cancel'])->name('auctions.cancel');
        Route::patch('/auctions/{auction}/end', [App\Http\Controllers\Api\Admin\AuctionController::class, 'end'])->name('auctions.end');

        Route::prefix('artisans/verification')->name('artisans.verification.')->controller(ArtisanVerificationController::class)->group(function () {
            Route::get('/pending', 'pending')->name('pending');
            Route::get('/approved', 'approved')->name('approved');
            Route::get('/rejected', 'rejected')->name('rejected');
            Route::patch('/{artisan}/approve', 'approve')->name('approve');
            Route::patch('/{artisan}/reject', 'reject')->name('reject');
            Route::patch('/{artisan}/suspend', 'suspend')->name('suspend');
        });

        Route::prefix('wallet-admin')->name('wallet-admin.')->controller(AdminWalletController::class)->group(function () {
            Route::get('/withdrawals', 'indexWithdrawals')->name('withdrawals.index');
            Route::patch('/withdrawals/{withdrawalRequest}/approve', 'approveWithdrawal')->name('withdrawals.approve');
            Route::patch('/withdrawals/{withdrawalRequest}/reject', 'rejectWithdrawal')->name('withdrawals.reject');
            Route::post('/manual-deposit', 'manualDeposit')->name('manual-deposit.store');
        });

        Route::prefix('reports')->name('reports.')->controller(FinancialReportController::class)->group(function () {
            Route::get('/summary', 'getSummary')->name('summary');
            Route::get('/transactions', 'listAllTransactions')->name('transactions.index');
            Route::get('/revenue-trend', 'getRevenueTrend')->name('revenue.trend');
        });

        Route::prefix('settings')->name('settings.')->controller(AdminSettingsController::class)->group(function () {
            Route::get('/', 'getSettings')->name('index');
            Route::put('/', 'updateSettings')->name('update');
            Route::post('/update-password', 'updateAdminPassword')->name('update-password');
        });
    });

    Route::prefix('wallet')->name('wallet.')->controller(WalletController::class)->group(function () {
        Route::get('/balance', 'showBalance')->name('balance.show');
        Route::get('/transactions', 'indexTransactions')->name('transactions.index');
        Route::post('/manual-deposit', 'storeManualDeposit')->name('manual-deposit.store');
        Route::post('/withdrawal-requests', 'storeWithdrawalRequest')->middleware('role:artisan')->name('withdrawal-requests.store');
    });

    Route::get('/settings/auction-duration', [GeneralSettingsController::class, 'getAuctionDurationSettings'])->name('settings.auction-duration');
    
    Route::prefix('watchlist')->name('watchlist.')->controller(WatchlistController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::delete('/{auctionId}', 'destroy')->name('destroy');
        Route::get('/check/{auctionId}', 'check')->name('check');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/verification-status', [AuthController::class, 'getVerificationStatus'])
        ->name('user.verification.status');

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::post('/auth/resend-verification-email', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');

    Route::post('/user/change-password', [UserController::class, 'changePassword'])
        ->name('user.change-password');
        
    Route::post('/profile/update', [UserController::class, 'updateProfile'])
        ->name('profile.update');

    Route::post('/auctions/{auction}/bids', [BidController::class, 'store'])->name('bids.store');
    Route::get('/auctions/{auction}/bids', [BidController::class, 'history'])->name('bids.history');
    Route::get('/user/bids', [BidController::class, 'userHistory'])->name('bids.user-history');

    Route::get('/wallet/balance', [WalletController::class, 'showBalance'])->name('wallet.balance');
    Route::get('/wallet/transactions', [WalletController::class, 'indexTransactions'])->name('wallet.transactions');
    Route::post('/wallet/withdrawal-requests', [WalletController::class, 'storeWithdrawalRequest'])->name('wallet.withdrawalRequests.store');
    Route::post('/wallet/manual-deposit', [WalletController::class, 'storeManualDeposit'])->name('wallet.manualDeposit');

    Route::get('/bids', [BidController::class, 'getUserBids'])->name('bids.user');
    Route::get('/auctions/{auction}/bids', [BidController::class, 'history'])->name('auctions.bids');
    Route::post('/auctions/{auction}/bids', [BidController::class, 'store'])->name('auctions.bids.store');
});

Route::middleware('web')->group(function () {
    Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('google.redirect');
    
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');
});
