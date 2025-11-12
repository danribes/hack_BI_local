import { useState, useEffect } from 'react';

interface Patient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email?: string;
  phone?: string;
  last_visit_date?: string;
  created_at: string;
}

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [populating, setPopulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/patients`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.status}`);
      }

      const data = await response.json();
      setPatients(data.patients || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateDatabase = async () => {
    try {
      setPopulating(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/init/populate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to populate database: ${response.status}`);
      }

      const data = await response.json();
      console.log('Database populated:', data);

      // Refresh patient list
      await fetchPatients();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to populate database');
      console.error('Error populating database:', err);
    } finally {
      setPopulating(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const mrn = patient.medical_record_number.toLowerCase();
    const email = patient.email?.toLowerCase() || '';
    const id = patient.id.toLowerCase();

    return (
      fullName.includes(query) ||
      mrn.includes(query) ||
      email.includes(query) ||
      id.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            Healthcare AI
          </h1>
          <p className="text-xl text-gray-600">
            Patient Database
          </p>
        </header>

        {/* Search Bar */}
        {!loading && !error && patients.length > 0 && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients by name, MRN, email, or ID..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-600">
                  Found <strong>{filteredPatients.length}</strong> {filteredPatients.length === 1 ? 'patient' : 'patients'}
                  {filteredPatients.length < patients.length && (
                    <span> out of {patients.length} total</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-6xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading patients...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold text-lg">Error Loading Patients</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchPatients}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && patients.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Patients Found</h3>
              <p className="text-gray-600 mb-6">The database is empty. Click below to populate it with sample patients.</p>
              <button
                onClick={populateDatabase}
                disabled={populating}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {populating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Populating Database...
                  </span>
                ) : (
                  'Populate Database with Sample Patients'
                )}
              </button>
            </div>
          )}

          {!loading && !error && patients.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">
                  Patients ({filteredPatients.length}{searchQuery && patients.length !== filteredPatients.length ? ` of ${patients.length}` : ''})
                </h2>
              </div>

              {/* Patient List */}
              <div className="divide-y divide-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            MRN: <strong className="ml-1">{patient.medical_record_number}</strong>
                          </span>
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Age: <strong className="ml-1">{calculateAge(patient.date_of_birth)}</strong>
                          </span>
                          <span className="flex items-center capitalize">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {patient.gender}
                          </span>
                          {patient.email && (
                            <span className="flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {patient.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-xs text-gray-500">Patient ID</div>
                        <div className="text-xs font-mono text-gray-700 mt-1">{patient.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
                    <p className="text-gray-600">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>Healthcare AI Clinical Data Analyzer</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
