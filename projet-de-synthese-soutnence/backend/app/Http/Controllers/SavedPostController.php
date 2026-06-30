<?php

namespace App\Http\Controllers;

use App\Models\SavedPost;
use App\Models\SavedCollection;
use App\Models\Post;
use Illuminate\Http\Request;

class SavedPostController extends Controller
{
    /**
     * Toggle save/unsave a post.
     */
    public function toggleSave($id, Request $request)
    {
        $post = Post::findOrFail($id);
        $userId = $request->user()->id;

        $existingSave = SavedPost::where('user_id', $userId)
            ->where('post_id', $post->id)
            ->first();

        if ($existingSave) {
            $existingSave->delete();
            $isSaved = false;
        } else {
            SavedPost::create([
                'user_id' => $userId,
                'post_id' => $post->id,
                'collection_id' => $request->collection_id,
            ]);
            $isSaved = true;
        }

        $savesCount = SavedPost::where('post_id', $post->id)->count();

        return response()->json([
            'is_saved' => $isSaved,
            'saves_count' => $savesCount,
        ]);
    }

    /**
     * Get all saved posts for the current user.
     */
    public function getSavedPosts(Request $request)
    {
        $userId = $request->user()->id;

        $query = SavedPost::where('user_id', $userId)
            ->with(['post.user.lawyer']);

        if ($request->has('collection_id')) {
            $query->where('collection_id', $request->collection_id);
        }

        $savedPosts = $query->orderBy('created_at', 'desc')->get();

        return response()->json($savedPosts);
    }

    /**
     * Get all collections for the current user.
     */
    public function getCollections(Request $request)
    {
        $userId = $request->user()->id;

        $collections = SavedCollection::where('user_id', $userId)
            ->withCount('savedPosts')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($collections);
    }

    /**
     * Create a new collection.
     */
    public function createCollection(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $collection = SavedCollection::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم إنشاء المجموعة بنجاح.',
            'collection' => $collection,
        ], 201);
    }

    /**
     * Update a collection name.
     */
    public function updateCollection($id, Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $collection = SavedCollection::findOrFail($id);

        if ($collection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذه المجموعة.'], 403);
        }

        $collection->update(['name' => $request->name]);

        return response()->json([
            'message' => 'تم تحديث المجموعة بنجاح.',
            'collection' => $collection,
        ]);
    }

    /**
     * Delete a collection.
     */
    public function deleteCollection($id, Request $request)
    {
        $collection = SavedCollection::findOrFail($id);

        if ($collection->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذه المجموعة.'], 403);
        }

        $collection->delete();

        return response()->json(['message' => 'تم حذف المجموعة بنجاح.']);
    }

    /**
     * Remove a saved post.
     */
    public function removeSavedPost($id, Request $request)
    {
        $savedPost = SavedPost::findOrFail($id);

        if ($savedPost->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا العنصر.'], 403);
        }

        $savedPost->delete();

        return response()->json(['message' => 'تم حذف المنشور المحفوظ بنجاح.']);
    }

    /**
     * Move a saved post to a different collection.
     */
    public function moveToCollection($id, Request $request)
    {
        $savedPost = SavedPost::findOrFail($id);

        if ($savedPost->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذا العنصر.'], 403);
        }

        $collectionId = $request->collection_id;

        if ($collectionId) {
            $collection = SavedCollection::findOrFail($collectionId);

            if ($collection->user_id !== $request->user()->id) {
                return response()->json(['message' => 'غير مصرح لك باستخدام هذه المجموعة.'], 403);
            }
        }

        $savedPost->update(['collection_id' => $collectionId]);

        return response()->json([
            'message' => 'تم نقل المنشور بنجاح.',
            'saved_post' => $savedPost,
        ]);
    }
}
