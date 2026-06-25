<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    public function getPlans()
    {
        $plans = Plan::all();
        return response()->json($plans);
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id'
        ]);

        $user = $request->user();
        $plan = Plan::findOrFail($request->plan_id);

        // Update user premium status
        $user->is_premium = true;
        $user->premium_until = now()->addDays($plan->duration_days);
        $user->save();

        return response()->json([
            'message' => "تهانينا! لقد تم اشتراكك بنجاح في {$plan->name}.",
            'user' => $user
        ]);
    }
}
