<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Lawyer;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AppointmentController extends Controller
{
    /**
     * Broadcast an event to the Socket.IO server.
     */
    protected function broadcastSocketEvent($event, $data)
    {
        try {
            Http::post('http://localhost:3000/broadcast', [
                'event' => $event,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error("Socket broadcast failed: " . $e->getMessage());
        }
    }
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'lawyer') {
            // Find lawyer profile
            $lawyer = Lawyer::where('user_id', $user->id)->first();
            if (!$lawyer) {
                return response()->json([], 200);
            }
            // Fetch appointments booked with this lawyer, include client details
            $appointments = Appointment::where('lawyer_id', $lawyer->id)
                ->with('user')
                ->latest()
                ->get();
        } else {
            // Fetch appointments booked by this client, include lawyer details
            $appointments = Appointment::where('user_id', $user->id)
                ->with('lawyer')
                ->latest()
                ->get();
        }

        return response()->json($appointments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'lawyer_id' => 'required|exists:lawyers,id',
            'day_index' => 'required|integer',
            'day_name' => 'required|string',
            'date_string' => 'required|string',
            'time' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $lawyer = Lawyer::findOrFail($request->lawyer_id);

        $appointment = Appointment::create([
            'user_id' => $request->user()->id,
            'lawyer_id' => $request->lawyer_id,
            'day_index' => $request->day_index,
            'day_name' => $request->day_name,
            'date_string' => $request->date_string,
            'time' => $request->time,
            'status' => 'pending', // Starts as pending so the lawyer has the choice to accept or refuse
            'price' => $lawyer->price,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        // Create notification for the lawyer
        $notification = Notification::create([
            'user_id' => $lawyer->user_id, // recipient
            'sender_id' => $request->user()->id, // sender
            'type' => 'appointment_new',
            'data' => [
                'appointment_id' => $appointment->id,
                'date_string' => $appointment->date_string,
                'time' => $appointment->time,
            ]
        ]);

        // Broadcast real-time Socket event
        $this->broadcastSocketEvent('appointment_new', [
            'recipient_id' => $lawyer->user_id,
            'sender_id' => $request->user()->id,
            'sender_name' => $request->user()->name,
            'appointment_id' => $appointment->id,
            'notification_id' => $notification->id,
            'created_at' => $notification->created_at,
        ]);

        return response()->json([
            'message' => 'تم تقديم طلب حجز الموعد بنجاح وهو قيد الانتظار!',
            'appointment' => $appointment->load('lawyer')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:confirmed,cancelled,completed'
        ]);

        $user = $request->user();
        $appointment = Appointment::findOrFail($id);

        // Check permission: only the booking user or the lawyer can update the appointment
        $isLawyer = false;
        if ($user->role === 'lawyer') {
            $lawyer = Lawyer::where('user_id', $user->id)->first();
            if ($lawyer && $appointment->lawyer_id === $lawyer->id) {
                $isLawyer = true;
            }
        }

        if ($appointment->user_id !== $user->id && !$isLawyer) {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذا الموعد.'], 403);
        }

        $appointment->update([
            'status' => $request->status
        ]);

        $lawyer = \App\Models\Lawyer::find($appointment->lawyer_id);
        $lawyerUserId = $lawyer ? $lawyer->user_id : null;

        if ($request->status === 'confirmed') {
            // Automatically establish a mutual follow connection so they can chat
            $clientId = $appointment->user_id;
            if ($lawyerUserId) {
                \App\Models\Follow::updateOrCreate(
                    ['follower_id' => $clientId, 'following_id' => $lawyerUserId],
                    ['status' => 'accepted']
                );
                
                \App\Models\Follow::updateOrCreate(
                    ['follower_id' => $lawyerUserId, 'following_id' => $clientId],
                    ['status' => 'accepted']
                );
            }

            // Automatically create an associated LawyerCase
            $appointment->load('user');
            \App\Models\LawyerCase::create([
                'lawyer_id' => $appointment->lawyer_id,
                'client_id' => $appointment->user_id,
                'client_name' => $appointment->user ? $appointment->user->name : 'عميل غير مسجل',
                'case_number' => '33' . rand(100, 999),
                'case_type' => ($lawyer && $lawyer->field) ? $lawyer->field : 'قضية عامة',
                'status' => 'upcoming_session',
                'progress' => 15,
                'session_date' => $appointment->date_string . ' ' . $appointment->time,
                'notes' => 'جلسة استشارية أولية مجدولة تلقائياً.'
            ]);
        }

        if ($request->status === 'confirmed' || $request->status === 'cancelled') {
            // Determine the recipient (if lawyer updated, recipient is client; if client updated, recipient is lawyer)
            $recipientId = ($user->role === 'lawyer') ? $appointment->user_id : $lawyerUserId;

            // Create notification
            $notification = Notification::create([
                'user_id' => $recipientId,
                'sender_id' => $user->id,
                'type' => 'appointment_' . $request->status, // appointment_confirmed or appointment_cancelled
                'data' => [
                    'appointment_id' => $appointment->id,
                    'status' => $request->status,
                    'date_string' => $appointment->date_string,
                    'time' => $appointment->time,
                ]
            ]);

            // Broadcast real-time Socket event
            $this->broadcastSocketEvent('appointment_update', [
                'recipient_id' => $recipientId,
                'sender_id' => $user->id,
                'sender_name' => $user->name,
                'status' => $request->status,
                'appointment_id' => $appointment->id,
                'notification_id' => $notification->id,
                'created_at' => $notification->created_at,
            ]);
        }

        return response()->json([
            'message' => 'تم تحديث حالة الموعد بنجاح.',
            'appointment' => $appointment
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::findOrFail($id);

        $isLawyer = false;
        if ($user->role === 'lawyer') {
            $lawyer = Lawyer::where('user_id', $user->id)->first();
            if ($lawyer && $appointment->lawyer_id === $lawyer->id) {
                $isLawyer = true;
            }
        }

        if ($appointment->user_id !== $user->id && !$isLawyer) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا الموعد.'], 403);
        }

        $appointment->delete();

        return response()->json([
            'message' => 'تم حذف الموعد بنجاح.'
        ]);
    }
}
