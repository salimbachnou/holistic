const axios = require('axios');
const jwt = require('jsonwebtoken');
const zoomConfig = require('../config/zoom');

class ZoomService {
  constructor() {
    this.apiKey = zoomConfig.apiKey;
    this.apiSecret = zoomConfig.apiSecret;
    this.userId = zoomConfig.userId;
  }

  // Générer un token JWT pour l'API Zoom
  generateToken() {
    const payload = {
      iss: this.apiKey,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expire dans 1 heure
    };

    return jwt.sign(payload, this.apiSecret);
  }

  // Générer un token pour le SDK Zoom
  generateSdkToken(sessionName, role) {
    const iat = Math.round(new Date().getTime() / 1000);
    const exp = iat + 60 * 60 * 2; // 2 heures

    const oHeader = { alg: 'HS256', typ: 'JWT' };
    const oPayload = {
      sdkKey: zoomConfig.sdkKey,
      mn: sessionName,
      role: role, // 0 pour participant, 1 pour hôte
      iat: iat,
      exp: exp,
      appKey: zoomConfig.sdkKey,
      tokenExp: exp
    };

    return jwt.sign(oPayload, zoomConfig.sdkSecret);
  }

  // Créer une réunion Zoom
  async createMeeting(topic, startTime, duration, agenda = '') {
    try {
      const token = this.generateToken();
      const response = await axios.post(
        `https://api.zoom.us/v2/users/${this.userId}/meetings`,
        {
          topic,
          type: 2, // Réunion programmée
          start_time: startTime,
          duration,
          agenda,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: true,
            waiting_room: false,
            approval_type: 0,
            audio: 'both',
            auto_recording: 'none'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la réunion Zoom:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la réunion Zoom');
    }
  }

  // Récupérer les détails d'une réunion
  async getMeeting(meetingId) {
    try {
      const token = this.generateToken();
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la réunion Zoom:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de la réunion Zoom');
    }
  }

  // Mettre à jour une réunion
  async updateMeeting(meetingId, topic, startTime, duration, agenda = '') {
    try {
      const token = this.generateToken();
      const response = await axios.patch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          topic,
          type: 2,
          start_time: startTime,
          duration,
          agenda
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réunion Zoom:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la réunion Zoom');
    }
  }

  // Supprimer une réunion
  async deleteMeeting(meetingId) {
    try {
      const token = this.generateToken();
      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la réunion Zoom:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la réunion Zoom');
    }
  }
}

module.exports = new ZoomService(); 