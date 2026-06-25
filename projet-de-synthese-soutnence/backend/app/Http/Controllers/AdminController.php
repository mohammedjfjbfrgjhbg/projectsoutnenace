<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Lawyer;
use App\Mail\LawyerApproved;
use App\Mail\LawyerRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'total_pending' => Lawyer::where('verification_status', 'pending_review')->count(),
            'total_approved' => Lawyer::where('verification_status', 'approved')->count(),
            'total_rejected' => Lawyer::where('verification_status', 'rejected')->count(),
        ];

        return response()->json($stats);
    }

    public function pendingLawyers(Request $request)
    {
        $status = $request->query('status', 'pending_review');
        
        $lawyers = Lawyer::with('user')
            ->where('verification_status', $status)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($lawyers);
    }

    public function showLawyer($id)
    {
        $lawyer = Lawyer::with('user')->findOrFail($id);

        // Prepend storage paths
        $lawyer->cin_front_url = asset('storage/' . $lawyer->cin_front);
        $lawyer->cin_back_url = asset('storage/' . $lawyer->cin_back);
        $lawyer->selfie_url = asset('storage/' . $lawyer->selfie);
        $lawyer->professional_doc_url = asset('storage/' . $lawyer->professional_doc);

        return response()->json($lawyer);
    }

    public function approveLawyer(Request $request, $id)
    {
        $lawyer = Lawyer::findOrFail($id);
        
        $lawyer->update([
            'verification_status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);

        $user = $lawyer->user;

        try {
            Mail::to($user->email)->send(new LawyerApproved($user->name));
        } catch (\Exception $e) {
            logger()->error('Failed to send approval email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'تم قبول حساب المحامي وتفعيل وصوله للمنصة.',
            'lawyer' => $lawyer->load('user'),
        ]);
    }

    public function rejectLawyer(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $lawyer = Lawyer::findOrFail($id);
        
        $lawyer->update([
            'verification_status' => 'rejected',
            'rejection_reason' => $request->reason,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);

        $user = $lawyer->user;

        try {
            Mail::to($user->email)->send(new LawyerRejected($user->name, $request->reason));
        } catch (\Exception $e) {
            logger()->error('Failed to send rejection email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'تم رفض طلب المحامي وإرسال بريد إلكتروني بالسبب.',
            'lawyer' => $lawyer->load('user'),
        ]);
    }
}
