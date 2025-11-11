import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Patient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
}

interface HealthState {
  id?: string;
  patient_id: string;
  measured_at: string;
  cycle_number: number;
  egfr_value: number;
  uacr_value: number | null;
  gfr_category: string;
  albuminuria_category: string;
  health_state: string;
  risk_level: string;
  risk_color: string;
  ckd_stage: number | null;
  ckd_stage_name: string;
  requires_nephrology_referral: boolean;
  requires_dialysis_planning: boolean;
  recommend_ras_inhibitor: boolean;
  recommend_sglt2i: boolean;
  target_bp: string;
  monitoring_frequency: string;
}

interface TransitionDetails {
  from_state: string;
  to_state: string;
  change_type: 'improved' | 'worsened' | 'stable';
  alert_generated: boolean;
  alert_severity?: 'critical' | 'warning' | 'info';
}

export default function ProgressionTimeline() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per cycle
  const [healthStates, setHealthStates] = useState<Map<number, HealthState>>(new Map());
  const [transitions, setTransitions] = useState<Map<number, TransitionDetails>>(new Map());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxCycle = 24;

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/patients`);
        if (!response.ok) throw new Error('Failed to fetch patients');
        const data = await response.json();

        // Ensure data is an array before slicing
        const patientsArray = Array.isArray(data) ? data : [];
        setPatients(patientsArray.slice(0, 20)); // Show first 20 for demo

        if (patientsArray.length > 0) {
          setSelectedPatientId(patientsArray[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patients');
      }
    };
    fetchPatients();
  }, []);

  // Initialize baseline when patient changes
  useEffect(() => {
    if (!selectedPatientId) return;

    const initializePatient = async () => {
      setLoading(true);
      setError(null);
      setHealthStates(new Map());
      setTransitions(new Map());
      setCurrentCycle(0);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        // Initialize baseline (cycle 0)
        const response = await fetch(`${apiUrl}/api/progression/patient/${selectedPatientId}/initialize`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Failed to initialize baseline');
        }

        const data = await response.json();
        const cycleData = data.cycle;

        // Convert classification to HealthState format
        const baseline: HealthState = {
          patient_id: selectedPatientId,
          measured_at: cycleData.measured_at,
          cycle_number: cycleData.cycle_number,
          egfr_value: cycleData.egfr_value,
          uacr_value: cycleData.uacr_value,
          gfr_category: cycleData.classification.gfrCategory,
          albuminuria_category: cycleData.classification.albuminuriaCategory,
          health_state: cycleData.classification.healthState,
          risk_level: cycleData.classification.riskLevel,
          risk_color: cycleData.classification.riskColor,
          ckd_stage: cycleData.classification.ckdStage,
          ckd_stage_name: cycleData.classification.ckdStageName || `CKD Stage ${cycleData.classification.ckdStage || 'N/A'}`,
          requires_nephrology_referral: cycleData.classification.requiresNephrologyReferral,
          requires_dialysis_planning: cycleData.classification.requiresDialysisPlanning,
          recommend_ras_inhibitor: cycleData.classification.recommendRASInhibitor || false,
          recommend_sglt2i: cycleData.classification.recommendSGLT2i || false,
          target_bp: cycleData.classification.targetBP || '<130/80',
          monitoring_frequency: cycleData.classification.monitoringFrequency || 'Every 6-12 months'
        };

        setHealthStates(new Map([[0, baseline]]));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize patient');
      } finally {
        setLoading(false);
      }
    };

    initializePatient();
  }, [selectedPatientId]);

  // Generate next cycle when navigating forward
  const generateNextCycle = async (targetCycle: number): Promise<boolean> => {
    if (!selectedPatientId) return false;
    if (healthStates.has(targetCycle)) return true; // Already generated

    const previousCycle = targetCycle - 1;
    if (!healthStates.has(previousCycle)) {
      console.error(`Cannot generate cycle ${targetCycle} without cycle ${previousCycle}`);
      return false;
    }

    setGenerating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/progression/patient/${selectedPatientId}/next-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCycle: previousCycle })
      });

      if (!response.ok) {
        throw new Error('Failed to generate next cycle');
      }

      const data = await response.json();
      const cycleData = data.cycle;

      // Convert to HealthState format
      const newState: HealthState = {
        patient_id: selectedPatientId,
        measured_at: cycleData.measured_at,
        cycle_number: cycleData.cycle_number,
        egfr_value: cycleData.egfr_value,
        uacr_value: cycleData.uacr_value,
        gfr_category: cycleData.classification.gfrCategory,
        albuminuria_category: cycleData.classification.albuminuriaCategory,
        health_state: cycleData.classification.healthState,
        risk_level: cycleData.classification.riskLevel,
        risk_color: cycleData.classification.riskColor,
        ckd_stage: cycleData.classification.ckdStage,
        ckd_stage_name: cycleData.classification.ckdStageName || `CKD Stage ${cycleData.classification.ckdStage || 'N/A'}`,
        requires_nephrology_referral: cycleData.classification.requiresNephrologyReferral,
        requires_dialysis_planning: cycleData.classification.requiresDialysisPlanning,
        recommend_ras_inhibitor: cycleData.classification.recommendRASInhibitor || false,
        recommend_sglt2i: cycleData.classification.recommendSGLT2i || false,
        target_bp: cycleData.classification.targetBP || '<130/80',
        monitoring_frequency: cycleData.classification.monitoringFrequency || 'Every 6-12 months'
      };

      // Store new state
      setHealthStates(prev => new Map(prev).set(targetCycle, newState));

      // Store transition if detected
      if (cycleData.transition_detected && cycleData.transition_details) {
        setTransitions(prev => new Map(prev).set(targetCycle, cycleData.transition_details));
      }

      return true;
    } catch (err) {
      console.error('Error generating next cycle:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate next cycle');
      return false;
    } finally {
      setGenerating(false);
    }
  };

  // Auto-play functionality with dynamic generation
  useEffect(() => {
    if (!isPlaying) return;

    const advance = async () => {
      if (currentCycle >= maxCycle) {
        setIsPlaying(false);
        return;
      }

      const nextCycle = currentCycle + 1;

      // Generate next cycle if needed
      if (!healthStates.has(nextCycle)) {
        const success = await generateNextCycle(nextCycle);
        if (!success) {
          setIsPlaying(false);
          return;
        }
      }

      setCurrentCycle(nextCycle);
    };

    const interval = setInterval(advance, playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, currentCycle, playbackSpeed, maxCycle, healthStates, selectedPatientId]);

  const handlePlayPause = () => {
    if (currentCycle >= maxCycle) {
      setCurrentCycle(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePreviousCycle = () => {
    setCurrentCycle((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const handleNextCycle = async () => {
    if (currentCycle >= maxCycle) return;

    const nextCycle = currentCycle + 1;

    // Generate next cycle if needed
    if (!healthStates.has(nextCycle)) {
      await generateNextCycle(nextCycle);
    }

    setCurrentCycle(nextCycle);
    setIsPlaying(false);
  };

  const handleFirstCycle = () => {
    setCurrentCycle(0);
    setIsPlaying(false);
  };

  const handleLastCycle = async () => {
    // Generate all cycles up to maxCycle
    for (let cycle = currentCycle + 1; cycle <= maxCycle; cycle++) {
      if (!healthStates.has(cycle)) {
        await generateNextCycle(cycle);
      }
    }
    setCurrentCycle(maxCycle);
    setIsPlaying(false);
  };

  const handleSliderChange = async (newCycle: number) => {
    // If moving forward, generate cycles as needed
    if (newCycle > currentCycle) {
      for (let cycle = currentCycle + 1; cycle <= newCycle; cycle++) {
        if (!healthStates.has(cycle)) {
          await generateNextCycle(cycle);
        }
      }
    }
    setCurrentCycle(newCycle);
    setIsPlaying(false);
  };

  const currentState = healthStates.get(currentCycle);
  const previousState = healthStates.get(currentCycle - 1);
  const transitionAtCycle = transitions.get(currentCycle);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const getRiskColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getChangeIcon = (change: number) => {
    if (Math.abs(change) < 1) return '→';
    return change > 0 ? '↑' : '↓';
  };

  const getChangeColor = (change: number, isEgfr: boolean) => {
    if (Math.abs(change) < 1) return 'text-gray-600';
    // For eGFR, increase is good, decrease is bad
    // For uACR, decrease is good, increase is bad
    if (isEgfr) {
      return change > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return change < 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-2">📈 CKD Progression Timeline</h2>
        <p className="text-indigo-100">
          Navigate through 24 months of patient progression data - each cycle generates dynamically with AI-powered monitoring
        </p>
      </div>

      {/* Patient Selector */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Patient
        </label>
        <select
          value={selectedPatientId || ''}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.medical_record_number} - {patient.first_name} {patient.last_name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-gray-600">Initializing patient progression...</span>
        </div>
      )}

      {!loading && !error && healthStates.size > 0 && (
        <>
          {/* Timeline Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {generating && (
              <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center text-indigo-800">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  <span className="text-sm font-medium">Generating progression data with AI monitoring...</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Month {currentCycle} of {maxCycle}
                  {healthStates.size < maxCycle + 1 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({healthStates.size} / {maxCycle + 1} cycles generated)
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  {currentState ? new Date(currentState.measured_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${(currentCycle / maxCycle) * 100}%` }}
                />
              </div>

              {/* Cycle Markers */}
              <div className="relative mt-2 h-6">
                {[0, 6, 12, 18, 24].map((marker) => (
                  <button
                    key={marker}
                    onClick={() => handleSliderChange(marker)}
                    className="absolute transform -translate-x-1/2 text-xs text-gray-600 hover:text-indigo-600 font-medium"
                    style={{ left: `${(marker / maxCycle) * 100}%` }}
                  >
                    {marker}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max={maxCycle}
              value={currentCycle}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              disabled={generating}
            />

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={handleFirstCycle}
                disabled={currentCycle === 0 || generating}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First cycle"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handlePreviousCycle}
                disabled={currentCycle === 0 || generating}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous month"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={generating}
                className="p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button
                onClick={handleNextCycle}
                disabled={currentCycle === maxCycle || generating}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next month"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={handleLastCycle}
                disabled={currentCycle === maxCycle || generating}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last cycle"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>

            {/* Playback Speed */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-sm text-gray-600">Playback Speed:</span>
              <div className="flex gap-2">
                {[
                  { label: '0.5x', value: 2000 },
                  { label: '1x', value: 1000 },
                  { label: '2x', value: 500 },
                  { label: '4x', value: 250 }
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setPlaybackSpeed(value)}
                    disabled={generating}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                      playbackSpeed === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current State Display */}
          {currentState && selectedPatient && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h3>
                  <p className="text-gray-600">{selectedPatient.medical_record_number}</p>
                </div>
                <div className={`px-6 py-3 rounded-lg border-2 font-bold text-lg ${getRiskColorClass(currentState.risk_color)}`}>
                  {currentState.health_state}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* eGFR Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 mb-1">eGFR</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {currentState.egfr_value.toFixed(1)}
                    {previousState && (
                      <span className={`ml-2 text-lg ${getChangeColor(currentState.egfr_value - previousState.egfr_value, true)}`}>
                        {getChangeIcon(currentState.egfr_value - previousState.egfr_value)}
                        {Math.abs(currentState.egfr_value - previousState.egfr_value).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    mL/min/1.73m² • {currentState.gfr_category}
                  </div>
                </div>

                {/* uACR Card */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="text-sm font-medium text-amber-700 mb-1">uACR</div>
                  <div className="text-3xl font-bold text-amber-900">
                    {currentState.uacr_value?.toFixed(1) || 'N/A'}
                    {previousState && currentState.uacr_value && previousState.uacr_value && (
                      <span className={`ml-2 text-lg ${getChangeColor(currentState.uacr_value - previousState.uacr_value, false)}`}>
                        {getChangeIcon(currentState.uacr_value - previousState.uacr_value)}
                        {Math.abs(currentState.uacr_value - previousState.uacr_value).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-amber-700 mt-1">
                    mg/g • {currentState.albuminuria_category}
                  </div>
                </div>

                {/* CKD Stage Card */}
                <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                  currentState.risk_color === 'red' ? 'from-red-50 to-red-100 border-red-200' :
                  currentState.risk_color === 'orange' ? 'from-orange-50 to-orange-100 border-orange-200' :
                  currentState.risk_color === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
                  'from-green-50 to-green-100 border-green-200'
                }`}>
                  <div className={`text-sm font-medium mb-1 ${
                    currentState.risk_color === 'red' ? 'text-red-700' :
                    currentState.risk_color === 'orange' ? 'text-orange-700' :
                    currentState.risk_color === 'yellow' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    CKD Stage
                  </div>
                  <div className={`text-3xl font-bold ${
                    currentState.risk_color === 'red' ? 'text-red-900' :
                    currentState.risk_color === 'orange' ? 'text-orange-900' :
                    currentState.risk_color === 'yellow' ? 'text-yellow-900' :
                    'text-green-900'
                  }`}>
                    {currentState.ckd_stage || 'N/A'}
                  </div>
                  <div className={`text-sm mt-1 ${
                    currentState.risk_color === 'red' ? 'text-red-700' :
                    currentState.risk_color === 'orange' ? 'text-orange-700' :
                    currentState.risk_color === 'yellow' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {currentState.ckd_stage_name}
                  </div>
                </div>
              </div>

              {/* Transition Alert */}
              {transitionAtCycle && transitionAtCycle.alert_generated && (
                <div className={`mt-6 p-4 rounded-lg border-l-4 ${
                  transitionAtCycle.alert_severity === 'critical' ? 'bg-red-50 border-red-500' :
                  transitionAtCycle.alert_severity === 'warning' ? 'bg-orange-50 border-orange-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">
                      {transitionAtCycle.alert_severity === 'critical' ? '🚨' :
                       transitionAtCycle.alert_severity === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <h4 className={`font-bold mb-1 ${
                        transitionAtCycle.alert_severity === 'critical' ? 'text-red-800' :
                        transitionAtCycle.alert_severity === 'warning' ? 'text-orange-800' :
                        'text-blue-800'
                      }`}>
                        AI Detected State Transition
                      </h4>
                      <p className={`text-sm ${
                        transitionAtCycle.alert_severity === 'critical' ? 'text-red-700' :
                        transitionAtCycle.alert_severity === 'warning' ? 'text-orange-700' :
                        'text-blue-700'
                      }`}>
                        Health state changed from <strong>{transitionAtCycle.from_state}</strong> to{' '}
                        <strong>{transitionAtCycle.to_state}</strong> ({transitionAtCycle.change_type})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentState.requires_nephrology_referral && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center text-purple-800">
                      <span className="mr-2">🏥</span>
                      <span className="font-medium">Nephrology Referral Recommended</span>
                    </div>
                  </div>
                )}

                {currentState.requires_dialysis_planning && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center text-red-800">
                      <span className="mr-2">🚨</span>
                      <span className="font-medium">Dialysis Planning Required</span>
                    </div>
                  </div>
                )}

                {currentState.recommend_ras_inhibitor && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center text-blue-800">
                      <span className="mr-2">💊</span>
                      <span className="font-medium">RAS Inhibitor Recommended</span>
                    </div>
                  </div>
                )}

                {currentState.recommend_sglt2i && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center text-green-800">
                      <span className="mr-2">💊</span>
                      <span className="font-medium">SGLT2i Recommended</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Details */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Target BP:</span>
                  <span className="ml-2 text-gray-900">{currentState.target_bp}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Monitoring:</span>
                  <span className="ml-2 text-gray-900">{currentState.monitoring_frequency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mini Chart */}
          {healthStates.size > 1 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">eGFR Trend</h3>
              <div className="relative h-32">
                <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="1000"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                  ))}

                  {/* eGFR line */}
                  <polyline
                    points={Array.from(healthStates.entries())
                      .sort((a, b) => a[0] - b[0])
                      .map(([cycle, state]) => {
                        const x = (cycle / maxCycle) * 1000;
                        const y = 100 - ((state.egfr_value / 100) * 100);
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                  />

                  {/* Current position marker */}
                  {currentState && (
                    <circle
                      cx={(currentCycle / maxCycle) * 1000}
                      cy={100 - ((currentState.egfr_value / 100) * 100)}
                      r="5"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Month 0</span>
                <span>Month 24</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
