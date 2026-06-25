<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Follow;
use App\Models\Post;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
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
     * Get profile details for a user.
     */
    public function show($id, Request $request)
    {
        $user = User::with('lawyer')->findOrFail($id);
        $authUserId = $request->user()->id;

        // Statistics (accepted follows)
        $postsCount = Post::where('user_id', $id)->count();
        $followersCount = $user->followers()->count();
        $followingCount = $user->following()->count();

        // Check if current user follows this profile (could be pending or accepted)
        $followRecord = Follow::where('follower_id', $authUserId)
            ->where('following_id', $id)
            ->first();

        $isFollowing = $followRecord && $followRecord->status === 'accepted';
        $followStatus = $followRecord ? $followRecord->status : null;

        // Fetch posts by this user
        $posts = Post::where('user_id', $id)
            ->withCount(['likes', 'comments'])
            ->orderBy('created_at', 'desc')
            ->get();

        $formattedPosts = $posts->map(function ($post) {
            return [
                'id' => $post->id,
                'content' => $post->content,
                'images' => $post->images ?? [],
                'likes_count' => $post->likes_count,
                'comments_count' => $post->comments_count,
                'created_at' => $post->created_at,
            ];
        });

        // If self, we can return pending follow requests
        $pendingRequests = [];
        if ($authUserId == $id) {
            $pendingRequests = User::whereIn('id', function($query) use ($authUserId) {
                $query->select('follower_id')
                    ->from('follows')
                    ->where('following_id', $authUserId)
                    ->where('status', 'pending');
            })->get(['id', 'name', 'avatar', 'role']);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'address' => $user->address,
                'bio' => $user->bio,
                'website' => $user->website,
                'avatar' => $user->avatar,
                'lawyer' => $user->lawyer,
            ],
            'stats' => [
                'posts_count' => $postsCount,
                'followers_count' => $followersCount,
                'following_count' => $followingCount,
            ],
            'is_following' => $isFollowing,
            'follow_status' => $followStatus,
            'posts' => $formattedPosts,
            'pending_requests' => $pendingRequests,
        ]);
    }

    /**
     * Toggle follow/unfollow on a user.
     */
    public function toggleFollow($id, Request $request)
    {
        $authUser = $request->user();
        $authUserId = $authUser->id;

        if ($authUserId == $id) {
            return response()->json(['message' => 'لا يمكنك متابعة نفسك.'], 400);
        }

        $userToFollow = User::findOrFail($id);

        $existing = Follow::where('follower_id', $authUserId)
            ->where('following_id', $id)
            ->first();

        if ($existing) {
            $existing->delete();
            
            // Delete associated notification
            Notification::where('user_id', $id)
                ->where('sender_id', $authUserId)
                ->whereIn('type', ['follow_request', 'follow_accept'])
                ->delete();

            $isFollowing = false;
            $followStatus = null;
            $message = 'تم إلغاء المتابعة بنجاح.';
        } else {
            // Instagram: follows start as pending
            Follow::create([
                'follower_id' => $authUserId,
                'following_id' => $id,
                'status' => 'pending'
            ]);

            // Create notification in database
            $notification = Notification::create([
                'user_id' => $id,
                'sender_id' => $authUserId,
                'type' => 'follow_request',
            ]);

            // Broadcast real-time follow request notification
            $this->broadcastSocketEvent('follow_request', [
                'recipient_id' => $id,
                'sender_id' => $authUserId,
                'sender_name' => $authUser->name,
                'sender_avatar' => $authUser->avatar,
                'notification_id' => $notification->id,
                'created_at' => $notification->created_at,
            ]);

            $isFollowing = false;
            $followStatus = 'pending';
            $message = 'تم إرسال طلب المتابعة بنجاح.';
        }

        $followersCount = $userToFollow->followers()->count();

        return response()->json([
            'message' => $message,
            'is_following' => $isFollowing,
            'follow_status' => $followStatus,
            'followers_count' => $followersCount,
        ]);
    }

    /**
     * Accept a pending follow request.
     */
    public function acceptFollow($id, Request $request)
    {
        $authUser = $request->user();
        $authUserId = $authUser->id;

        $follow = Follow::where('follower_id', $id)
            ->where('following_id', $authUserId)
            ->where('status', 'pending')
            ->firstOrFail();

        $follow->update([
            'status' => 'accepted'
        ]);

        // Delete the original 'follow_request' notification
        Notification::where('user_id', $authUserId)
            ->where('sender_id', $id)
            ->where('type', 'follow_request')
            ->delete();

        // Create a 'follow_accept' notification
        $notification = Notification::create([
            'user_id' => $id,
            'sender_id' => $authUserId,
            'type' => 'follow_accept',
        ]);

        // Broadcast real-time follow accept notification
        $this->broadcastSocketEvent('follow_accept', [
            'follower_id' => $id,
            'following_id' => $authUserId,
            'following_name' => $authUser->name,
            'following_avatar' => $authUser->avatar,
            'notification_id' => $notification->id,
            'created_at' => $notification->created_at,
        ]);

        return response()->json([
            'message' => 'تم قبول طلب المتابعة.',
            'followers_count' => $authUser->followers()->count(),
        ]);
    }

    /**
     * Reject/delete a pending follow request.
     */
    public function rejectFollow($id, Request $request)
    {
        $authUserId = $request->user()->id;

        $follow = Follow::where('follower_id', $id)
            ->where('following_id', $authUserId)
            ->where('status', 'pending')
            ->firstOrFail();

        $follow->delete();

        // Delete associated follow request notifications
        Notification::where('user_id', $authUserId)
            ->where('sender_id', $id)
            ->where('type', 'follow_request')
            ->delete();

        return response()->json([
            'message' => 'تم رفض طلب المتابعة.'
        ]);
    }

    /**
     * Get list of followers.
     */
    public function getFollowers($id)
    {
        $user = User::findOrFail($id);
        $followers = $user->followers()->get(['users.id', 'users.name', 'users.avatar', 'users.role']);
        return response()->json($followers);
    }

    /**
     * Get list of following.
     */
    public function getFollowing($id)
    {
        $user = User::findOrFail($id);
        $following = $user->following()->get(['users.id', 'users.name', 'users.avatar', 'users.role']);
        return response()->json($following);
    }

    /**
     * Update current user's profile details.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'bio' => 'nullable|string|max:500',
            'website' => 'nullable|string|max:255',
            'avatar' => 'nullable|file|image|max:10240', // 10MB max
            'password' => 'nullable|string|min:6',
        ]);

        $userData = $request->only(['name', 'phone', 'address', 'bio', 'website']);

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar from storage if exists
            if ($user->avatar) {
                $oldPath = str_replace('/storage/', '', $user->avatar);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $userData['avatar'] = Storage::url($path);
        }

        $user->update($userData);

        // If lawyer, keep lawyer model synced
        if ($user->role === 'lawyer' && $user->lawyer) {
            $user->lawyer->update([
                'name' => $user->name,
                'city' => $user->address ?? $user->lawyer->city,
            ]);
        }

        return response()->json([
            'message' => 'تم تحديث الملف الشخصي بنجاح.',
            'user' => $user->fresh('lawyer'),
        ]);
    }
}
