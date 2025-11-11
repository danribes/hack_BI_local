/**
 * Cycle Management Component
 *
 * Displays current cycle and provides "Next Cycle" button to advance the entire cohort
 */

import { useState, useEffect } from 'react';
import { Play, RotateCcw, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

interface CycleMetadata {
  id: number;
  current_cycle: number;
  total_cycles: number;
  cycle_duration_months: number;
  simulation_start_date: string;
  last_advance_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AdvanceResult {
  new_cycle: number;
  patients_processed: number;
  transitions_detected: number;
  alerts_generated: number;
  treatment_changes: number;
  processing_time_ms: number;
}

export default function CycleManagement() {
  const [cycleMetadata, setCycleMetadata] = useState<CycleMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastResult, setLastResult] = useState<AdvanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch current cycle on mount
  useEffect(() => {
    fetchCurrentCycle();
  }, []);

  const fetchCurrentCycle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/progression/current-cycle`);

      if (!response.ok) {
        throw new Error('Failed to fetch current cycle');
      }

      const data = await response.json();
      setCycleMetadata(data.cycle_metadata);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching current cycle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceCycle = async () => {
    if (!cycleMetadata) return;

    if (cycleMetadata.current_cycle >= cycleMetadata.total_cycles) {
      setError('Maximum cycles reached (24 months)');
      return;
    }

    try {
      setAdvancing(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/progression/advance-cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to advance cycle');
      }

      const data = await response.json();
      setLastResult(data.result);

      // Refresh cycle metadata
      await fetchCurrentCycle();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error advancing cycle:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleResetSimulation = async () => {
    if (!confirm('Are you sure you want to reset the simulation? This will delete all progression data and start from cycle 0.')) {
      return;
    }

    try {
      setResetting(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/progression/reset-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset simulation');
      }

      setLastResult(null);
      await fetchCurrentCycle();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error resetting simulation:', err);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-gray-600">Loading cycle information...</span>
        </div>
      </div>
    );
  }

  if (!cycleMetadata) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-red-600">
          <p>Unable to load cycle metadata</p>
          {error && <p className="text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const progressPercentage = (cycleMetadata.current_cycle / cycleMetadata.total_cycles) * 100;
  const canAdvance = cycleMetadata.current_cycle < cycleMetadata.total_cycles;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Simulation Timeline</h2>
            <p className="text-sm text-gray-600">Cohort-wide disease progression tracking</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-bold text-indigo-600">
            {cycleMetadata.current_cycle} / {cycleMetadata.total_cycles}
          </div>
          <div className="text-sm text-gray-600">Months</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Last Result Display */}
      {lastResult && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <h3 className="font-semibold text-green-800 mb-2">
            Cycle {lastResult.new_cycle} Complete
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Patients</div>
              <div className="text-lg font-bold text-gray-800">{lastResult.patients_processed}</div>
            </div>
            <div>
              <div className="text-gray-600">Transitions</div>
              <div className="text-lg font-bold text-orange-600">{lastResult.transitions_detected}</div>
            </div>
            <div>
              <div className="text-gray-600">Alerts</div>
              <div className="text-lg font-bold text-red-600">{lastResult.alerts_generated}</div>
            </div>
            <div>
              <div className="text-gray-600">Treatment Changes</div>
              <div className="text-lg font-bold text-blue-600">{lastResult.treatment_changes}</div>
            </div>
            <div>
              <div className="text-gray-600">Processing Time</div>
              <div className="text-lg font-bold text-gray-800">{(lastResult.processing_time_ms / 1000).toFixed(2)}s</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleAdvanceCycle}
          disabled={advancing || !canAdvance}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-semibold transition-all ${
            canAdvance && !advancing
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {advancing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Advancing Cycle...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Next Cycle</span>
              <TrendingUp className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={handleResetSimulation}
          disabled={resetting || advancing}
          className="flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {resetting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Resetting...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-semibold">Simulation Start:</span>{' '}
            {new Date(cycleMetadata.simulation_start_date).toLocaleDateString()}
          </div>
          {cycleMetadata.last_advance_date && (
            <div>
              <span className="font-semibold">Last Advance:</span>{' '}
              {new Date(cycleMetadata.last_advance_date).toLocaleString()}
            </div>
          )}
        </div>
        <div className="mt-2 text-gray-500">
          Each cycle represents {cycleMetadata.cycle_duration_months} month(s) of disease progression.
          The "Next Cycle" button generates lab data for all patients and triggers alerts based on health state changes.
        </div>
      </div>
    </div>
  );
}
