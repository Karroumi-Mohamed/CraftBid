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
        Schema::create('artisans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete(); // Ensure one user has one artisan profile
            $table->string('business_name');
            $table->string('speciality');
            $table->string('location');
            $table->text('bio'); // Using text for potentially longer bios
            $table->decimal('rating', 3, 1)->nullable(); // e.g., 4.5, allows null if no ratings yet
            $table->string('image')->nullable(); // Path to main profile image
            $table->json('social_media_links')->nullable();
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->enum('id_verification_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('id_verified_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('artisans');
    }
};
