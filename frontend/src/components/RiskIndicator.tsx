/**
 * Risk Indicator Component
 *
 * Lightweight, reusable color-coded badge for displaying risk levels.
 * Shows risk level (low/medium/high) with appropriate color coding.
 */

export interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RiskIndicator({
  level,
  showIcon = false,
  size = 'md',
  className = '',
}: RiskIndicatorProps) {
  /**
   * Get color classes based on risk level
   */
  const getColorClasses = () => {
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
   * Get size classes
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'md':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-4 py-1.5 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  /**
   * Get icon SVG based on risk level
   */
  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    switch (level) {
      case 'low':
        return (
          <svg
            className={`${iconSize} mr-1 inline-block`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'medium':
        return (
          <svg
            className={`${iconSize} mr-1 inline-block`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'high':
        return (
          <svg
            className={`${iconSize} mr-1 inline-block`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * Get capitalized risk level text
   */
  const getRiskText = () => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <span
      className={`
        inline-flex items-center
        font-semibold
        rounded-full
        border
        ${getColorClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {showIcon && getIcon()}
      {getRiskText()} Risk
    </span>
  );
}
