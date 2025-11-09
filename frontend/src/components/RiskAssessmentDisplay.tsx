import { RiskAssessment } from '../types';

/**
 * Risk Assessment Display Component
 *
 * Modal overlay displaying AI-powered CKD risk analysis results.
 * Shows risk scores, key findings, CKD analysis, and clinical recommendations.
 */

export interface RiskAssessmentDisplayProps {
  assessment: RiskAssessment;
  patientName: string;
  onClose: () => void;
}

export default function RiskAssessmentDisplay({
  assessment,
  patientName,
  onClose,
}: RiskAssessmentDisplayProps) {
  if (!assessment) {
    return null;
  }

  /**
   * Get risk level color classes
   */
  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
      case 'moderate':
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
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header with Risk Score */}
          <div className={`px-6 py-4 border-b-4 ${getRiskLevelColor(assessment.risk_level)} sticky top-0 z-10`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">CKD Risk Assessment</h2>
                <p className="text-sm opacity-75">
                  Patient: {patientName}
                </p>
                <p className="text-sm opacity-75">
                  Analyzed: {formatDate(assessment.assessed_at)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {(assessment.risk_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wide">
                    {assessment.risk_level} Risk
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Risk Tier Badge */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRiskTierColor(assessment.risk_tier)}`}>
                Tier {assessment.risk_tier}
              </span>
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

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <ul className="space-y-2">
                  {assessment.key_findings.map((finding, idx) => (
                    <li key={idx} className="text-sm text-blue-900 flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
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
                    <p className="text-sm font-semibold text-purple-900">CKD Stage</p>
                    <p className="text-lg text-purple-800">
                      {assessment.ckd_analysis.stage}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-purple-900">Kidney Function</p>
                    <p className="text-lg text-purple-800 capitalize">
                      {assessment.ckd_analysis.kidney_function.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-purple-900">Albuminuria Level</p>
                    <p className="text-lg text-purple-800 capitalize">
                      {assessment.ckd_analysis.albuminuria_level.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-purple-900">Progression Risk</p>
                    <p className={`text-lg font-semibold capitalize ${
                      assessment.ckd_analysis.progression_risk.toLowerCase() === 'high'
                        ? 'text-red-700'
                        : assessment.ckd_analysis.progression_risk.toLowerCase() === 'moderate'
                        ? 'text-yellow-700'
                        : 'text-green-700'
                    }`}>
                      {assessment.ckd_analysis.progression_risk}
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
                {assessment.recommendations.immediate_actions.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Immediate Actions Required
                    </h4>
                    <ul className="space-y-1">
                      {assessment.recommendations.immediate_actions.map((action, idx) => (
                        <li key={idx} className="text-sm text-red-800 flex items-start">
                          <span className="mr-2 font-bold">{idx + 1}.</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up */}
                {assessment.recommendations.follow_up.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h4 className="font-semibold text-blue-900 mb-2">Follow-up Care</h4>
                    <ul className="space-y-1">
                      {assessment.recommendations.follow_up.map((item, idx) => (
                        <li key={idx} className="text-sm text-blue-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lifestyle Modifications */}
                {assessment.recommendations.lifestyle_modifications.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                    <h4 className="font-semibold text-green-900 mb-2">Lifestyle Modifications</h4>
                    <ul className="space-y-1">
                      {assessment.recommendations.lifestyle_modifications.map((mod, idx) => (
                        <li key={idx} className="text-sm text-green-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monitoring */}
                {assessment.recommendations.monitoring.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600">
                    <h4 className="font-semibold text-yellow-900 mb-2">Monitoring & Screening</h4>
                    <ul className="space-y-1">
                      {assessment.recommendations.monitoring.map((test, idx) => (
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
          </div>

          {/* Footer with Close Button */}
          <div className="border-t p-4 bg-gray-50 sticky bottom-0">
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Close Assessment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
