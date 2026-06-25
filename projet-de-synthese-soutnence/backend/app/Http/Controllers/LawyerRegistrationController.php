<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Lawyer;
use App\Mail\LawyerRegistrationReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class LawyerRegistrationController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string',
            'password' => 'required|string|min:6',
            'address' => 'required|string',
            'specialty' => 'required|string',
            'bar_number' => 'required|string',
            'bar_city' => 'required|string',
            'cin_front' => 'required|image|max:5120', // max 5MB
            'cin_back' => 'required|image|max:5120',
            'selfie' => 'required|image|max:5120',
            'professional_doc' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // max 10MB
        ]);

        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'lawyer',
            'phone' => $request->phone,
            'address' => $request->address,
            'is_premium' => true, // lawyers are premium
        ]);

        // File uploads
        $cinFrontPath = $request->file('cin_front')->store('lawyer-kyc', 'public');
        $cinBackPath = $request->file('cin_back')->store('lawyer-kyc', 'public');
        $selfiePath = $request->file('selfie')->store('lawyer-kyc', 'public');
        $professionalDocPath = $request->file('professional_doc')->store('lawyer-kyc', 'public');

        // Specialty mapping logic
        $specialty = $request->specialty;
        $fieldKey = 'الكل';
        if (str_contains($specialty, 'Famille') || str_contains($specialty, 'الأسرة')) {
            $fieldKey = 'الأسرة';
        } elseif (str_contains($specialty, 'Travail') || str_contains($specialty, 'الشغل')) {
            $fieldKey = 'الشغل';
        } elseif (str_contains($specialty, 'Affaires') || str_contains($specialty, 'الأعمال') || str_contains($specialty, 'المقاولات')) {
            $fieldKey = 'الأعمال';
        } elseif (str_contains($specialty, 'Immobilier') || str_contains($specialty, 'العقار')) {
            $fieldKey = 'العقار';
        } elseif (str_contains($specialty, 'Pénal') || str_contains($specialty, 'الجنائي')) {
            $fieldKey = 'الجنائي';
        }

        // Create lawyer profile
        $lawyer = Lawyer::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'initial' => mb_substr($user->name, 0, 1, 'utf-8'),
            'field' => $specialty,
            'field_key' => $fieldKey,
            'city' => $request->address,
            'rating' => 5,
            'reviews' => 0,
            'tags' => [$specialty],
            'price' => 400, // Default price
            'available' => true,
            'avatar_color' => '#' . substr(md5($user->name), 0, 6),
            'cin_front' => $cinFrontPath,
            'cin_back' => $cinBackPath,
            'selfie' => $selfiePath,
            'bar_number' => $request->bar_number,
            'bar_city' => $request->bar_city,
            'professional_doc' => $professionalDocPath,
            'verification_status' => 'pending_review',
        ]);

        // Send email
        try {
            Mail::to($user->email)->send(new LawyerRegistrationReceived($user->name));
        } catch (\Exception $e) {
            logger()->error('Failed to send registration email: ' . $e->getMessage());
        }

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'تم تسجيل طلبك بنجاح وهو قيد المراجعة.',
            'token' => $token,
            'user' => $user->load('lawyer'),
        ], 201);
    }
}
