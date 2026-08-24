import React from 'react';
import { ReportStatus } from '../../types';
import { Clock, Eye, Wrench, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<ReportStatus, { bg: string; border: string; icon: any; label: string }> = {
    Reported: {
      bg: 'bg-slate-100 text-slate-700',
      border: 'border-slate-300',
      icon: Clock,
      label: 'Reported',
    },
    Acknowledged: {
      bg: 'bg-indigo-50 text-indigo-700',
      border: 'border-indigo-200',
      icon: Eye,
      label: 'Acknowledged',
    },
    'In Progress': {
      bg: 'bg-blue-50 text-blue-700',
      border: 'border-blue-200',
      icon: Wrench,
      label: 'In Progress',
    },
    Resolved: {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle,
      label: 'Resolved',
    },
  };

  const config = configs[status] || configs.Reported;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1 font-semibold' : 'text-xs px-2.5 py-1 gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-lg border whitespace-nowrap shrink-0 shadow-xs ${config.bg} ${config.border} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
