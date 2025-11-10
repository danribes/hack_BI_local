import { useState } from 'react';
import { AlertCircle, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp } from 'lucide-react';

export interface EnhancedPatientData {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';

  // Kidney Function
  ckdStage: number; // 0 = No CKD, 1-5 = CKD stages
  eGFR: number;
  eGFRTrend?: 'up' | 'down' | 'stable';
  eGFRChange?: number; // percentage change
  serumCreatinine: number;
  uACR: number;
  proteinuriaCategory?: 'A1' | 'A2' | 'A3';
  bun?: number;

  // Cardiovascular & Metabolic
  systolicBP: number;
  diastolicBP: number;
  hba1c?: number;
  ldl?: number;
  hdl?: number;

  // Anthropometric
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;

  // Hematology & Minerals
  hemoglobin?: number;
  potassium?: number;
  calcium?: number;
  phosphorus?: number;
  albumin?: number;

  // Comorbidities
  comorbidities: string[];
  smokingStatus?: 'Never' | 'Former' | 'Current';
  cvdHistory?: boolean;
  familyHistoryESRD?: boolean;

  // Medications & Management
  onRASInhibitor?: boolean;
  onSGLT2i?: boolean;
  nephrotoxicMeds?: boolean;
  nephrologistReferral?: boolean;

  // Clinical Tracking
  diagnosisDuration?: string; // e.g., "2.5 years"
  lastVisit?: string;
  nextVisit?: string;
}

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (!trend) return null;
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const colors = {
    Low: 'bg-green-100 text-green-800 border-green-300',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Critical: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[risk as keyof typeof colors]}`}>
      {risk} Risk
    </span>
  );
};

const StageBadge = ({ stage }: { stage: number }) => {
  if (stage === 0) {
    return (
      <span className="bg-green-600 text-white px-3 py-1 rounded-md font-bold text-sm">
        No CKD
      </span>
    );
  }

  const colors = ['bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
  const stageIndex = Math.min(Math.max(stage - 1, 0), 4);
  return (
    <span className={`${colors[stageIndex]} text-white px-3 py-1 rounded-md font-bold text-sm`}>
      Stage {stage}
    </span>
  );
};

const AlertBadge = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-semibold">
    <AlertCircle className="w-3 h-3" />
    {text}
  </div>
);

const MedBadge = ({ active, label }: { active: boolean; label: string }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
    active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
  }`}>
    {label}
  </span>
);

interface EnhancedCKDPatientCardProps {
  patient: EnhancedPatientData;
  defaultExpanded?: boolean;
}

const EnhancedCKDPatientCard: React.FC<EnhancedCKDPatientCardProps> = ({
  patient,
  defaultExpanded = false
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Determine if values are out of normal range
  const isHighPotassium = (patient.potassium ?? 0) > 5.5;
  const isLowHemoglobin = (patient.hemoglobin ?? 15) < 11;
  const isHighBP = patient.systolicBP > 140 || patient.diastolicBP > 90;
  const isHighPhosphorus = (patient.phosphorus ?? 0) > 4.5 && patient.ckdStage >= 3;

  // Calculate BMI if not provided
  const calculatedBMI = patient.bmi ?? (
    patient.weight && patient.height
      ? Number((patient.weight / Math.pow(patient.height / 100, 2)).toFixed(2))
      : undefined
  );

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-indigo-500 p-4 hover:shadow-lg transition-shadow">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{patient.name}</h3>
          <p className="text-xs text-gray-600">MRN: {patient.mrn}</p>
        </div>
        <RiskBadge risk={patient.riskLevel} />
      </div>

      {/* Demographics & Primary Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase">Age / Gender</p>
          <p className="text-base font-semibold">{patient.age} / {patient.gender}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">CKD Stage</p>
          <StageBadge stage={patient.ckdStage} />
        </div>
      </div>

      {/* Anthropometric - if available */}
      {(patient.weight || patient.height || calculatedBMI) && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg mb-3 border border-indigo-200">
          <div className="grid grid-cols-3 gap-3">
            {patient.weight && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Weight</p>
                <p className="text-lg font-bold text-gray-800">{patient.weight} kg</p>
              </div>
            )}
            {patient.height && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Height</p>
                <p className="text-lg font-bold text-gray-800">{patient.height} cm</p>
              </div>
            )}
            {calculatedBMI && (
              <div className={`${calculatedBMI >= 30 ? 'text-orange-800' : calculatedBMI >= 25 ? 'text-yellow-800' : 'text-green-800'}`}>
                <p className="text-xs font-medium">BMI</p>
                <p className="text-lg font-bold">{calculatedBMI.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Clinical Values */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-blue-50 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">eGFR</p>
            {patient.eGFRTrend && patient.eGFRChange !== undefined && (
              <div className="flex items-center gap-1">
                <TrendIcon trend={patient.eGFRTrend} />
                <span className="text-xs text-gray-500">{patient.eGFRChange > 0 ? '+' : ''}{patient.eGFRChange}%</span>
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-gray-800">{patient.eGFR}</p>
          <p className="text-xs text-gray-500">mL/min</p>
        </div>

        <div className="bg-purple-50 p-2 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">uACR</p>
          <p className="text-xl font-bold text-gray-800">{patient.uACR}</p>
          <p className="text-xs text-gray-500">mg/g {patient.proteinuriaCategory ? `(${patient.proteinuriaCategory})` : ''}</p>
        </div>

        <div className={`p-2 rounded-lg ${isHighBP ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">BP</p>
            {isHighBP && <AlertCircle className="w-3 h-3 text-red-600" />}
          </div>
          <p className="text-xl font-bold text-gray-800">{patient.systolicBP}/{patient.diastolicBP}</p>
          <p className="text-xs text-gray-500">mmHg</p>
        </div>
      </div>

      {/* Alerts Row */}
      {(isHighPotassium || isLowHemoglobin || patient.nephrotoxicMeds || isHighPhosphorus) && (
        <div className="flex flex-wrap gap-1 mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
          {isHighPotassium && <AlertBadge text={`High K+ (${patient.potassium})`} />}
          {isLowHemoglobin && <AlertBadge text={`Anemia (Hb ${patient.hemoglobin})`} />}
          {isHighPhosphorus && <AlertBadge text="High Phosphorus" />}
          {patient.nephrotoxicMeds && <AlertBadge text="Nephrotoxic Meds" />}
        </div>
      )}

      {/* Comorbidities */}
      {patient.comorbidities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {patient.comorbidities.map((condition) => (
            <span key={condition} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              {condition}
            </span>
          ))}
          {patient.cvdHistory && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              CVD History
            </span>
          )}
          {patient.smokingStatus === 'Current' && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
              Current Smoker
            </span>
          )}
        </div>
      )}

      {/* Medications */}
      <div className="flex gap-2 mb-3">
        {patient.onRASInhibitor !== undefined && <MedBadge active={patient.onRASInhibitor} label="RAS Inhibitor" />}
        {patient.onSGLT2i !== undefined && <MedBadge active={patient.onSGLT2i} label="SGLT2i" />}
        {!patient.nephrologistReferral && patient.ckdStage >= 4 && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-semibold">
            ⚠️ Nephrology Referral Needed
          </span>
        )}
      </div>

      {/* Expandable Section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? 'Show Less' : 'Show Detailed Labs'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {/* Detailed Labs */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Laboratory Values</h4>
            <div className="grid grid-cols-3 gap-2">
              {patient.serumCreatinine && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Creatinine</p>
                  <p className="text-base font-bold text-gray-900">{patient.serumCreatinine}</p>
                  <p className="text-xs text-gray-500">mg/dL</p>
                </div>
              )}

              {patient.bun && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">BUN</p>
                  <p className="text-base font-bold text-gray-900">{patient.bun}</p>
                  <p className="text-xs text-gray-500">mg/dL</p>
                </div>
              )}

              {patient.hemoglobin && (
                <div className={`p-2 rounded ${isLowHemoglobin ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">Hemoglobin</p>
                  <p className="text-base font-bold text-gray-900">{patient.hemoglobin}</p>
                  <p className="text-xs text-gray-500">g/dL</p>
                </div>
              )}

              {patient.potassium && (
                <div className={`p-2 rounded ${isHighPotassium ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">Potassium</p>
                  <p className="text-base font-bold text-gray-900">{patient.potassium}</p>
                  <p className="text-xs text-gray-500">mEq/L</p>
                </div>
              )}

              {patient.calcium && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Calcium</p>
                  <p className="text-base font-bold text-gray-900">{patient.calcium}</p>
                  <p className="text-xs text-gray-500">mg/dL</p>
                </div>
              )}

              {patient.phosphorus && (
                <div className={`p-2 rounded ${isHighPhosphorus ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">Phosphorus</p>
                  <p className="text-base font-bold text-gray-900">{patient.phosphorus}</p>
                  <p className="text-xs text-gray-500">mg/dL</p>
                </div>
              )}

              {patient.albumin && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Albumin</p>
                  <p className="text-base font-bold text-gray-900">{patient.albumin}</p>
                  <p className="text-xs text-gray-500">g/dL</p>
                </div>
              )}
            </div>
          </div>

          {/* Metabolic */}
          {(patient.hba1c || patient.ldl || patient.hdl) && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Metabolic & Cardiovascular</h4>
              <div className="grid grid-cols-3 gap-2">
                {patient.hba1c && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">HbA1c</p>
                    <p className="text-base font-bold text-gray-900">{patient.hba1c}%</p>
                  </div>
                )}

                {patient.ldl && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">LDL</p>
                    <p className="text-base font-bold text-gray-900">{patient.ldl}</p>
                    <p className="text-xs text-gray-500">mg/dL</p>
                  </div>
                )}

                {patient.hdl && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">HDL</p>
                    <p className="text-base font-bold text-gray-900">{patient.hdl}</p>
                    <p className="text-xs text-gray-500">mg/dL</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinical Timeline */}
          {(patient.diagnosisDuration || patient.lastVisit || patient.nextVisit) && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Clinical Timeline</h4>
              <div className="grid grid-cols-3 gap-2">
                {patient.diagnosisDuration && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="text-sm font-bold">{patient.diagnosisDuration}</p>
                  </div>
                )}

                {patient.lastVisit && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Last Visit</p>
                    <p className="text-sm font-bold">{patient.lastVisit}</p>
                  </div>
                )}

                {patient.nextVisit && (
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Next Visit</p>
                    <p className="text-sm font-bold">{patient.nextVisit}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCKDPatientCard;
