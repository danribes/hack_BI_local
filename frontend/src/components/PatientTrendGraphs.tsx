import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Observation {
  observation_type: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  observation_date: string;
  month_number?: number;
  notes?: string;
}

interface PatientTrendGraphsProps {
  observations: Observation[];
  isTreated: boolean;
}

export const PatientTrendGraphs: React.FC<PatientTrendGraphsProps> = ({ observations, isTreated }) => {
  // Group observations by month/cycle
  const groupedByMonth = observations.reduce((acc, obs) => {
    // Skip observations without dates or with invalid dates
    if (!obs.observation_date) {
      console.warn('[PatientTrendGraphs] Skipping observation without date:', obs);
      return acc;
    }

    const observationDate = new Date(obs.observation_date);
    if (isNaN(observationDate.getTime())) {
      console.warn('[PatientTrendGraphs] Skipping observation with invalid date:', obs);
      return acc;
    }

    // Treat null/undefined/0 month_number as 1 (initial baseline)
    // This ensures all initial observations are grouped together
    const monthNum = obs.month_number || 1;
    if (!acc[monthNum]) {
      acc[monthNum] = {
        month: monthNum,
        date: observationDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    }
    if (obs.value_numeric !== undefined) {
      acc[monthNum][obs.observation_type] = obs.value_numeric;
    }
    return acc;
  }, {} as Record<number, any>);

  // Convert to array and sort by month
  const timeSeriesData = Object.values(groupedByMonth).sort((a: any, b: any) => a.month - b.month);

  // Helper function to check if a metric has multiple distinct timepoints
  const hasMultipleTimepoints = (dataKey: string) => {
    const validPoints = timeSeriesData.filter((d: any) => d[dataKey] !== undefined && d[dataKey] !== null);
    return validPoints.length > 1;
  };

  // Helper function to get the latest value for a metric
  const getLatestValue = (dataKey: string) => {
    for (let i = timeSeriesData.length - 1; i >= 0; i--) {
      if (timeSeriesData[i][dataKey] !== undefined && timeSeriesData[i][dataKey] !== null) {
        return {
          value: timeSeriesData[i][dataKey],
          date: timeSeriesData[i].date
        };
      }
    }
    return null;
  };

  // Component to render static value cell when no updates exist
  const StaticValueCell = ({
    label,
    value,
    unit,
    date,
    icon,
    normalRange,
    isGood
  }: {
    label: string;
    value: number;
    unit: string;
    date: string;
    icon: string;
    normalRange: string;
    isGood: boolean;
  }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="mr-2">{icon}</span>
          {label}
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-300">
          No updates yet
        </span>
      </div>

      <div className="flex items-baseline justify-center my-6">
        <span className={`text-6xl font-bold ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-2xl font-semibold text-gray-500 ml-2">
          {unit}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Baseline Date:</span>
          <span className="font-semibold text-gray-900">{date}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Normal Range:</span>
          <span className="font-semibold text-gray-900">{normalRange}</span>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">📊 Trending:</span> Graph will appear once follow-up results are recorded
          </p>
        </div>
      </div>
    </div>
  );

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    try {
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (!entry || entry.value === undefined || entry.value === null) {
              return null;
            }
            return (
              <p key={index} style={{ color: entry.color || '#000' }} className="text-sm">
                {entry.name || 'Value'}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              </p>
            );
          }).filter(Boolean)}
        </div>
      );
    } catch (err) {
      console.error('[CustomTooltip] Error rendering tooltip:', err);
      return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Patient Health Trends Over Time
          {isTreated && (
            <span className="ml-4 px-3 py-1 bg-green-500 text-white text-sm rounded-full">
              Under Treatment
            </span>
          )}
          {!isTreated && (
            <span className="ml-4 px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
              Not Treated
            </span>
          )}
        </h2>
      </div>

      <div className="p-8 space-y-8">
        {/* eGFR Trend */}
        {timeSeriesData.some((d: any) => d.eGFR) && (
          <div>
            {!hasMultipleTimepoints('eGFR') ? (
              // Show static value cell when no updates exist
              <StaticValueCell
                label="Kidney Function (eGFR)"
                value={getLatestValue('eGFR')!.value}
                unit="mL/min/1.73m²"
                date={getLatestValue('eGFR')!.date}
                icon="📊"
                normalRange=">60 mL/min/1.73m²"
                isGood={getLatestValue('eGFR')!.value >= 60}
              />
            ) : (
              // Show graph when multiple timepoints exist
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Kidney Function (eGFR)
                  <span className="ml-3 text-sm font-normal text-gray-600">
                    Higher is better • Target: &gt;60 mL/min/1.73m²
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'mL/min/1.73m²', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {/* Reference zones */}
                    <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal (>60)', fill: '#10b981', fontSize: 11 }} />
                    <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Severe (<30)', fill: '#f59e0b', fontSize: 11 }} />
                    <Line
                      type="linear"
                      dataKey="eGFR"
                      stroke={isTreated ? "#10b981" : "#ef4444"}
                      strokeWidth={3}
                      dot={{ fill: isTreated ? "#10b981" : "#ef4444", r: 6 }}
                      name="eGFR"
                      unit="mL/min/1.73m²"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {/* uACR Trend */}
        {timeSeriesData.some((d: any) => d.uACR) && (
          <div>
            {!hasMultipleTimepoints('uACR') ? (
              // Show static value cell when no updates exist
              <StaticValueCell
                label="Protein in Urine (uACR)"
                value={getLatestValue('uACR')!.value}
                unit="mg/g"
                date={getLatestValue('uACR')!.date}
                icon="🔬"
                normalRange="<30 mg/g"
                isGood={getLatestValue('uACR')!.value < 30}
              />
            ) : (
              // Show graph when multiple timepoints exist
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔬</span>
                  Protein in Urine (uACR)
                  <span className="ml-3 text-sm font-normal text-gray-600">
                    Lower is better • Normal: &lt;30 mg/g
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'mg/g', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {/* Reference zones */}
                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Normal (<30)', fill: '#10b981', fontSize: 11 }} />
                    <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Severe (>300)', fill: '#ef4444', fontSize: 11 }} />
                    <Line
                      type="linear"
                      dataKey="uACR"
                      stroke={isTreated ? "#10b981" : "#ef4444"}
                      strokeWidth={3}
                      dot={{ fill: isTreated ? "#10b981" : "#ef4444", r: 6 }}
                      name="uACR"
                      unit="mg/g"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {/* Blood Pressure Trend */}
        {timeSeriesData.some((d: any) => d.blood_pressure_systolic) && (
          <div>
            {!hasMultipleTimepoints('blood_pressure_systolic') ? (
              // Show static value cell for blood pressure when no updates exist
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="mr-2">❤️</span>
                    Blood Pressure
                  </h3>
                  <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-300">
                    No updates yet
                  </span>
                </div>

                <div className="flex items-baseline justify-center my-6">
                  <span className="text-6xl font-bold text-red-600">
                    {getLatestValue('blood_pressure_systolic')!.value.toFixed(0)}
                  </span>
                  <span className="text-4xl font-bold text-gray-400 mx-3">/</span>
                  <span className="text-6xl font-bold text-blue-600">
                    {getLatestValue('blood_pressure_diastolic')!.value.toFixed(0)}
                  </span>
                  <span className="text-2xl font-semibold text-gray-500 ml-2">
                    mmHg
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Baseline Date:</span>
                    <span className="font-semibold text-gray-900">{getLatestValue('blood_pressure_systolic')!.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target Range:</span>
                    <span className="font-semibold text-gray-900">&lt;130/80 mmHg</span>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">📊 Trending:</span> Graph will appear once follow-up results are recorded
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Show graph when multiple timepoints exist
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">❤️</span>
                  Blood Pressure
                  <span className="ml-3 text-sm font-normal text-gray-600">
                    Target: &lt;130/80 mmHg for CKD patients
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[60, 180]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {/* Reference lines */}
                    <ReferenceLine y={130} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Systolic (130)', fill: '#10b981', fontSize: 11 }} />
                    <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Diastolic (80)', fill: '#10b981', fontSize: 11 }} />
                    <Line
                      type="linear"
                      dataKey="blood_pressure_systolic"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: "#ef4444", r: 6 }}
                      name="Systolic"
                      unit="mmHg"
                      connectNulls={false}
                    />
                    <Line
                      type="linear"
                      dataKey="blood_pressure_diastolic"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: "#3b82f6", r: 6 }}
                      name="Diastolic"
                      unit="mmHg"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {/* HbA1c Trend (for diabetic patients) */}
        {timeSeriesData.some((d: any) => d.HbA1c) && (
          <div>
            {!hasMultipleTimepoints('HbA1c') ? (
              // Show static value cell when no updates exist
              <StaticValueCell
                label="Diabetes Control (HbA1c)"
                value={getLatestValue('HbA1c')!.value}
                unit="%"
                date={getLatestValue('HbA1c')!.date}
                icon="🩸"
                normalRange="<7%"
                isGood={getLatestValue('HbA1c')!.value < 7}
              />
            ) : (
              // Show graph when multiple timepoints exist
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🩸</span>
                  Diabetes Control (HbA1c)
                  <span className="ml-3 text-sm font-normal text-gray-600">
                    Target: &lt;7% for most patients
                  </span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      domain={[4, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {/* Reference line */}
                    <ReferenceLine y={7} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target (<7%)', fill: '#10b981', fontSize: 11 }} />
                    <Line
                      type="linear"
                      dataKey="HbA1c"
                      stroke={isTreated ? "#8b5cf6" : "#f97316"}
                      strokeWidth={3}
                      dot={{ fill: isTreated ? "#8b5cf6" : "#f97316", r: 6 }}
                      name="HbA1c"
                      unit="%"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
