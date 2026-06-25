import api from './api';

/**
 * Service to handle all Pricing related API endpoints
 */
export const PricingService = {
  /**
   * Fetch pricing plans
   */
  getPricingPlans: async () => {
    try {
      const response = await api.get('/pricing/plans');
      return response.data; // e.g., { plans: [{ id: 1, name: 'Basic', price: 9.99, ... }] }
    } catch (error) {
      console.error('Error fetching pricing plans', error);
      throw error;
    }
  },

  /**
   * Handle user subscription checkout
   */
  subscribeToPlan: async (planId) => {
    try {
      const response = await api.post('/pricing/subscribe', { plan_id: planId });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to plan', error);
      throw error;
    }
  }
};
