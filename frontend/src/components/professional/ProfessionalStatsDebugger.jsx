import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import ProfessionalService from '../../services/professionalService';

const ProfessionalStatsDebugger = ({ stats, error, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleTestConnection = async () => {
    setTestResults('Testing...');
    try {
      const result = await ProfessionalService.getDashboardStats();
      setTestResults(JSON.stringify(result, null, 2));
    } catch (err) {
      setTestResults(`Error: ${err.message}`);
    }
  };

  // Don't show in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 mr-2" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 mr-2" />
        )}
        Debug Info (Dev Mode)
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Status</h4>
            <div className="mt-2 text-sm">
              <div
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  loading
                    ? 'bg-yellow-100 text-yellow-800'
                    : error
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {loading ? 'Loading...' : error ? 'Error' : 'Success'}
              </div>
            </div>
          </div>

          {error && (
            <div>
              <h4 className="font-medium text-gray-900">Error Details</h4>
              <pre className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 overflow-x-auto">
                {error}
              </pre>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900">Current Stats Data</h4>
            <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-800 overflow-x-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">API Test</h4>
            <button
              onClick={handleTestConnection}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Test API Connection
            </button>
            {testResults && (
              <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-800 overflow-x-auto max-h-40">
                {testResults}
              </pre>
            )}
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Environment</h4>
            <div className="mt-2 text-sm text-gray-600">
              <div>Node ENV: {process.env.NODE_ENV}</div>
              <div>
                API URL: {process.env.REACT_APP_API_URL || 'Default (http://localhost:5000)'}
              </div>
              <div>
                Stats Valid:{' '}
                {stats ? ProfessionalService.validateDashboardStats(stats).toString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalStatsDebugger;
