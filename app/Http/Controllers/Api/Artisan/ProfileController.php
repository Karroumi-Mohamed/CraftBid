<?php

namespace App\Http\Controllers\Api\Artisan;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('artisan')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        try {
            $validated = $request->validate([
                'speciality' => 'required|string|max:255',
                'bio' => 'required|string|max:1000',
                'location' => 'required|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            $artisanData = [
                'business_name' => $user->name,
                'speciality' => $validated['speciality'],
                'bio' => $validated['bio'],
                'location' => $validated['location'],
            ];

            if ($request->hasFile('image')) {
                if ($user->artisan && $user->artisan->image) {
                    Storage::disk('public')->delete($user->artisan->image);
                }
                $path = $request->file('image')->store('artisan_logos', 'public');
                $artisanData['image'] = $path;
            }

            $artisanProfile = Artisan::updateOrCreate(
                ['user_id' => $user->id],
                $artisanData
            );

            return response()->json($artisanProfile, 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Artisan profile update/create failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to save artisan profile details.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function uploadIdDocuments(Request $request)
    {
        $user = $request->user();
        $artisanProfile = $user->artisan;

        if (!$user || !$user->hasRole('artisan') || !$artisanProfile) {
            return response()->json(['message' => 'Unauthorized or profile not found.'], 403);
        }

        try {
            $validated = $request->validate([
                'id_document_front' => 'required|image|mimes:jpeg,png,jpg|max:2048',
                'id_document_back' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $pathsToUpdate = [];
            $statusUpdate = [];

            if ($request->hasFile('id_document_front')) {
                if ($artisanProfile->id_document_front_path) {
                    Storage::disk('public')->delete($artisanProfile->id_document_front_path);
                }
                $frontPath = $request->file('id_document_front')->store('artisan_id_documents', 'public');
                $pathsToUpdate['id_document_front_path'] = $frontPath;
            }

            if ($request->hasFile('id_document_back')) {
                if ($artisanProfile->id_document_back_path) {
                    Storage::disk('public')->delete($artisanProfile->id_document_back_path);
                }
                $backPath = $request->file('id_document_back')->store('artisan_id_documents', 'public');
                $pathsToUpdate['id_document_back_path'] = $backPath;
            }

            if (!empty($pathsToUpdate)) {
                $statusUpdate['id_verification_status'] = 'pending';
            }

            $artisanProfile->update(array_merge($pathsToUpdate, $statusUpdate));

            return response()->json(['message' => 'ID documents uploaded successfully.', 'artisan' => $artisanProfile], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Artisan ID document upload failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to upload ID documents.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('artisan')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $artisanProfile = $user->artisan()->with('user')->first();

        if (!$artisanProfile) {
            return response()->json(['message' => 'Artisan profile not found.'], 404);
        }

        if ($artisanProfile->image) {
            $artisanProfile->image_url = Storage::disk('public')->url($artisanProfile->image);
        }
        if ($artisanProfile->id_document_front_path) {
            $artisanProfile->id_document_front_url = Storage::disk('public')->url($artisanProfile->id_document_front_path);
        }
        if ($artisanProfile->id_document_back_path) {
            $artisanProfile->id_document_back_url = Storage::disk('public')->url($artisanProfile->id_document_back_path);
        }

        return response()->json($artisanProfile);
    }
}
