<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
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

    /**
     * Get contacts list based on accepted follow relationships.
     */
    public function getContacts(Request $request)
    {
        $user = $request->user();

        // Fetch users where follows.status = 'accepted'
        $followedIds = \DB::table('follows')
            ->where('follower_id', $user->id)
            ->where('status', 'accepted')
            ->pluck('following_id')
            ->toArray();

        $followerIds = \DB::table('follows')
            ->where('following_id', $user->id)
            ->where('status', 'accepted')
            ->pluck('follower_id')
            ->toArray();

        // Fetch contacts based on confirmed appointments (backfills any missing follows)
        $appointmentContactIds = [];
        if ($user->role === 'lawyer') {
            $lawyer = \App\Models\Lawyer::where('user_id', $user->id)->first();
            if ($lawyer) {
                $appointmentContactIds = \App\Models\Appointment::where('lawyer_id', $lawyer->id)
                    ->where('status', 'confirmed')
                    ->pluck('user_id')
                    ->toArray();
            }
        } else {
            $lawyerIds = \App\Models\Appointment::where('user_id', $user->id)
                ->where('status', 'confirmed')
                ->pluck('lawyer_id')
                ->toArray();
            if (!empty($lawyerIds)) {
                $appointmentContactIds = \App\Models\Lawyer::whereIn('id', $lawyerIds)
                    ->pluck('user_id')
                    ->toArray();
            }
        }

        $contactIds = array_unique(array_merge($followedIds, $followerIds, $appointmentContactIds));
        $contactIds = array_filter($contactIds, fn($id) => $id != $user->id);

        $contacts = User::whereIn('id', $contactIds)
            ->with('lawyer')
            ->get();

        $contactsData = $contacts->map(function($contact) use ($user) {
            $unreadCount = Message::where('sender_id', $contact->id)
                ->where('receiver_id', $user->id)
                ->whereNull('read_at')
                ->count();

            $lastMessage = Message::where(function($q) use ($user, $contact) {
                $q->where('sender_id', $user->id)->where('receiver_id', $contact->id);
            })->orWhere(function($q) use ($user, $contact) {
                $q->where('sender_id', $contact->id)->where('receiver_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->first();

            return [
                'id' => $contact->id,
                'user_id' => $contact->id, // map for compatibility
                'name' => $contact->name,
                'email' => $contact->email,
                'avatar' => $contact->avatar,
                'role' => $contact->role,
                'lawyer' => $contact->lawyer,
                'unread_count' => $unreadCount,
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'is_file' => $lastMessage->is_file,
                    'created_at' => $lastMessage->created_at,
                    'sender_id' => $lastMessage->sender_id,
                    'read_at' => $lastMessage->read_at,
                ] : null,
            ];
        });

        return response()->json($contactsData);
    }

    /**
     * Get chat messages between auth user and a contact.
     */
    public function getMessages(Request $request)
    {
        $request->validate([
            'contact_id' => 'required|exists:users,id'
        ]);

        $user = $request->user();
        $contactId = $request->input('contact_id');

        // Fetch conversation history
        $messages = Message::where(function($q) use ($user, $contactId) {
            $q->where('sender_id', $user->id)
              ->where('receiver_id', $contactId);
        })->orWhere(function($q) use ($user, $contactId) {
            $q->where('sender_id', $contactId)
              ->where('receiver_id', $user->id);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json($messages);
    }

    /**
     * Send a direct message.
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required_without:file|string|nullable',
            'file' => 'nullable|file|max:10240', // max 10MB
        ]);

        $user = $request->user();
        $receiverId = $request->receiver_id;
        $messageContent = $request->message;

        // Enforce follow check: A follows B (accepted) OR B follows A (accepted)
        $hasRelationship = \DB::table('follows')
            ->where(function($q) use ($user, $receiverId) {
                $q->where('follower_id', $user->id)
                  ->where('following_id', $receiverId)
                  ->where('status', 'accepted');
            })
            ->orWhere(function($q) use ($user, $receiverId) {
                $q->where('follower_id', $receiverId)
                  ->where('following_id', $user->id)
                  ->where('status', 'accepted');
            })
            ->exists();

        $hasAppointment = false;
        if (!$hasRelationship) {
            // Check if there is a confirmed appointment between the two users
            $userA = $user;
            $userB = \App\Models\User::find($receiverId);
            if ($userB) {
                $lawyerUser = null;
                $clientUser = null;
                
                if ($userA->role === 'lawyer') {
                    $lawyerUser = $userA;
                    $clientUser = $userB;
                } else if ($userB->role === 'lawyer') {
                    $lawyerUser = $userB;
                    $clientUser = $userA;
                }
                
                if ($lawyerUser && $clientUser) {
                    $lawyer = \App\Models\Lawyer::where('user_id', $lawyerUser->id)->first();
                    if ($lawyer) {
                        $hasAppointment = \App\Models\Appointment::where('user_id', $clientUser->id)
                            ->where('lawyer_id', $lawyer->id)
                            ->where('status', 'confirmed')
                            ->exists();
                    }
                }
            }
        }

        if (!$hasRelationship && !$hasAppointment) {
            return response()->json(['message' => 'لا يمكنك مراسلة هذا المستخدم إلا بعد قبول طلب المتابعة أو تأكيد الموعد.'], 403);
        }

        $isFile = false;
        $filePath = null;
        $fileName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $path = $file->store('uploads', 'public');
            $filePath = Storage::url($path);
            $isFile = true;
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message' => $messageContent,
            'is_file' => $isFile,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'read_at' => null,
        ]);

        // Broadcast Message to Socket.IO
        $this->broadcastSocketEvent('message', $message);

        // Also record a notification for the receiver if they are offline / for count badges
        Notification::create([
            'user_id' => $receiverId,
            'sender_id' => $user->id,
            'type' => 'message',
            'data' => [
                'message_id' => $message->id,
                'snippet' => $isFile ? 'أرسل ملفاً: ' . $fileName : substr($messageContent, 0, 50),
            ]
        ]);

        return response()->json($message, 201);
    }

    /**
     * Mark messages from a contact as read (Seen).
     */
    public function markAsSeen(Request $request)
    {
        $request->validate([
            'contact_id' => 'required|exists:users,id'
        ]);

        $user = $request->user();
        $contactId = $request->contact_id;

        Message::where('sender_id', $contactId)
            ->where('receiver_id', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now()
            ]);

        // Broadcast Seen receipt via Socket.IO
        $this->broadcastSocketEvent('message_seen', [
            'sender_id' => $contactId, // who sent the messages
            'receiver_id' => $user->id, // who saw them
        ]);

        // Delete notifications of type 'message' from this sender
        Notification::where('user_id', $user->id)
            ->where('sender_id', $contactId)
            ->where('type', 'message')
            ->delete();

        return response()->json(['message' => 'تم تحديد الرسائل كمقروءة.']);
    }

    /**
     * Direct file upload support.
     */
    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path = $file->store('uploads', 'public');
        $filePath = Storage::url($path);

        return response()->json([
            'message' => 'تم رفع الملف بنجاح.',
            'file_name' => $fileName,
            'file_path' => $filePath,
        ]);
    }
}
