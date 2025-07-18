import axios from 'axios';
import React, { useState, useEffect } from 'react';

import api from '../services/axiosConfig';

const ApiTest = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const testApi = async () => {
    try {
      setLoading(true);
      console.log('Testing direct API connection...');

      // Try with our configured API instance
      try {
        const response = await api.get('/professionals');
        console.log('API success with configured axios:', response);
        setApiResponse(
          'Success with configured axios: ' +
            JSON.stringify(response.data).substring(0, 100) +
            '...'
        );
        setError(null);
        return;
      } catch (configError) {
        console.error('Failed with configured axios:', configError);
      }

      // Try with relative URL
      try {
        const response = await axios.get('/api/professionals');
        console.log('API success with relative URL:', response);
        setApiResponse(
          'Success with relative URL: ' + JSON.stringify(response.data).substring(0, 100) + '...'
        );
        setError(null);
        return;
      } catch (relativeError) {
        console.error('Failed with relative URL:', relativeError);
      }

      // Try with absolute URL if all else fails
      try {
        const fullResponse = await axios.get(
          'http://localhost:5000/api/professionals'
        );
        console.log('API success with absolute URL:', fullResponse);
        setApiResponse(
          'Success with absolute URL: ' +
            JSON.stringify(fullResponse.data).substring(0, 100) +
            '...'
        );
        setError(null);
      } catch (absoluteError) {
        console.error('Failed with absolute URL:', absoluteError);
        setError('All API call methods failed. See console for details.');
      }
    } catch (err) {
      console.error('General error in API test:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApi();
  }, []);

  return (
    <div className="p-4 m-4 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-4">API Connection Test</h2>
      {loading && <p>Testing API connection...</p>}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 rounded mb-3">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      {apiResponse && (
        <div className="p-3 bg-green-100 border border-green-400 rounded">
          <p className="text-green-700">Response: {apiResponse}</p>
        </div>
      )}
      <button
        onClick={testApi}
        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Again
      </button>
    </div>
  );
};

export default ApiTest;
