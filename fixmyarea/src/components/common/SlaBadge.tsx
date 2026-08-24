import React from 'react';
import { ReportItem } from '../../types';
import { getReportSlaInfo } from '../../services/reports';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SlaBadgeProps {
  report: ReportItem;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  report,
  size = 'md',
  showDetails = false,
}) => {
  const slaInfo = getReportSlaInfo(report);

  const isResolved = report.status === 'Resolved';
  const isBreached = slaInfo.isBreached;

  const sizeClasses = {
    sm: 'text-[10px] py-0.5 px-2 rounded-md gap-1',
    md: 'text-xs py-1 px-2.5 rounded-lg gap-1.5',
    lg: 'text-xs py-1.5 px-3 rounded-xl gap-2',
  }[size];

  if (isResolved) {
    return (
      <span
        className={`inline-flex items-center font-bold tracking-tight bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        title={`Target SLA was ${slaInfo.slaHours} hours`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{slaInfo.statusLabel}</span>
      </span>
    );
  }

  if (isBreached) {
    return (
      <div className="inline-flex flex-col items-start gap-0.5">
        <span
          className={`inline-flex items-center font-extrabold tracking-tight bg-red-100 text-red-900 border border-red-300 animate-pulse ${sizeClasses}`}
          title={`SLA target of ${slaInfo.slaHours} hours has been exceeded.`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>SLA Breached ({Math.abs(slaInfo.hoursRemaining)}h overdue)</span>
        </span>
        {showDetails && (
          <span className="text-[10px] text-red-600 font-semibold pl-0.5">
            Auto-Escalated to Ward Supervisor
          </span>
        )}
      </div>
    );
  }

  // Active within SLA
  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight bg-teal-50 text-teal-800 border border-teal-300 ${sizeClasses}`}
      title={`Target SLA is ${slaInfo.slaHours}h. Deadline: ${slaInfo.slaDeadline.toLocaleDateString()} ${slaInfo.slaDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
    >
      <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
      <span>
        SLA: {slaInfo.hoursRemaining > 0 ? `${slaInfo.hoursRemaining}h remaining` : 'Due shortly'}
      </span>
    </span>
  );
};
