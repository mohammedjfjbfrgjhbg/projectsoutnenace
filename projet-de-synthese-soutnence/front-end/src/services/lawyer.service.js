import api from './api';

/**
 * Service to handle all Lawyer Directory related API endpoints
 */
export const LawyerService = {
  /**
   * Fetch all lawyers (with optional search and filters)
   * Example query params: ?location=Paris&specialty=FamilyLaw
   */
  getAllLawyers: async (params = {}) => {
    try {
      const response = await api.get('/lawyers', { params });
      return response.data; // e.g. { data: [...lawyers], meta: { current_page, ... } }
    } catch (error) {
      console.error('Error fetching lawyers', error);
      throw error;
    }
  },

  /**
   * Fetch a single lawyer by ID
   */
  getLawyerById: async (id) => {
    try {
      const response = await api.get(`/lawyers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lawyer ${id}`, error);
      throw error;
    }
  }
};
