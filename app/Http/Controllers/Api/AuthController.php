<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Artisan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $fields = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'role' => 'required|string|in:buyer,artisan',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = DB::transaction(function () use ($fields, $request) {
                $newUser = User::create([
                    'name' => $fields['name'],
                    'email' => $fields['email'],
                    'password' => Hash::make($fields['password']),
                ]);

                $newUser->assignRole($fields['role']);

                Auth::login($newUser);
                $request->session()->regenerate();

                return $newUser;
            });

            $user->load('roles');

            return response()->json([
                'message' => 'Registration successful. Please check your email for a verification link.',
                'user' => $user
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(['message' => 'Login successful'], 200);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }

    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => 'Invalid verification link'
            ], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified'
            ], 200);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json([
            'message' => 'Email has been verified successfully'
        ], 200);
    }

    public function resendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified'
            ], 200);
        }

        $request->user()->sendEmailVerificationNotification();

        $request->user()->forceFill([
            'verification_email_sent_at' => now()
        ])->save();

        return response()->json([
            'message' => 'Verification link sent'
        ], 200);
    }

    public function getVerificationStatus(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->refresh();
            $user->load('roles', 'artisan');
        }

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $role = $user->roles->first()?->name ?? 'buyer';

        $emailStatus = 'not_started';
        if ($user->hasVerifiedEmail()) {
            $emailStatus = 'completed';
        } elseif ($user->verification_email_sent_at) {
            $emailStatus = 'sent';
        }

        $idStatus = null;
        if ($role === 'artisan' && $user->artisan) {
            $idStatus = $user->artisan->id_verification_status ?? 'not_started';
        }

        $hasArtisanProfile = $role === 'artisan' ? !is_null($user->artisan) : null;

        Log::info("GetVerificationStatus Check:", [
            'user_id' => $user->id,
            'role' => $role,
            'email_status' => $emailStatus,
            'has_artisan_profile' => $hasArtisanProfile,
            'fetched_id_status' => $idStatus
        ]);

        return response()->json([
            'role' => $role,
            'emailStatus' => $emailStatus,
            'idStatus' => $idStatus,
            'hasArtisanProfile' => $hasArtisanProfile,
        ]);
    }
}
