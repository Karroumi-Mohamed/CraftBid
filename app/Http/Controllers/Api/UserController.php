<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Your current password does not match our records.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }
    
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $user->id,
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);
            
            $user->name = $validated['name'];
            
            if ($user->email !== $validated['email']) {
                $user->email = $validated['email'];
                $user->email_verified_at = null;
            }
            
            if ($request->hasFile('avatar')) {
                if ($user->avatar && !str_contains($user->avatar, 'http')) {
                    Storage::disk('public')->delete($user->avatar);
                }
                
                $path = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = $path;
            }
            
            $user->save();
            
            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user->load('roles')
            ]);
            
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('User profile update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update profile.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
