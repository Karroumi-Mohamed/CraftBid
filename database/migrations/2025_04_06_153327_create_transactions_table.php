<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['deposit', 'withdrawal', 'payment', 'refund', 'bid_hold', 'bid_release']);
            $table->text('description')->nullable();
            $table->foreignId('auction_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference_code')->nullable()->unique(); // Unique reference if needed
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->softDeletes();
            $table->timestamps();

            $table->index('wallet_id');
            $table->index('type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
