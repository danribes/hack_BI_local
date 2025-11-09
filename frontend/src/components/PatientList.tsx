import { useState, useEffect } from 'react';
import { Patient, PatientListResponse, RiskAssessment, RiskAnalysisResponse } from '../types';
import PatientCard from './PatientCard';
import RiskAssessmentDisplay from './RiskAssessmentDisplay';

function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzingPatientId, setAnalyzingPatientId] = useState<string | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<RiskAssessment | null>(null);
  const [currentPatientName, setCurrentPatientName] = useState<string>('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/patients`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.status}`);
      }

      const data: PatientListResponse = await response.json();
      setPatients(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const analyzePatientRisk = async (patientId: string) => {
    try {
      setAnalyzingPatientId(patientId);

      const response = await fetch(`${apiUrl}/api/patients/${patientId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data: RiskAnalysisResponse = await response.json();

      // Find patient name
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setCurrentPatientName(patient.full_name);
      }

      setCurrentAssessment(data.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to analyze patient risk');
    } finally {
      setAnalyzingPatientId(null);
    }
  };

  const closeAssessment = () => {
    setCurrentAssessment(null);
    setCurrentPatientName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-center">
          <span className="text-3xl mr-4">❌</span>
          <div>
            <h3 className="text-red-800 font-bold text-lg">Error Loading Patients</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchPatients}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <p className="text-gray-600 text-lg">No patients found in the database</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Patient List ({patients.length})
          </h2>
          <button
            onClick={fetchPatients}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <p className="text-gray-600 mt-1">
          Click "Analyze Risk with AI" to generate a comprehensive risk assessment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onAnalyze={analyzePatientRisk}
            isAnalyzing={analyzingPatientId === patient.id}
          />
        ))}
      </div>

      {/* Risk Assessment Modal */}
      {currentAssessment && (
        <RiskAssessmentDisplay
          assessment={currentAssessment}
          patientName={currentPatientName}
          onClose={closeAssessment}
        />
      )}
    </>
  );
}

export default PatientList;
