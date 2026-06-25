<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Lawyer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'specialty' => 'nullable|string', // if provided, they register as a lawyer
        ]);

        $role = 'user';
        if ($request->filled('specialty')) {
            $role = 'lawyer';
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'phone' => $request->phone,
            'address' => $request->address,
            'is_premium' => ($role === 'lawyer'), // lawyers are premium
        ]);

        if ($role === 'lawyer') {
            // Create corresponding lawyer profile
            $specialty = $request->specialty;
            
            // Map specialty to arabic representation and key
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

            Lawyer::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'initial' => mb_substr($user->name, 0, 1, 'utf-8'),
                'field' => $specialty,
                'field_key' => $fieldKey,
                'city' => $request->address ?? 'الدار البيضاء',
                'rating' => 5,
                'reviews' => 0,
                'tags' => [$specialty],
                'price' => 400, // Default price
                'available' => true,
                'avatar_color' => '#' . substr(md5($user->name), 0, 6),
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'بيانات الاعتماد غير صحيحة.'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->role === 'lawyer') {
            $user->load('lawyer');
        }

        return response()->json([
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        
        // Include lawyer profile if user is a lawyer
        if ($user->role === 'lawyer') {
            $user->load('lawyer');
        }

        return response()->json([
            'user' => $user
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'price' => 'nullable|integer',
            'field' => 'nullable|string',
        ]);

        $data = $request->only(['name', 'phone', 'address']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        if ($user->role === 'lawyer' && $user->lawyer) {
            $lawyerData = [
                'name' => $user->name,
                'city' => $user->address ?? $user->lawyer->city,
            ];

            if ($request->filled('price')) {
                $lawyerData['price'] = $request->price;
            }

            if ($request->filled('field')) {
                $specialty = $request->field;
                $lawyerData['field'] = $specialty;
                
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
                $lawyerData['field_key'] = $fieldKey;
            }

            $user->lawyer->update($lawyerData);
        }

        return response()->json([
            'message' => 'تم تحديث الملف الشخصي بنجاح.',
            'user' => $user->fresh($user->role === 'lawyer' ? ['lawyer'] : [])
        ]);
    }
}
