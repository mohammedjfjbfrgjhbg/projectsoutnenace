<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsPremium
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_premium) {
            return response()->json([
                'message' => 'هذه الخدمة متاحة فقط للمشتركين في الباقة الممتازة (Premium).'
            ], 403);
        }

        return $next($request);
    }
}
