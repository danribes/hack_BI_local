/**
 * Risk Assessment Display Component
 *
 * Comprehensive display of AI-powered CKD risk analysis results.
 * Shows risk scores, key findings, CKD analysis, and clinical recommendations.
 */

export interface RiskAssessmentDisplayProps {
  analysis: AIRiskAnalysis | null;
  className?: string;
}

export interface AIRiskAnalysis {
  patient_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_tier: 1 | 2 | 3;

  key_findings: {
    abnormal_labs: string[];
    risk_factors: string[];
    protective_factors: string[];
  };

  ckd_analysis: {
    current_stage: string | null;
    kidney_function: 'normal' | 'mildly_reduced' | 'moderately_reduced' | 'severely_reduced' | 'kidney_failure';
    kidney_damage: 'none' | 'microalbuminuria' | 'macroalbuminuria';
    progression_risk: 'low' | 'moderate' | 'high';
  };

  recommendations: {
    immediate_actions: string[];
    follow_up: string[];
    lifestyle_modifications: string[];
    screening_tests: string[];
  };

  confidence_score?: number;
  model_version?: string;
  analyzed_at: string;
}

export default function RiskAssessmentDisplay({
  analysis,
  className = '',
}: RiskAssessmentDisplayProps) {
  if (!analysis) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No analysis available</p>
        <p className="text-sm mt-1">Click "Analyze Risk" to generate a risk assessment</p>
      </div>
    );
  }

  /**
   * Get risk level color classes
   */
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  /**
   * Get risk tier badge color
   */
  const getRiskTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-green-600 text-white';
      case 2:
        return 'bg-yellow-600 text-white';
      case 3:
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  /**
   * Get kidney function description
   */
  const getKidneyFunctionText = (func: string) => {
    switch (func) {
      case 'normal':
        return 'Normal kidney function';
      case 'mildly_reduced':
        return 'Mildly reduced kidney function';
      case 'moderately_reduced':
        return 'Moderately reduced kidney function';
      case 'severely_reduced':
        return 'Severely reduced kidney function';
      case 'kidney_failure':
        return 'Kidney failure';
      default:
        return func;
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with Risk Score */}
      <div className={`px-6 py-4 border-b-4 ${getRiskLevelColor(analysis.risk_level)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">CKD Risk Assessment</h2>
            <p className="text-sm opacity-75">
              Analyzed: {formatDate(analysis.analyzed_at)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {(analysis.risk_score * 100).toFixed(0)}%
            </div>
            <div className="text-sm font-semibold uppercase tracking-wide">
              {analysis.risk_level} Risk
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Risk Tier Badge */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRiskTierColor(analysis.risk_tier)}`}>
            Tier {analysis.risk_tier}
          </span>
          {analysis.confidence_score && (
            <span className="text-sm text-gray-600">
              Confidence: {(analysis.confidence_score * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Key Findings Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Key Findings
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Abnormal Labs */}
            {analysis.key_findings.abnormal_labs.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2 text-sm">
                  Abnormal Labs
                </h4>
                <ul className="space-y-1">
                  {analysis.key_findings.abnormal_labs.map((lab, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{lab}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {analysis.key_findings.risk_factors.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 text-sm">
                  Risk Factors
                </h4>
                <ul className="space-y-1">
                  {analysis.key_findings.risk_factors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-yellow-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Protective Factors */}
            {analysis.key_findings.protective_factors.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 text-sm">
                  Protective Factors
                </h4>
                <ul className="space-y-1">
                  {analysis.key_findings.protective_factors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* CKD Analysis Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            CKD Analysis
          </h3>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-900">Current Stage</p>
                <p className="text-lg text-purple-800">
                  {analysis.ckd_analysis.current_stage || 'Not determined'}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-900">Kidney Function</p>
                <p className="text-lg text-purple-800">
                  {getKidneyFunctionText(analysis.ckd_analysis.kidney_function)}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-900">Kidney Damage</p>
                <p className="text-lg text-purple-800 capitalize">
                  {analysis.ckd_analysis.kidney_damage.replace('_', ' ')}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-900">Progression Risk</p>
                <p className={`text-lg font-semibold capitalize ${
                  analysis.ckd_analysis.progression_risk === 'high'
                    ? 'text-red-700'
                    : analysis.ckd_analysis.progression_risk === 'moderate'
                    ? 'text-yellow-700'
                    : 'text-green-700'
                }`}>
                  {analysis.ckd_analysis.progression_risk}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Clinical Recommendations
          </h3>

          <div className="space-y-4">
            {/* Immediate Actions */}
            {analysis.recommendations.immediate_actions.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Immediate Actions Required
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendations.immediate_actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start">
                      <span className="mr-2 font-bold">{idx + 1}.</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up */}
            {analysis.recommendations.follow_up.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                <h4 className="font-semibold text-blue-900 mb-2">Follow-up Care</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.follow_up.map((item, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lifestyle Modifications */}
            {analysis.recommendations.lifestyle_modifications.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                <h4 className="font-semibold text-green-900 mb-2">Lifestyle Modifications</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.lifestyle_modifications.map((mod, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Screening Tests */}
            {analysis.recommendations.screening_tests.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600">
                <h4 className="font-semibold text-yellow-900 mb-2">Recommended Screening Tests</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.screening_tests.map((test, idx) => (
                    <li key={idx} className="text-sm text-yellow-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Model Info */}
        {analysis.model_version && (
          <div className="border-t pt-4 text-xs text-gray-500 flex justify-between items-center">
            <span>Model: {analysis.model_version}</span>
            <span>Patient ID: {analysis.patient_id.substring(0, 8)}...</span>
          </div>
        )}
      </div>
    </div>
  );
}
