<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Artisan;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Exception;

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

                Wallet::create(['user_id' => $newUser->id]);

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


    public function redirectToGoogle()
    { 
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://127.0.0.1:5173'));
        $successRedirect = $frontendUrl . '/dashboard';
        $failureRedirect = $frontendUrl . '/login?error=google_failed'; 

        try {
            $googleUser = Socialite::driver('google')->stateless()->user(); 
            
            Log::info('Google User Data Received:', [
                'id' => $googleUser->getId(),
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'avatar' => $googleUser->getAvatar(),
                'token' => $googleUser->token,
                'all_user_data' => (array) $googleUser 
            ]);
            
            $user = DB::transaction(function () use ($googleUser) {
                $existingUser = User::where('google_id', $googleUser->getId())->first();

                if ($existingUser) {
                    return $existingUser;
                } else {
                    $userWithEmail = User::where('email', $googleUser->getEmail())->first();
                    if($userWithEmail) {
                        $userWithEmail->update([
                             'google_id' => $googleUser->getId(),
                             'avatar' => $googleUser->getAvatar(),
                             'email_verified_at' => $userWithEmail->email_verified_at ?? now(),
                         ]);
                        return $userWithEmail;
                    }

                    $newUser = User::create([
                        'name' => $googleUser->getName(),
                        'email' => $googleUser->getEmail(),
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                        'password' => null,
                        'email_verified_at' => now(),
                    ]);

                    Wallet::create(['user_id' => $newUser->id]);

                    $newUser->assignRole('buyer'); 
                    
                    event(new Registered($newUser));

                    return $newUser;
                }
            });

            Auth::login($user, true);
            $request->session()->regenerate();

            Log::info('User logged in successfully via Google.', ['user_id' => $user->id]);
            return redirect()->intended($successRedirect);

        } catch (Exception $e) {
            Log::error('Google authentication failed.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect($failureRedirect);
        }
    }
}
