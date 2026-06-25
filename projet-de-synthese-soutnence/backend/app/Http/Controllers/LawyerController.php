<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LawyerController extends Controller
{
    public function index(Request $request)
    {
        $query = Lawyer::query();

        // Filter by search term (name, city, specialty/field)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('field', 'like', "%{$search}%");
            });
        }

        // Filter by field_key
        if ($request->filled('field_key') && $request->input('field_key') !== 'الكل') {
            $query->where('field_key', $request->input('field_key'));
        }

        $lawyers = $query->get();

        return response()->json($lawyers);
    }

    public function show($id)
    {
        $lawyer = Lawyer::with('user')->findOrFail($id);
        return response()->json($lawyer);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'field' => 'required|string',
            'field_key' => 'required|string',
            'city' => 'required|string',
            'price' => 'required|integer',
            'tags' => 'required|array',
            'avatar_color' => 'nullable|string',
        ]);

        // Create the user first
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'lawyer',
            'phone' => $request->phone ?? null,
            'address' => $request->city,
            'is_premium' => true,
        ]);

        $lawyer = Lawyer::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'initial' => mb_substr($request->name, 0, 1, 'utf-8'),
            'field' => $request->field,
            'field_key' => $request->field_key,
            'city' => $request->city,
            'rating' => 5,
            'reviews' => 0,
            'tags' => $request->tags,
            'price' => $request->price,
            'available' => true,
            'avatar_color' => $request->avatar_color ?? '#1e3a8a',
        ]);

        return response()->json([
            'message' => 'Lawyer added successfully',
            'lawyer' => $lawyer
        ], 201);
    }

    public function submitReview(Request $request, $id)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $lawyer = Lawyer::findOrFail($id);

        $reviews = $lawyer->reviews_json ?? [];
        
        $newReview = [
            'user_name' => $request->user()->name,
            'rating' => (int) $request->rating,
            'comment' => $request->comment ?? '',
            'date' => now()->toDateString(),
        ];

        $reviews[] = $newReview;
        $lawyer->reviews_json = $reviews;
        $lawyer->reviews = count($reviews);

        // Recalculate average rating
        $totalRating = array_reduce($reviews, function($carry, $item) {
            return $carry + $item['rating'];
        }, 0);
        
        $lawyer->rating = $totalRating / count($reviews);
        $lawyer->save();

        return response()->json([
            'message' => 'Review submitted successfully',
            'rating' => $lawyer->rating,
            'reviews' => $lawyer->reviews,
            'reviews_json' => $lawyer->reviews_json
        ]);
    }
}
