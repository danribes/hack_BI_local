import { useState, useEffect } from 'react';
import PatientList from './components/PatientList';

interface HealthCheck {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
}

function App() {
  const [backendHealth, setBackendHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/health`);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      setBackendHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      setBackendHealth(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Healthcare AI Clinical Data Analyzer
            </h1>
            <p className="text-lg text-gray-600">
              AI-Powered Clinical Decision Support System
            </p>
          </div>

          {/* Backend Status */}
          <div className="max-w-4xl mx-auto">
            {loading && (
              <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
                <span className="text-gray-600">Checking backend connection...</span>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-red-800 font-semibold">Backend Connection Failed</h3>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={checkBackendHealth}
                    className="ml-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {backendHealth && !loading && !error && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-green-800 font-semibold">Backend Connected</h3>
                    <p className="text-green-700 text-sm">
                      {backendHealth.service} - {backendHealth.environment}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto">
          {backendHealth && !error ? (
            <PatientList />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-800">
                Unable to Load Patients
              </h2>
              <p className="mt-2 text-gray-600">
                Please ensure the backend service is running and accessible.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Built with React + Vite + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
