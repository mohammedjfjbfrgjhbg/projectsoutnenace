<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostLike;
use App\Models\Comment;
use App\Models\CommentLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Get all posts with authors, comment threads, and like counts.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $posts = Post::with([
            'user.lawyer',
            'likes',
            'comments' => function ($q) {
                // Fetch root comments only (parent_id is null)
                $q->whereNull('parent_id')
                  ->with([
                      'user.lawyer',
                      'likes',
                      'replies.user.lawyer',
                      'replies.likes'
                  ])
                  ->orderBy('created_at', 'asc');
            }
        ])
        ->withCount(['likes', 'comments'])
        ->orderBy('created_at', 'desc')
        ->get();

        // Format posts to include is_liked, likes_count, comments_count, and formatted comments
        $formattedPosts = $posts->map(function ($post) use ($userId) {
            $isLiked = $post->likes->contains('user_id', $userId);

            $formattedComments = $post->comments->map(function ($comment) use ($userId) {
                return $this->formatComment($comment, $userId);
            });

            return [
                'id' => $post->id,
                'user_id' => $post->user_id,
                'content' => $post->content,
                'images' => $post->images ?? [],
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'role' => $post->user->role,
                    'avatar' => $post->user->avatar,
                    'lawyer' => $post->user->lawyer, // Includes field, field_key, avatar_color, tags etc.
                ],
                'likes_count' => $post->likes_count,
                'comments_count' => $post->comments_count,
                'is_liked' => $isLiked,
                'comments' => $formattedComments,
            ];
        });

        return response()->json($formattedPosts);
    }

    /**
     * Create a new post.
     */
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required_without:images|string|nullable',
            'images' => 'nullable|array',
            'images.*' => 'file|image|max:10240', // max 10MB per image
        ]);

        $imageUrls = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('posts', 'public');
                $imageUrls[] = Storage::url($path);
            }
        }

        $post = Post::create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'images' => $imageUrls,
        ]);

        // Load relations for response
        $post->load(['user.lawyer', 'likes']);
        $post->likes_count = 0;
        $post->comments_count = 0;
        $post->is_liked = false;
        $post->comments = [];

        return response()->json([
            'message' => 'تم إنشاء المنشور بنجاح.',
            'post' => [
                'id' => $post->id,
                'user_id' => $post->user_id,
                'content' => $post->content,
                'images' => $post->images,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'role' => $post->user->role,
                    'avatar' => $post->user->avatar,
                    'lawyer' => $post->user->lawyer,
                ],
                'likes_count' => 0,
                'comments_count' => 0,
                'is_liked' => false,
                'comments' => [],
            ]
        ], 201);
    }

    /**
     * Delete a post.
     */
    public function destroy($id, Request $request)
    {
        $post = Post::findOrFail($id);

        // Check ownership
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا المنشور.'], 403);
        }

        // Delete post images from storage if any
        if (is_array($post->images)) {
            foreach ($post->images as $url) {
                $path = str_replace('/storage/', '', $url);
                Storage::disk('public')->delete($path);
            }
        }

        $post->delete();

        return response()->json(['message' => 'تم حذف المنشور بنجاح.']);
    }

    /**
     * Toggle post like.
     */
    public function toggleLike($id, Request $request)
    {
        $post = Post::findOrFail($id);
        $userId = $request->user()->id;

        $existingLike = PostLike::where('user_id', $userId)
            ->where('post_id', $post->id)
            ->first();

        if ($existingLike) {
            $existingLike->delete();
            $isLiked = false;
        } else {
            PostLike::create([
                'user_id' => $userId,
                'post_id' => $post->id,
            ]);
            $isLiked = true;
        }

        $likesCount = PostLike::where('post_id', $post->id)->count();

        return response()->json([
            'is_liked' => $isLiked,
            'likes_count' => $likesCount,
        ]);
    }

    /**
     * Add a comment to a post.
     */
    public function addComment($id, Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'post_id' => $id,
            'parent_id' => $request->parent_id,
            'content' => $request->content,
        ]);

        // Load user and lawyer relationship
        $comment->load(['user.lawyer']);
        
        // Format comment for response
        $formatted = [
            'id' => $comment->id,
            'post_id' => $comment->post_id,
            'parent_id' => $comment->parent_id,
            'content' => $comment->content,
            'created_at' => $comment->created_at,
            'user' => [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'role' => $comment->user->role,
                'avatar' => $comment->user->avatar,
                'lawyer' => $comment->user->lawyer,
            ],
            'likes_count' => 0,
            'dislikes_count' => 0,
            'user_liked' => null,
            'replies' => [],
        ];

        return response()->json([
            'message' => 'تم إضافة التعليق بنجاح.',
            'comment' => $formatted,
        ], 201);
    }

    /**
     * Delete a comment.
     */
    public function deleteComment($commentId, Request $request)
    {
        $comment = Comment::findOrFail($commentId);

        // Check ownership
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا التعليق.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'تم حذف التعليق بنجاح.']);
    }

    /**
     * Toggle like/dislike on a comment (YouTube-style).
     */
    public function toggleCommentLike($commentId, Request $request)
    {
        $request->validate([
            'is_like' => 'required|boolean',
        ]);

        $userId = $request->user()->id;
        $isLike = $request->is_like;

        $existing = CommentLike::where('user_id', $userId)
            ->where('comment_id', $commentId)
            ->first();

        if ($existing) {
            if ($existing->is_like === $isLike) {
                // If clicking same action, remove it
                $existing->delete();
                $userStatus = null;
            } else {
                // If clicking opposite action, update it
                $existing->update(['is_like' => $isLike]);
                $userStatus = $isLike;
            }
        } else {
            // Create new vote
            CommentLike::create([
                'user_id' => $userId,
                'comment_id' => $commentId,
                'is_like' => $isLike,
            ]);
            $userStatus = $isLike;
        }

        $likesCount = CommentLike::where('comment_id', $commentId)->where('is_like', true)->count();
        $dislikesCount = CommentLike::where('comment_id', $commentId)->where('is_like', false)->count();

        return response()->json([
            'user_liked' => $userStatus,
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
        ]);
    }

    /**
     * Helper to recursively/hierarchically format a comment.
     */
    private function formatComment($comment, $userId)
    {
        $likes = $comment->likes ?? collect();
        $likesCount = $likes->where('is_like', true)->count();
        $dislikesCount = $likes->where('is_like', false)->count();

        $userVote = $likes->firstWhere('user_id', $userId);
        $userLiked = $userVote ? $userVote->is_like : null;

        $formattedReplies = collect();
        if ($comment->replies) {
            $formattedReplies = $comment->replies->map(function ($reply) use ($userId) {
                return $this->formatComment($reply, $userId);
            });
        }

        return [
            'id' => $comment->id,
            'post_id' => $comment->post_id,
            'parent_id' => $comment->parent_id,
            'content' => $comment->content,
            'created_at' => $comment->created_at,
            'user' => [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'role' => $comment->user->role,
                'avatar' => $comment->user->avatar,
                'lawyer' => $comment->user->lawyer,
            ],
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
            'user_liked' => $userLiked,
            'replies' => $formattedReplies,
        ];
    }

    /**
     * Get community stats.
     */
    public function getStats()
    {
        $totalUsers = \App\Models\User::count();
        $totalPosts = \App\Models\Post::count();
        $totalLawyers = \App\Models\Lawyer::count();

        return response()->json([
            'total_users' => $totalUsers,
            'total_posts' => $totalPosts,
            'total_lawyers' => $totalLawyers,
        ]);
    }
}
