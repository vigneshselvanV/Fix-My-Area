import { ReportItem } from '../types';

/**
 * GOOGLE SHEETS EXPORT SERVICE (CLIENT-SIDE STUB)
 * 
 * ARCHITECTURAL NOTICE & SECURITY EXPLANATION:
 * Direct Google Sheets API access using a Google Cloud Service Account Private Key
 * CANNOT and SHOULD NOT be executed directly in client-side browser JavaScript.
 * Exposing a Service Account private key or unrestricted OAuth secret in client-side
 * bundle risks full unauthorized access to the Google Workspace domain.
 * 
 * PRODUCTION RECOMMENDATION:
 * 1. Move this export functionality to a secure backend endpoint (e.g., Firebase Cloud Function
 *    or Express proxy route) with an authenticated service account.
 * 2. Alternatively, deploy a Google Apps Script Web App that receives an authenticated webhook
 *    payload and appends the rows to your designated municipal spreadsheet.
 * 
 * LOCAL / CLIENT WORKAROUND:
 * We provide a CSV export helper so administrators can immediately download reports
 * and import them into Google Sheets or Microsoft Excel without external key exposure.
 */

export interface SheetsExportResult {
  success: boolean;
  message: string;
  count?: number;
}

export function exportReportsToCsv(reports: ReportItem[] = []): { success: boolean; count: number } {
  const safeReports = reports || [];

  const headers = [
    'Report ID',
    'Category',
    'Status',
    'Risk Level',
    'Suggested Action',
    'Description',
    'Latitude',
    'Longitude',
    'Address',
    'Upvotes',
    'Flags',
    'Reporter UID',
    'Created At',
  ];

  const rows = safeReports.map((r) => [
    `"${r.id}"`,
    `"${r.category}"`,
    `"${r.status}"`,
    `"${r.risk_level}"`,
    `"${(r.suggested_action || '').replace(/"/g, '""')}"`,
    `"${(r.description || '').replace(/"/g, '""')}"`,
    r.latitude ?? '',
    r.longitude ?? '',
    `"${(r.address || '').replace(/"/g, '""')}"`,
    r.upvote_count || 0,
    r.flag_count || 0,
    `"${r.user_id || ''}"`,
    `"${r.created_at?.toDate ? r.created_at.toDate().toISOString() : r.created_at || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `fixmyarea_reports_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: safeReports.length };
}

// Stub function for future Google Apps Script Webhook or Backend Sync
export async function triggerGoogleSheetsSync(
  _reports: ReportItem[],
  customWebhookUrl?: string
): Promise<SheetsExportResult> {
  if (!customWebhookUrl) {
    return {
      success: false,
      message:
        'Direct Sheets API is disabled in client-only mode for security. Use the CSV Download or configure a Google Apps Script Web App URL.',
    };
  }

  try {
    const response = await fetch(customWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports: _reports, timestamp: new Date().toISOString() }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    return {
      success: true,
      message: 'Successfully sent data to Google Apps Script Webhook.',
      count: _reports.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to sync with Google Apps Script.',
    };
  }
}
