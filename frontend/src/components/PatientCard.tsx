import { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onAnalyze: (patientId: string) => void;
  isAnalyzing?: boolean;
}

function PatientCard({ patient, onAnalyze, isAnalyzing = false }: PatientCardProps) {
  // Determine risk color based on tier
  const getRiskColor = (tier: number): string => {
    switch (tier) {
      case 1:
        return 'bg-green-100 border-green-500 text-green-800';
      case 2:
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 3:
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getRiskLabel = (tier: number): string => {
    switch (tier) {
      case 1:
        return 'Low Risk';
      case 2:
        return 'Moderate Risk';
      case 3:
        return 'High Risk';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-indigo-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{patient.full_name}</h3>
          <p className="text-sm text-gray-600">MRN: {patient.medical_record_number}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getRiskColor(patient.risk_tier)}`}>
          {getRiskLabel(patient.risk_tier)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Age / Gender</p>
          <p className="font-semibold text-gray-900">{patient.age} / {patient.gender}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">CKD Stage</p>
          <p className="font-semibold text-gray-900">Stage {patient.ckd_stage}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">eGFR</p>
          <p className="font-semibold text-gray-900">{patient.latest_eGFR} mL/min</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">uACR</p>
          <p className="font-semibold text-gray-900">{patient.latest_uACR} mg/g</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {patient.has_diabetes && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
            Diabetes
          </span>
        )}
        {patient.has_hypertension && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
            Hypertension
          </span>
        )}
      </div>

      <button
        onClick={() => onAnalyze(patient.id)}
        disabled={isAnalyzing}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
          isAnalyzing
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </span>
        ) : (
          '🤖 Analyze Risk with AI'
        )}
      </button>
    </div>
  );
}

export default PatientCard;
