<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $request->user()->hasPermission($permission)) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        return $next($request);
    }
}
