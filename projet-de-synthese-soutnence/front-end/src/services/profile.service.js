import api from './api';

const profileService = {
  // 1. Get user profile details
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  // 2. Toggle follow/unfollow on a user
  toggleFollow: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  // 3. Update current user's profile info (supports FormData for avatar image file)
  updateProfile: async (formData) => {
    const response = await api.post('/profile/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 4. Accept a pending follow request
  acceptFollow: async (userId) => {
    const response = await api.post(`/users/${userId}/accept-follow`);
    return response.data;
  },

  // 5. Reject a pending follow request
  rejectFollow: async (userId) => {
    const response = await api.post(`/users/${userId}/reject-follow`);
    return response.data;
  },

  // 6. Get list of followers
  getFollowers: async (userId) => {
    const response = await api.get(`/users/${userId}/followers`);
    return response.data;
  },

  // 7. Get list of following
  getFollowing: async (userId) => {
    const response = await api.get(`/users/${userId}/following`);
    return response.data;
  },
};

export default profileService;
