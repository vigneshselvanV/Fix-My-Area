import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<RiskLevel, { bg: string; text: string; border: string; icon: any; label: string }> = {
    Low: {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
      text: 'Low Risk',
      label: 'LOW',
    },
    Medium: {
      bg: 'bg-amber-50 text-amber-700',
      border: 'border-amber-200',
      icon: AlertCircle,
      text: 'Medium Risk',
      label: 'MED',
    },
    High: {
      bg: 'bg-orange-50 text-orange-600',
      border: 'border-orange-200',
      icon: AlertTriangle,
      text: 'High Risk',
      label: 'HIGH',
    },
    Critical: {
      bg: 'bg-red-50 text-red-600',
      border: 'border-red-200',
      icon: ShieldAlert,
      text: 'Critical Risk',
      label: 'CRITICAL',
    },
  };

  const config = configs[level] || configs.Medium;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border whitespace-nowrap shrink-0 shadow-xs ${config.bg} ${config.border} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{size === 'sm' ? config.label : config.text}</span>
    </span>
  );
};
