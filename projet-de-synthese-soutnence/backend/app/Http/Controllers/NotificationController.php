<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of the notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Fetch notifications with the sender details (avatar, name)
        $notifications = Notification::where('user_id', $user->id)
            ->with(['sender' => function($q) {
                $q->select('id', 'name', 'avatar', 'role');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markRead($id, Request $request)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update([
            'read_at' => now()
        ]);

        return response()->json([
            'message' => 'تم تحديد التنبيه كمقروء.',
            'notification' => $notification
        ]);
    }

    /**
     * Mark all notifications for the authenticated user as read.
     */
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'تم تحديد جميع التنبيهات كمقروءة.'
        ]);
    }

    /**
     * Delete a specific notification.
     */
    public function destroy($id, Request $request)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'message' => 'تم حذف التنبيه بنجاح.'
        ]);
    }
}
