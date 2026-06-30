import api from './api';

const postService = {
  // 1. Get all community posts
  getPosts: async () => {
    const response = await api.get('/posts');
    return response.data;
  },

  // Get community stats
  getStats: async () => {
    const response = await api.get('/posts/stats');
    return response.data;
  },

  // 2. Create a new post (uses FormData for image uploads)
  createPost: async (formData) => {
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 3. Delete a post by ID
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  // 4. Toggle like on a post
  toggleLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // 5. Add a comment/reply to a post
  addComment: async (postId, content, parentId = null) => {
    const response = await api.post(`/posts/${postId}/comments`, {
      content,
      parent_id: parentId,
    });
    return response.data;
  },

  // 6. Delete a comment
  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  // 7. Toggle like/dislike on a comment (isLike: true for like, false for dislike)
  toggleCommentLike: async (commentId, isLike) => {
    const response = await api.post(`/comments/${commentId}/like`, {
      is_like: isLike,
    });
    return response.data;
  },

  // ============ SAVED POSTS & COLLECTIONS ============

  // 8. Toggle save/unsave a post (optionally to a collection)
  toggleSave: async (postId, collectionId = null) => {
    const response = await api.post(`/posts/${postId}/save`, {
      collection_id: collectionId,
    });
    return response.data;
  },

  // 9. Get all saved posts (optionally filter by collection)
  getSavedPosts: async (collectionId = null) => {
    const params = collectionId ? { collection_id: collectionId } : {};
    const response = await api.get('/saved-posts', { params });
    return response.data;
  },

  // 10. Get all collections for current user
  getCollections: async () => {
    const response = await api.get('/saved-collections');
    return response.data;
  },

  // 11. Create a new collection
  createCollection: async (name) => {
    const response = await api.post('/saved-collections', { name });
    return response.data;
  },

  // 12. Rename a collection
  updateCollection: async (id, name) => {
    const response = await api.put(`/saved-collections/${id}`, { name });
    return response.data;
  },

  // 13. Delete a collection
  deleteCollection: async (id) => {
    const response = await api.delete(`/saved-collections/${id}`);
    return response.data;
  },

  // 14. Remove a specific saved post
  removeSavedPost: async (id) => {
    const response = await api.delete(`/saved-posts/${id}`);
    return response.data;
  },

  // 15. Move a saved post to a different collection
  moveSavedPost: async (id, collectionId) => {
    const response = await api.put(`/saved-posts/${id}/move`, {
      collection_id: collectionId,
    });
    return response.data;
  },
};

export default postService;
