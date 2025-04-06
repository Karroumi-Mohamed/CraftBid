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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('message');
            $table->string('type')->index(); // e.g., 'outbid', 'auction_won', 'auction_ending'
            $table->string('related_entity_type')->nullable(); // e.g., 'auction', 'product'
            $table->unsignedBigInteger('related_entity_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
            $table->index(['related_entity_type', 'related_entity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
