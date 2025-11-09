import { useState, useEffect } from 'react'
import './App.css'
import PatientList from './components/PatientList'
import HighRiskMonitoringDashboard from './components/HighRiskMonitoringDashboard'
import NotificationsDashboard from './components/NotificationsDashboard'

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
}

type ViewMode = 'patients' | 'monitoring' | 'notifications';

function App() {
  const [backendHealth, setBackendHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(true);
  const [activeView, setActiveView] = useState<ViewMode>('patients');

  useEffect(() => {
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

    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            🏥 Healthcare AI Clinical Data Analyzer
          </h1>
          <p className="text-lg text-gray-700">
            AI-Powered Clinical Decision Support System
          </p>
        </header>

        <main className="max-w-7xl mx-auto">
          {/* Collapsible System Status */}
          <div className="mb-6">
            <button
              onClick={() => setShowStatus(!showStatus)}
              className="w-full bg-white rounded-lg shadow p-4 flex justify-between items-center hover:shadow-md transition-shadow"
            >
              <span className="font-semibold text-gray-800">System Status</span>
              <span className="text-gray-600">{showStatus ? '▲' : '▼'}</span>
            </button>

            {showStatus && (
              <div className="bg-white rounded-b-lg shadow-lg p-6 mt-2">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-4 text-gray-600">Checking backend connection...</span>
                  </div>
                )}

                {error && !loading && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">❌</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-red-800 font-semibold">Backend Connection Failed</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {backendHealth && !loading && !error && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-green-800 font-semibold">Backend Connected</h3>
                        <p className="text-green-700">All systems operational</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Service:</span>
                        <span className="ml-2 text-gray-800">{backendHealth.service}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Environment:</span>
                        <span className="ml-2 text-gray-800">{backendHealth.environment}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          {backendHealth && !error && (
            <>
              <div className="mb-6 bg-white rounded-lg shadow-lg">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveView('patients')}
                    className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                      activeView === 'patients'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    👥 Patient List
                  </button>
                  <button
                    onClick={() => setActiveView('monitoring')}
                    className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                      activeView === 'monitoring'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    🔍 High-Risk Monitoring
                  </button>
                  <button
                    onClick={() => setActiveView('notifications')}
                    className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                      activeView === 'notifications'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    📧 Notifications
                  </button>
                </div>
              </div>

              {/* Patient List View */}
              {activeView === 'patients' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <PatientList />
                </div>
              )}

              {/* High-Risk Monitoring View */}
              {activeView === 'monitoring' && (
                <HighRiskMonitoringDashboard />
              )}

              {/* Notifications View */}
              {activeView === 'notifications' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <NotificationsDashboard />
                </div>
              )}
            </>
          )}

          {/* Error State - Show Instructions */}
          {error && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Unable to Load Patients
              </h2>
              <p className="text-gray-600 mb-4">
                Please ensure the backend service is running and accessible.
              </p>
            </div>
          )}
        </main>

        <footer className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            Built with React + Vite + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
