/**
 * Patient Evolution Chart
 *
 * Visualizes patient's lab values (eGFR, uACR) and health states over time
 * Shows treatment status and adherence
 */

import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Pill, Activity } from 'lucide-react';

interface HealthStateHistory {
  cycle_number: number;
  measured_at: string;
  egfr_value: number;
  uacr_value: number;
  health_state: string;
  risk_level: string;
  risk_color: string;
  is_treated: boolean;
  average_adherence: number | null;
  active_treatments: string[];
}

interface Treatment {
  id: string;
  medication_name: string;
  medication_class: string;
  started_cycle: number;
  current_adherence: number;
  status: string;
}

interface Props {
  patientId: string;
  patientName: string;
}

export default function PatientEvolutionChart({ patientId, patientName }: Props) {
  const [history, setHistory] = useState<HealthStateHistory[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'egfr' | 'uacr'>('egfr');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch progression history
      const historyResponse = await fetch(`${API_URL}/api/progression/patient/${patientId}`);
      if (!historyResponse.ok) throw new Error('Failed to fetch history');
      const historyData = await historyResponse.json();

      // Fetch treatments
      const treatmentsResponse = await fetch(`${API_URL}/api/progression/patient/${patientId}/treatments`);
      if (!treatmentsResponse.ok) throw new Error('Failed to fetch treatments');
      const treatmentsData = await treatmentsResponse.json();

      setHistory(historyData.progression_history || []);
      setTreatments(treatmentsData.treatments || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-gray-600">Loading patient data...</span>
        </div>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Patient Evolution: {patientName}
        </h3>
        <div className="text-center text-gray-600 py-8">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p>No progression data available yet. Click "Next Cycle" to generate data.</p>
          )}
        </div>
      </div>
    );
  }

  // Calculate metrics
  const firstReading = history[0];
  const lastReading = history[history.length - 1];

  const egfrChange = lastReading.egfr_value - firstReading.egfr_value;
  const uacrChange = lastReading.uacr_value - firstReading.uacr_value;
  const uacrPercentChange = ((uacrChange / firstReading.uacr_value) * 100);

  // Calculate min/max for scaling
  const egfrValues = history.map(h => h.egfr_value);
  const uacrValues = history.map(h => h.uacr_value);

  const egfrMin = Math.min(...egfrValues) * 0.9;
  const egfrMax = Math.max(...egfrValues) * 1.1;
  const uacrMin = Math.min(...uacrValues) * 0.8;
  const uacrMax = Math.max(...uacrValues) * 1.2;

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };

  const xScale = (cycle: number) => {
    const maxCycle = Math.max(...history.map(h => h.cycle_number));
    return padding.left + ((cycle / maxCycle) * (chartWidth - padding.left - padding.right));
  };

  const yScaleEgfr = (value: number) => {
    return chartHeight - padding.bottom - (((value - egfrMin) / (egfrMax - egfrMin)) * (chartHeight - padding.top - padding.bottom));
  };

  const yScaleUacr = (value: number) => {
    return chartHeight - padding.bottom - (((value - uacrMin) / (uacrMax - uacrMin)) * (chartHeight - padding.top - padding.bottom));
  };

  const yScale = selectedMetric === 'egfr' ? yScaleEgfr : yScaleUacr;
  const values = selectedMetric === 'egfr' ? egfrValues : uacrValues;
  const minValue = selectedMetric === 'egfr' ? egfrMin : uacrMin;
  const maxValue = selectedMetric === 'egfr' ? egfrMax : uacrMax;

  // Generate path for line chart
  const generatePath = () => {
    return history.map((h, i) => {
      const x = xScale(h.cycle_number);
      const y = yScale(selectedMetric === 'egfr' ? h.egfr_value : h.uacr_value);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const activeTreatments = treatments.filter(t => t.status === 'active');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Patient Evolution: {patientName}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-1" />
            <span>{history.length} measurements</span>
          </div>
          <div className="flex items-center">
            <Pill className="w-4 h-4 mr-1" />
            <span>{activeTreatments.length} active treatment(s)</span>
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setSelectedMetric('egfr')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            selectedMetric === 'egfr'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          eGFR
        </button>
        <button
          onClick={() => setSelectedMetric('uacr')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            selectedMetric === 'uacr'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          uACR
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* eGFR Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">eGFR</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-800">
              {lastReading.egfr_value.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">mL/min/1.73m²</span>
          </div>
          <div className={`flex items-center mt-2 text-sm font-semibold ${
            egfrChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {egfrChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span>{egfrChange >= 0 ? '+' : ''}{egfrChange.toFixed(1)} from baseline</span>
          </div>
        </div>

        {/* uACR Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">uACR</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-800">
              {lastReading.uacr_value.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">mg/g</span>
          </div>
          <div className={`flex items-center mt-2 text-sm font-semibold ${
            uacrChange <= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {uacrChange <= 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
            <span>{uacrPercentChange >= 0 ? '+' : ''}{uacrPercentChange.toFixed(1)}% from baseline</span>
          </div>
        </div>

        {/* Health State Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Health State</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-800">
              {lastReading.health_state}
            </span>
          </div>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              lastReading.risk_color === 'green' ? 'bg-green-100 text-green-800' :
              lastReading.risk_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              lastReading.risk_color === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {lastReading.risk_level.toUpperCase()} RISK
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = chartHeight - padding.bottom - ((percent / 100) * (chartHeight - padding.top - padding.bottom));
            const value = minValue + ((maxValue - minValue) * (percent / 100));

            return (
              <g key={percent}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {value.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {history.filter((_, i) => i % Math.ceil(history.length / 6) === 0).map((h) => {
            const x = xScale(h.cycle_number);
            return (
              <text
                key={h.cycle_number}
                x={x}
                y={chartHeight - padding.bottom + 25}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                M{h.cycle_number}
              </text>
            );
          })}

          {/* Line chart */}
          <path
            d={generatePath()}
            fill="none"
            stroke={selectedMetric === 'egfr' ? '#4f46e5' : '#9333ea'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {history.map((h) => {
            const x = xScale(h.cycle_number);
            const y = yScale(selectedMetric === 'egfr' ? h.egfr_value : h.uacr_value);

            return (
              <circle
                key={h.cycle_number}
                cx={x}
                cy={y}
                r={h.is_treated ? 6 : 4}
                fill={h.is_treated ? '#10b981' : (selectedMetric === 'egfr' ? '#4f46e5' : '#9333ea')}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Treatment markers */}
          {treatments.filter(t => t.status === 'active').map((t) => {
            const x = xScale(t.started_cycle);
            return (
              <g key={t.id}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.5"
                />
                <text
                  x={x}
                  y={padding.top - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#10b981"
                  fontWeight="bold"
                >
                  Rx
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              selectedMetric === 'egfr' ? 'bg-indigo-600' : 'bg-purple-600'
            }`}></div>
            <span className="text-gray-600">{selectedMetric === 'egfr' ? 'eGFR' : 'uACR'} value</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-600">On treatment</span>
          </div>
          <div className="flex items-center">
            <div className="w-0.5 h-4 bg-green-500 mr-2" style={{ borderLeft: '2px dashed #10b981' }}></div>
            <span className="text-gray-600">Treatment start</span>
          </div>
        </div>
      </div>

      {/* Active Treatments */}
      {activeTreatments.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
            <Pill className="w-5 h-5 mr-2" />
            Active Treatments
          </h4>
          <div className="space-y-2">
            {activeTreatments.map((t) => (
              <div key={t.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{t.medication_name}</div>
                  <div className="text-sm text-gray-600">{t.medication_class.replace(/_/g, ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Adherence</div>
                  <div className={`font-bold ${
                    t.current_adherence >= 0.8 ? 'text-green-600' :
                    t.current_adherence >= 0.6 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {(t.current_adherence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
