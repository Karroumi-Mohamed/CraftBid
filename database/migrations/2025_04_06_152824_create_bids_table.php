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
        Schema::create('bids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->boolean('is_winning')->default(false); // Flag to indicate if this is currently the highest bid
            $table->string('ip_address')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['auction_id', 'amount']); // Index for finding highest bid per auction
            $table->index(['user_id', 'auction_id']); // Index for finding user's bids on an auction
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bids');
    }
};
