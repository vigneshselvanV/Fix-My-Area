import React, { useState } from 'react';
import { ReportItem } from '../../types';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  MapPin,
  Clock,
  User,
  Shield,
  Sparkles,
  CheckSquare,
  Building2,
  Phone,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';

interface WorkOrderModalProps {
  report: ReportItem;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [assignedCrew, setAssignedCrew] = useState<string>(() => {
    switch (report.category) {
      case 'Pothole':
        return 'Asphalt Road Repair Unit #3';
      case 'Water Leak':
        return 'Emergency Water Pipeline Division';
      case 'Drainage':
        return 'Stormwater & Flood Management Crew';
      case 'Streetlight':
        return 'Municipal Electrical Grid Maintenance';
      case 'Garbage':
        return 'Sanitation & Solid Waste Rapid Response';
      case 'Stray Animal':
        return 'Animal Care & Welfare Unit';
      default:
        return 'General Municipal Dispatch Team';
    }
  });

  const [priorityNotes, setPriorityNotes] = useState<string>(
    `Execute protocol: ${report.suggested_action || 'Inspect and resolve citizen report.'}`
  );
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const workOrderId = `WO-${report.id.slice(0, 8).toUpperCase()}`;
  const reportDate = report.created_at?.toDate
    ? report.created_at.toDate().toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString();

  // SLA Calculation
  const getSlaHours = () => {
    switch (report.risk_level) {
      case 'Critical':
        return 6;
      case 'High':
        return 24;
      case 'Medium':
        return 48;
      case 'Low':
        return 72;
      default:
        return 48;
    }
  };

  const slaDeadline = new Date(
    (report.created_at?.toDate ? report.created_at.toDate() : new Date()).getTime() +
      getSlaHours() * 60 * 60 * 1000
  ).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  const handleCopyText = () => {
    const summary = `
========================================
FIXMYAREA MUNICIPAL WORK ORDER: ${workOrderId}
========================================
Category: ${report.category}
Risk Priority: ${report.risk_level}
Current Status: ${report.status}
Reported At: ${reportDate}
SLA Resolution Target: ${slaDeadline} (${getSlaHours()} hours)

LOCATION:
Address: ${report.address || 'Street Coordinate Location'}
GPS Coordinates: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}
Google Maps: https://maps.google.com/?q=${report.latitude},${report.longitude}

CITIZEN DETAILS:
Reported By: ${report.user_name || 'Resident'}
Citizen Notes: ${report.description}
Upvotes: ${report.upvote_count || 0} | Flags: ${report.flag_count || 0}

FIELD DISPATCH ASSIGNMENT:
Assigned Crew: ${assignedCrew}
Recommended Protocol: ${report.suggested_action}
Dispatch Notes: ${priorityNotes}
========================================
`;
    navigator.clipboard.writeText(summary.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Work Order ${workOrderId} - Municipal Dispatch</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 20px;
      color: #1e293b;
      line-height: 1.4;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-med { background: #fef3c7; color: #92400e; }
    .badge-low { background: #dcfce7; color: #166534; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; }
    .box-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #475569; margin-bottom: 6px; }
    .img-box { text-align: center; margin-top: 10px; }
    .img-box img { max-height: 200px; max-width: 100%; border-radius: 6px; border: 1px solid #cbd5e1; }
    .checklist { margin-top: 12px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
    .check-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; }
    .checkbox { width: 14px; height: 14px; border: 1.5px solid #475569; display: inline-block; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #94a3b8; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #0f172a;">MUNICIPAL SERVICES DIVISION</h2>
      <p style="margin: 0; font-size: 12px; color: #64748b;">CIVIC INCIDENT DISPATCH & WORK ORDER TICKET</p>
    </div>
    <div style="text-align: right;">
      <h3 style="margin: 0; font-family: monospace; font-size: 16px;">${workOrderId}</h3>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Issued: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="box-title">Incident Particulars</div>
      <p><strong>Category:</strong> ${report.category}</p>
      <p><strong>Risk Severity:</strong> <span class="badge badge-${report.risk_level.toLowerCase()}">${report.risk_level} Hazard</span></p>
      <p><strong>Reported Date:</strong> ${reportDate}</p>
      <p><strong>SLA Resolution Target:</strong> ${slaDeadline} (${getSlaHours()}h)</p>
    </div>
    <div class="box">
      <div class="box-title">Dispatch Assignment</div>
      <p><strong>Assigned Crew:</strong> ${assignedCrew}</p>
      <p><strong>Citizen Reporter:</strong> ${report.user_name || 'Resident'}</p>
      <p><strong>Community Upvotes:</strong> ${report.upvote_count || 0}</p>
      <p><strong>Current Status:</strong> ${report.status}</p>
    </div>
  </div>

  <div class="box" style="margin-bottom: 14px;">
    <div class="box-title">Location & Geolocation</div>
    <p><strong>Address:</strong> ${report.address || 'Street Coordinate Location'}</p>
    <p style="font-family: monospace; font-size: 12px;"><strong>GPS Coordinates:</strong> ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}</p>
  </div>

  <div class="box" style="margin-bottom: 14px;">
    <div class="box-title">Citizen Description & Field Observations</div>
    <p style="margin: 0 0 8px 0;">${report.description}</p>
    <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Recommended Protocol: ${report.suggested_action}</p>
    ${
      report.image_url
        ? `<div class="img-box"><img src="${report.image_url}" alt="Incident Site Photo" /></div>`
        : ''
    }
  </div>

  <div class="checklist">
    <div class="box-title">Field Crew Quality & Safety Checklist</div>
    <div class="check-item"><span class="checkbox"></span> Safety cones & warning signage deployed</div>
    <div class="check-item"><span class="checkbox"></span> On-site damage and underlying hazard inspected</div>
    <div class="check-item"><span class="checkbox"></span> Required repair materials & equipment verified</div>
    <div class="check-item"><span class="checkbox"></span> Repair executed per municipal civil engineering code</div>
    <div class="check-item"><span class="checkbox"></span> Site cleared and after-repair photo captured</div>
  </div>

  <div class="signatures">
    <div>
      <p style="margin: 0 0 30px 0; font-size: 11px; color: #64748b;">DISPATCH SUPERVISOR SIGNATURE</p>
      <div style="width: 180px; border-bottom: 1px solid #000;"></div>
    </div>
    <div>
      <p style="margin: 0 0 30px 0; font-size: 11px; color: #64748b;">FIELD CREW LEAD SIGNATURE</p>
      <div style="width: 180px; border-bottom: 1px solid #000;"></div>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
`;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Work Order ${workOrderId}</title>
  <style>
    body { font-family: sans-serif; padding: 24px; color: #0f172a; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 8px 0; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>FIXMYAREA MUNICIPAL WORK ORDER: ${workOrderId}</h1>
    <div class="meta">Category: ${report.category} | Priority: ${report.risk_level} | Issued: ${new Date().toLocaleDateString()}</div>
    <hr/>
    <p><strong>Location:</strong> ${report.address || 'Street Coordinates'}</p>
    <p><strong>Coordinates:</strong> ${report.latitude}, ${report.longitude}</p>
    <p><strong>Citizen Description:</strong> ${report.description}</p>
    <p><strong>Action Protocol:</strong> ${report.suggested_action}</p>
    <p><strong>Assigned Crew:</strong> ${assignedCrew}</p>
    <p><strong>SLA Deadline:</strong> ${slaDeadline}</p>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WorkOrder_${workOrderId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded">
                  Municipal Dispatch Ticket
                </span>
                <span className="font-mono text-xs text-slate-300 font-bold">{workOrderId}</span>
              </div>
              <h2 className="font-heading text-base font-bold text-white mt-0.5">
                Official Municipal Field Work Order
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Category</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900">
                <CategoryIcon category={report.category} className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate">{report.category}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Risk Hazard</span>
              <div className="mt-1">
                <RiskBadge level={report.risk_level} size="sm" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Status</span>
              <div className="mt-1">
                <StatusBadge status={report.status} />
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase block">Resolution SLA</span>
              <p className="font-bold text-indigo-950 mt-1">{getSlaHours()}h Target</p>
            </div>
          </div>

          {/* Location & Maps */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Field Location & Coordinates</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Open Google Maps ↗
              </a>
            </div>
            <p className="text-slate-700 font-medium">
              {report.address || 'Street Coordinate Location'}
            </p>
            <p className="font-mono text-[11px] text-slate-500">
              Latitude: {report.latitude.toFixed(6)} | Longitude: {report.longitude.toFixed(6)}
            </p>
          </div>

          {/* Citizen Description & Photo Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
              Incident Description & Evidence
            </h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {report.description}
            </p>
            {report.image_url && (
              <div className="pt-2">
                <img
                  src={report.image_url}
                  alt="Incident Photo"
                  className="w-full max-h-48 object-cover rounded-lg border border-slate-300"
                />
              </div>
            )}
          </div>

          {/* Protocol & Crew Dispatch Form */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Recommended Action & Crew Assignment</span>
            </div>

            <p className="text-xs text-indigo-900 bg-white p-2.5 rounded-lg border border-indigo-200 font-medium">
              <strong>Standard Protocol:</strong> {report.suggested_action}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign Field Crew Unit
                </label>
                <input
                  type="text"
                  value={assignedCrew}
                  onChange={(e) => setAssignedCrew(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Resolution Deadline
                </label>
                <input
                  type="text"
                  readOnly
                  value={slaDeadline}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Field Checklist */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
              Field Crew Verification Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                <span>Site safety barriers & cones deployed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                <span>Materials & tools verified on-site</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-indigo-600" />
                <span>Civil repairs executed per standards</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-indigo-600" />
                <span>After-repair verification photo uploaded</span>
              </label>
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Dispatch Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Work Order</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
