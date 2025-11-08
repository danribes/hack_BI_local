/**
 * Risk Analysis Button Component
 *
 * Reusable button component that triggers AI-powered CKD risk analysis.
 * Calls the POST /api/analyze/:patientId endpoint and handles loading/error states.
 */

import { useState } from 'react';

export interface RiskAnalysisButtonProps {
  patientId: string;
  onAnalysisComplete?: (analysis: any) => void;
  onAnalysisError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export interface AnalysisResult {
  success: boolean;
  patient_id: string;
  analysis?: any;
  error?: string;
  cached?: boolean;
  processing_time_ms?: number;
}

export default function RiskAnalysisButton({
  patientId,
  onAnalysisComplete,
  onAnalysisError,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
}: RiskAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Trigger risk analysis for the patient
   */
  const handleAnalyze = async () => {
    // Reset states
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/analyze/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeResults: true,
          includePatientData: true,
          skipCache: false,
        }),
      });

      const result: AnalysisResult = await response.json();

      if (result.success && result.analysis) {
        setSuccess(true);
        setError(null);

        // Call success callback if provided
        if (onAnalysisComplete) {
          onAnalysisComplete(result.analysis);
        }

        // Reset success state after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        const errorMsg = result.error || 'Analysis failed';
        setError(errorMsg);
        setSuccess(false);

        // Call error callback if provided
        if (onAnalysisError) {
          onAnalysisError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze patient';
      setError(errorMsg);
      setSuccess(false);

      // Call error callback if provided
      if (onAnalysisError) {
        onAnalysisError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get button variant classes
   */
  const getVariantClasses = () => {
    if (success) {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }

    if (error) {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }

    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400';
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-400 disabled:text-gray-400';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400';
    }
  };

  /**
   * Get button size classes
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  /**
   * Get button content (text + icon)
   */
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Analyzing...
        </>
      );
    }

    if (success) {
      return (
        <>
          <svg
            className="inline-block w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Analysis Complete!
        </>
      );
    }

    if (error) {
      return (
        <>
          <svg
            className="inline-block w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Retry Analysis
        </>
      );
    }

    return (
      <>
        <svg
          className="inline-block w-5 h-5 mr-2"
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
        Analyze Risk
      </>
    );
  };

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={handleAnalyze}
        disabled={disabled || isLoading}
        className={`
          ${getVariantClasses()}
          ${getSizeClasses()}
          font-semibold rounded-lg
          transition-colors duration-200
          disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${className}
        `}
      >
        {getButtonContent()}
      </button>

      {/* Error message display */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
