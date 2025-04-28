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
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artisan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('reserve_price', 10, 2)->default(10.00);
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('bid_increment', 10, 2)->default(1.00);
            $table->integer('bid_count')->default(0);
            $table->integer('quantity')->default(1);
            $table->boolean('anti_sniping')->default(true);
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->enum('status', ['pending', 'active', 'ended', 'cancelled'])->default('pending');
            $table->foreignId('winner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['standard', 'featured'])->default('standard');
            $table->boolean('is_visible')->default(true);
            $table->json('properties')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('end_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
