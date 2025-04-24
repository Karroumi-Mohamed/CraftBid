<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ArtisanVerificationController extends Controller
{

    public function reject(Request $request, Artisan $artisan)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $artisan->update([
            'id_verification_status' => 'rejected',
            'id_verified_at' => null,
            'verification_rejection_reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Artisan verification rejected successfully.'], 200);
    }
    public function approve(Request $request, Artisan $artisan)
    {
        $artisan->update([
            'id_verification_status' => 'confirmed',
            'id_verified_at' => now(),
            'verification_rejection_reason' => null,
        ]);

        return response()->json(['message' => 'Artisan verification approved successfully.'], 200);
    }

    public function suspend(Request $request, Artisan $artisan)
    {
        $artisan->update([
            'id_verification_status' => 'pending',
            'id_verified_at' => null,
            'verification_rejection_reason' => null,
        ]);

        return response()->json(['message' => 'Artisan verification status set to pending.'], 200);
    }

    public function pending(Request $request){
        $artisans = Artisan::where('id_verification_status', 'pending')->get();

        return response()->json($artisans, 200);
    }

    public function approved(Request $request){
        $artisans = Artisan::where('id_verification_status', 'confirmed')->get();

        return response()->json($artisans, 200);
    }

    public function rejected(Request $request){
        $artisans = Artisan::where('id_verification_status', 'rejected')->get();

        return response()->json($artisans, 200);
    }

        
}
