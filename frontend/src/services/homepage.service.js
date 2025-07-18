import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com/api';

class HomepageService {
  async getFeaturedProfessionals() {
    try {
      const response = await axios.get(`${API_BASE_URL}/homepage/featured-professionals`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured professionals:', error);
      throw error;
    }
  }

  async getFeaturedProducts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/homepage/featured-products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  async getUpcomingEvents() {
    try {
      const response = await axios.get(`${API_BASE_URL}/homepage/upcoming-events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  }

  async getTestimonials() {
    try {
      const response = await axios.get(`${API_BASE_URL}/homepage/testimonials`);
      return response.data;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
    }
  }

  async getPlatformStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/homepage/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  }

  async subscribeToNewsletter(email) {
    try {
      const response = await axios.post(`${API_BASE_URL}/homepage/newsletter`, { email });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw error;
    }
  }
}

export default new HomepageService();
