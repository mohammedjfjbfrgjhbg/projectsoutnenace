<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use App\Models\LawyerCase;
use Illuminate\Http\Request;

class LawyerCaseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'lawyer') {
            return response()->json(['message' => 'غير مصرح لك بالوصول.'], 403);
        }

        $lawyer = Lawyer::where('user_id', $user->id)->first();
        if (!$lawyer) {
            return response()->json([], 200);
        }

        $cases = LawyerCase::where('lawyer_id', $lawyer->id)
            ->with('client')
            ->latest()
            ->get();

        return response()->json($cases);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'lawyer') {
            return response()->json(['message' => 'غير مصرح لك بالوصول.'], 403);
        }

        $lawyer = Lawyer::where('user_id', $user->id)->first();
        if (!$lawyer) {
            return response()->json(['message' => 'لم يتم العثور على ملف المحامي الخاص بك.'], 404);
        }

        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'case_number' => 'required|string|max:255',
            'case_type' => 'required|string|max:255',
            'status' => 'required|string|in:upcoming_session,under_review,completed',
            'progress' => 'required|integer|min:0|max:100',
            'session_date' => 'nullable|string',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:users,id',
        ]);

        $validated['lawyer_id'] = $lawyer->id;

        $case = LawyerCase::create($validated);

        return response()->json([
            'message' => 'تم إضافة القضية بنجاح.',
            'case' => $case->load('client')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'lawyer') {
            return response()->json(['message' => 'غير مصرح لك بالوصول.'], 403);
        }

        $lawyer = Lawyer::where('user_id', $user->id)->first();
        if (!$lawyer) {
            return response()->json(['message' => 'لم يتم العثور على ملف المحامي الخاص بك.'], 404);
        }

        $case = LawyerCase::findOrFail($id);
        if ($case->lawyer_id !== $lawyer->id) {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذه القضية.'], 403);
        }

        $validated = $request->validate([
            'client_name' => 'sometimes|required|string|max:255',
            'case_number' => 'sometimes|required|string|max:255',
            'case_type' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|string|in:upcoming_session,under_review,completed',
            'progress' => 'sometimes|required|integer|min:0|max:100',
            'session_date' => 'nullable|string',
            'notes' => 'nullable|string',
            'client_id' => 'nullable|exists:users,id',
        ]);

        $case->update($validated);

        return response()->json([
            'message' => 'تم تحديث القضية بنجاح.',
            'case' => $case->load('client')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'lawyer') {
            return response()->json(['message' => 'غير مصرح لك بالوصول.'], 403);
        }

        $lawyer = Lawyer::where('user_id', $user->id)->first();
        if (!$lawyer) {
            return response()->json(['message' => 'لم يتم العثور على ملف المحامي الخاص بك.'], 404);
        }

        $case = LawyerCase::findOrFail($id);
        if ($case->lawyer_id !== $lawyer->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذه القضية.'], 403);
        }

        $case->delete();

        return response()->json([
            'message' => 'تم حذف القضية بنجاح.'
        ]);
    }
}
