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
        Schema::create('artisan_profile_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artisan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // The user who wrote the comment
            $table->text('comment');
            $table->unsignedTinyInteger('rating'); // Assuming a 1-5 star rating
            $table->timestamps();

            $table->index('artisan_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('artisan_profile_comments');
    }
};
