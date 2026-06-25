<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLawyerApproved
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === 'lawyer') {
            $lawyer = $user->lawyer;
            if (!$lawyer || $lawyer->verification_status !== 'approved') {
                $status = $lawyer ? $lawyer->verification_status : 'pending_review';
                $reason = $lawyer ? $lawyer->rejection_reason : null;
                
                return response()->json([
                    'message' => 'حسابك قيد المراجعة أو تم رفضه. يرجى الانتظار أو مراجعة المشرف.',
                    'verification_status' => $status,
                    'rejection_reason' => $reason
                ], 403);
            }
        }

        return $next($request);
    }
}
