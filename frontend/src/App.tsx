import { useState, useEffect } from 'react';

interface KDIGOClassification {
  gfr_category: string;
  gfr_description: string;
  albuminuria_category: string;
  albuminuria_description: string;
  health_state: string;
  risk_level: string;
  risk_color: string;
  has_ckd: boolean;
  ckd_stage: number | null;
  ckd_stage_name: string;
  requires_nephrology_referral: boolean;
  requires_dialysis_planning: boolean;
  recommend_ras_inhibitor: boolean;
  recommend_sglt2i: boolean;
  target_bp: string;
  monitoring_frequency: string;
}

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
  kdigo_classification?: KDIGOClassification;
  risk_category?: string;
}

interface Observation {
  observation_type: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  observation_date: string;
  notes?: string;
}

interface Condition {
  condition_code: string;
  condition_name: string;
  clinical_status: string;
  onset_date?: string;
  severity?: string;
  notes?: string;
}

interface RiskAssessment {
  risk_score: number;
  risk_level: string;
  recommendations: string[];
  reasoning: string;
  assessed_at: string;
}

interface PatientDetail extends Patient {
  weight?: number;
  height?: number;
  smoking_status?: string;
  cvd_history?: boolean;
  family_history_esrd?: boolean;
  on_ras_inhibitor?: boolean;
  on_sglt2i?: boolean;
  nephrotoxic_meds?: boolean;
  nephrologist_referral?: boolean;
  diagnosis_date?: string;
  next_visit_date?: string;
  observations: Observation[];
  conditions: Condition[];
  risk_assessment?: RiskAssessment | null;
  kdigo_classification: KDIGOClassification;
  risk_category: string;
  home_monitoring_device?: string | null;
  home_monitoring_active?: boolean;
  ckd_treatment_active?: boolean;
  ckd_treatment_type?: string | null;
}

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
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

  const fetchPatientDetail = async (patientId: string) => {
    try {
      setLoadingDetail(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/patients/${patientId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patient details: ${response.status}`);
      }

      const data = await response.json();
      setSelectedPatient(data.patient);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient details');
      console.error('Error fetching patient details:', err);
    } finally {
      setLoadingDetail(false);
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

  const calculateBMI = (weight?: number, height?: number): number | null => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getObservationValue = (observations: Observation[], type: string): Observation | undefined => {
    return observations.find(obs => obs.observation_type === type);
  };

  const getSeverityColor = (severity?: string): string => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 'text-red-700 bg-red-100 border-red-300';
      case 'moderate': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'mild': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getRiskColor = (risk_level?: string): string => {
    switch (risk_level?.toLowerCase()) {
      case 'high': return 'text-red-700 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getKDIGORiskColorClass = (riskColor: string): string => {
    switch (riskColor) {
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskCategoryBadgeColor = (category?: string): string => {
    if (!category) return 'bg-gray-100 text-gray-700';
    if (category.includes('Very High')) return 'bg-red-600 text-white';
    if (category.includes('High')) return 'bg-orange-500 text-white';
    if (category.includes('Moderate')) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
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

  // If a patient is selected, show the detail view
  if (selectedPatient) {
    const bmi = calculateBMI(selectedPatient.weight, selectedPatient.height);
    const age = calculateAge(selectedPatient.date_of_birth);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Back Button */}
          <div className="max-w-6xl mx-auto mb-6">
            <button
              onClick={() => setSelectedPatient(null)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Patient List
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading patient details...</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Patient Header Card */}
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                  <h1 className="text-3xl font-bold text-white">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h1>
                  <p className="text-indigo-100 mt-1">MRN: {selectedPatient.medical_record_number}</p>
                </div>

                {/* Demographics & Contact */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Age</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{age} years</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Gender</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1 capitalize">{selectedPatient.gender}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{formatDate(selectedPatient.date_of_birth)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Patient ID</div>
                    <div className="text-xs font-mono text-gray-700 mt-2 break-all">{selectedPatient.id}</div>
                  </div>
                </div>

                <div className="px-8 pb-8 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPatient.email && (
                    <div className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selectedPatient.email}
                    </div>
                  )}
                  {selectedPatient.phone && (
                    <div className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {selectedPatient.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* CKD Health State & Risk Classification */}
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    CKD Health State Classification
                  </h2>
                </div>

                <div className="p-8">
                  {/* KDIGO Health State Badge */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-600 mr-3">Health State:</span>
                      <span className={`px-6 py-3 rounded-full text-2xl font-bold border-2 ${getKDIGORiskColorClass(selectedPatient.kdigo_classification.risk_color)}`}>
                        {selectedPatient.kdigo_classification.health_state}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-600 mr-3">Risk Category:</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${getRiskCategoryBadgeColor(selectedPatient.risk_category)}`}>
                        {selectedPatient.risk_category}
                      </span>
                    </div>

                    {selectedPatient.kdigo_classification.has_ckd && (
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-gray-600 mr-3">CKD Stage:</span>
                        <span className="px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          {selectedPatient.kdigo_classification.ckd_stage_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Classification Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">GFR Category</div>
                      <div className="text-lg font-bold text-gray-900">{selectedPatient.kdigo_classification.gfr_category}</div>
                      <div className="text-sm text-gray-600 mt-1">{selectedPatient.kdigo_classification.gfr_description}</div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Albuminuria Category</div>
                      <div className="text-lg font-bold text-gray-900">{selectedPatient.kdigo_classification.albuminuria_category}</div>
                      <div className="text-sm text-gray-600 mt-1">{selectedPatient.kdigo_classification.albuminuria_description}</div>
                    </div>
                  </div>

                  {/* Home Monitoring & Treatment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Monitoring */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">Home Monitoring</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Device:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {selectedPatient.kdigo_classification.has_ckd && selectedPatient.home_monitoring_device
                              ? selectedPatient.home_monitoring_device
                              : selectedPatient.kdigo_classification.has_ckd
                                ? 'Minuteful Kidney Kit (Recommended)'
                                : 'Not Required'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`text-sm font-semibold ${selectedPatient.home_monitoring_active ? 'text-green-600' : 'text-gray-600'}`}>
                            {selectedPatient.home_monitoring_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {selectedPatient.kdigo_classification.has_ckd && !selectedPatient.home_monitoring_active && (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                            ⚠️ Home uACR monitoring recommended for CKD patients
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CKD Treatment */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900">CKD Treatment</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Treatment Status:</span>
                          <span className={`text-sm font-semibold ${selectedPatient.ckd_treatment_active ? 'text-green-600' : 'text-gray-600'}`}>
                            {selectedPatient.kdigo_classification.has_ckd
                              ? (selectedPatient.ckd_treatment_active ? 'Active' : 'Not Started')
                              : 'N/A - No CKD'}
                          </span>
                        </div>
                        {selectedPatient.ckd_treatment_active && selectedPatient.ckd_treatment_type && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Treatment Type:</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedPatient.ckd_treatment_type}</span>
                          </div>
                        )}
                        {selectedPatient.kdigo_classification.has_ckd && !selectedPatient.ckd_treatment_active && (
                          <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                            ⚠️ CKD treatment protocol recommended
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clinical Recommendations */}
                  {(selectedPatient.kdigo_classification.recommend_ras_inhibitor ||
                    selectedPatient.kdigo_classification.recommend_sglt2i ||
                    selectedPatient.kdigo_classification.requires_nephrology_referral) && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Clinical Recommendations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedPatient.kdigo_classification.recommend_ras_inhibitor && (
                          <div className="flex items-start space-x-2 text-sm">
                            <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">RAS Inhibitor (ACE-I/ARB)</span>
                          </div>
                        )}
                        {selectedPatient.kdigo_classification.recommend_sglt2i && (
                          <div className="flex items-start space-x-2 text-sm">
                            <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">SGLT2 Inhibitor</span>
                          </div>
                        )}
                        {selectedPatient.kdigo_classification.requires_nephrology_referral && (
                          <div className="flex items-start space-x-2 text-sm">
                            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-gray-700 font-semibold">Nephrology Referral Required</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Target BP:</span>
                          <span className="font-semibold text-gray-900">{selectedPatient.kdigo_classification.target_bp}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Monitoring Frequency:</span>
                          <span className="font-semibold text-gray-900">{selectedPatient.kdigo_classification.monitoring_frequency}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Overview - 3 Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Anthropometrics */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Anthropometrics
                  </h3>
                  <div className="space-y-0 divide-y divide-gray-200">
                    <div className="py-3">
                      <div className="text-sm text-gray-600">Weight</div>
                      <div className="text-xl font-semibold text-gray-900">{selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}</div>
                    </div>
                    <div className="py-3">
                      <div className="text-sm text-gray-600">Height</div>
                      <div className="text-xl font-semibold text-gray-900">{selectedPatient.height ? `${selectedPatient.height} cm` : 'N/A'}</div>
                    </div>
                    <div className="py-3">
                      <div className="text-sm text-gray-600">BMI</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {bmi ? `${bmi.toFixed(1)} kg/m²` : 'N/A'}
                      </div>
                      {bmi && (
                        <div className="text-xs mt-1 text-gray-600">
                          {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clinical History */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Clinical History
                  </h3>
                  <div className="space-y-0 divide-y divide-gray-200">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Smoking Status</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedPatient.smoking_status || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">CVD History</span>
                      <span className={`text-sm font-semibold ${selectedPatient.cvd_history ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedPatient.cvd_history ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Family History ESRD</span>
                      <span className={`text-sm font-semibold ${selectedPatient.family_history_esrd ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedPatient.family_history_esrd ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Nephrologist Referral</span>
                      <span className={`text-sm font-semibold ${selectedPatient.nephrologist_referral ? 'text-green-600' : 'text-gray-600'}`}>
                        {selectedPatient.nephrologist_referral ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medications */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Medications
                  </h3>
                  <div className="space-y-0 divide-y divide-gray-200">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">RAS Inhibitor</span>
                      <span className={`text-sm font-semibold ${selectedPatient.on_ras_inhibitor ? 'text-blue-600' : 'text-gray-400'}`}>
                        {selectedPatient.on_ras_inhibitor ? 'Active' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">SGLT2 Inhibitor</span>
                      <span className={`text-sm font-semibold ${selectedPatient.on_sglt2i ? 'text-blue-600' : 'text-gray-400'}`}>
                        {selectedPatient.on_sglt2i ? 'Active' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Nephrotoxic Meds</span>
                      <span className={`text-sm font-semibold ${selectedPatient.nephrotoxic_meds ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedPatient.nephrotoxic_meds ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Visit Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Diagnosis Date</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{formatDate(selectedPatient.diagnosis_date)}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Last Visit</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{formatDate(selectedPatient.last_visit_date)}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Next Visit</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{formatDate(selectedPatient.next_visit_date)}</div>
                  </div>
                </div>
              </div>

              {/* Laboratory Results */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Latest Laboratory Results
                </h3>

                {/* Kidney Function */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Kidney Function</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const egfr = getObservationValue(selectedPatient.observations, 'eGFR');
                      return egfr && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">eGFR</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {egfr.value_numeric} <span className="text-sm font-normal text-gray-600">{egfr.unit}</span>
                          </div>
                          {egfr.notes && <div className="text-xs text-gray-600 mt-1">{egfr.notes}</div>}
                        </div>
                      );
                    })()}
                    {(() => {
                      const creatinine = getObservationValue(selectedPatient.observations, 'serum_creatinine');
                      return creatinine && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Creatinine</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {creatinine.value_numeric} <span className="text-sm font-normal text-gray-600">{creatinine.unit}</span>
                          </div>
                          {creatinine.notes && <div className="text-xs text-gray-600 mt-1">{creatinine.notes}</div>}
                        </div>
                      );
                    })()}
                    {(() => {
                      const bun = getObservationValue(selectedPatient.observations, 'BUN');
                      return bun && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">BUN</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {bun.value_numeric} <span className="text-sm font-normal text-gray-600">{bun.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const uacr = getObservationValue(selectedPatient.observations, 'uACR');
                      return uacr && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">uACR</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {uacr.value_numeric} <span className="text-sm font-normal text-gray-600">{uacr.unit}</span>
                          </div>
                          {uacr.notes && <div className="text-xs text-gray-600 mt-1">{uacr.notes}</div>}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Blood Pressure & Cardiovascular */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Blood Pressure & Cardiovascular</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const systolic = getObservationValue(selectedPatient.observations, 'blood_pressure_systolic');
                      const diastolic = getObservationValue(selectedPatient.observations, 'blood_pressure_diastolic');
                      return (systolic || diastolic) && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Blood Pressure</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {systolic?.value_numeric || '--'}/{diastolic?.value_numeric || '--'} <span className="text-sm font-normal text-gray-600">mmHg</span>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const ldl = getObservationValue(selectedPatient.observations, 'LDL_cholesterol');
                      return ldl && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">LDL Cholesterol</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {ldl.value_numeric} <span className="text-sm font-normal text-gray-600">{ldl.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const hdl = getObservationValue(selectedPatient.observations, 'HDL_cholesterol');
                      return hdl && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">HDL Cholesterol</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {hdl.value_numeric} <span className="text-sm font-normal text-gray-600">{hdl.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Metabolic */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Metabolic</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const hba1c = getObservationValue(selectedPatient.observations, 'HbA1c');
                      return hba1c && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">HbA1c</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {hba1c.value_numeric} <span className="text-sm font-normal text-gray-600">{hba1c.unit}</span>
                          </div>
                          {hba1c.notes && <div className="text-xs text-gray-600 mt-1">{hba1c.notes}</div>}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Hematology & Minerals */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Hematology & Minerals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const hemoglobin = getObservationValue(selectedPatient.observations, 'hemoglobin');
                      return hemoglobin && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Hemoglobin</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {hemoglobin.value_numeric} <span className="text-sm font-normal text-gray-600">{hemoglobin.unit}</span>
                          </div>
                          {hemoglobin.notes && <div className="text-xs text-gray-600 mt-1">{hemoglobin.notes}</div>}
                        </div>
                      );
                    })()}
                    {(() => {
                      const potassium = getObservationValue(selectedPatient.observations, 'potassium');
                      return potassium && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Potassium</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {potassium.value_numeric} <span className="text-sm font-normal text-gray-600">{potassium.unit}</span>
                          </div>
                          {potassium.notes && <div className="text-xs text-gray-600 mt-1">{potassium.notes}</div>}
                        </div>
                      );
                    })()}
                    {(() => {
                      const calcium = getObservationValue(selectedPatient.observations, 'calcium');
                      return calcium && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Calcium</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {calcium.value_numeric} <span className="text-sm font-normal text-gray-600">{calcium.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const phosphorus = getObservationValue(selectedPatient.observations, 'phosphorus');
                      return phosphorus && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Phosphorus</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {phosphorus.value_numeric} <span className="text-sm font-normal text-gray-600">{phosphorus.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const albumin = getObservationValue(selectedPatient.observations, 'albumin');
                      return albumin && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 uppercase">Albumin</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {albumin.value_numeric} <span className="text-sm font-normal text-gray-600">{albumin.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Active Conditions */}
              {selectedPatient.conditions && selectedPatient.conditions.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Diagnoses & Conditions
                  </h3>
                  <div className="space-y-3">
                    {selectedPatient.conditions.map((condition, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{condition.condition_name}</div>
                            <div className="text-sm text-gray-600 mt-1">ICD-10: {condition.condition_code}</div>
                            {condition.onset_date && (
                              <div className="text-sm text-gray-600 mt-1">Onset: {formatDate(condition.onset_date)}</div>
                            )}
                            {condition.notes && (
                              <div className="text-sm text-gray-600 mt-2 italic">{condition.notes}</div>
                            )}
                          </div>
                          <div className="ml-4 flex flex-col items-end gap-2">
                            {condition.severity && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(condition.severity)}`}>
                                {condition.severity}
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              condition.clinical_status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                              condition.clinical_status === 'resolved' ? 'bg-gray-100 text-gray-700 border border-gray-300' :
                              'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            }`}>
                              {condition.clinical_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {selectedPatient.risk_assessment && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Risk Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Risk Score</div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">{selectedPatient.risk_assessment.risk_score.toFixed(2)}</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Risk Level</div>
                      <span className={`inline-block px-4 py-2 rounded-full text-lg font-bold mt-1 border ${getRiskColor(selectedPatient.risk_assessment.risk_level)}`}>
                        {selectedPatient.risk_assessment.risk_level.toUpperCase()}
                      </span>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Assessed</div>
                      <div className="text-lg font-semibold text-gray-900 mt-1">{formatDate(selectedPatient.risk_assessment.assessed_at)}</div>
                    </div>
                  </div>
                  {selectedPatient.risk_assessment.reasoning && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Reasoning</div>
                      <div className="text-sm text-gray-700">{selectedPatient.risk_assessment.reasoning}</div>
                    </div>
                  )}
                  {selectedPatient.risk_assessment.recommendations && selectedPatient.risk_assessment.recommendations.length > 0 && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Recommendations</div>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPatient.risk_assessment.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main patient list view
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
                    onClick={() => fetchPatientDetail(patient.id)}
                    className="px-6 py-5 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          {patient.risk_category && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskCategoryBadgeColor(patient.risk_category)}`}>
                              {patient.risk_category}
                            </span>
                          )}
                        </div>
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
                      <div className="ml-4 flex items-center">
                        <div className="mr-4">
                          <div className="text-xs text-gray-500">Patient ID</div>
                          <div className="text-xs font-mono text-gray-700 mt-1">{patient.id.substring(0, 8)}...</div>
                        </div>
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
