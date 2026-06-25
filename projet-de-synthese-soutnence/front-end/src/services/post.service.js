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
};

export default postService;
