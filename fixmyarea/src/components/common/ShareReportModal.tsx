import React, { useState } from 'react';
import { ReportItem } from '../../types';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
  Twitter,
  QrCode,
  Printer,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface ShareReportModalProps {
  report: ReportItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const shareText = `⚠️ Civic Issue Alert: ${report.category} at ${report.address || 'our area'}. Status: ${report.status}. Please upvote on FixMyArea to accelerate municipal repair!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n\nView & Upvote Ticket: ${currentUrl}`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(currentUrl)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-5">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
            <Share2 className="w-4 h-4" />
            <span>Community Mobilization</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900">
            Share Civic Ticket
          </h2>
          <p className="text-xs text-slate-500">
            Mobilize neighborhood upvotes to escalate this issue to priority municipal dispatch.
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          
          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            <span>WhatsApp Group</span>
          </button>

          {/* Twitter / X */}
          <button
            type="button"
            onClick={handleTwitterShare}
            className="p-3.5 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Twitter className="w-6 h-6 text-sky-500" />
            <span>Share on X</span>
          </button>

          {/* Print / Field Inspection Ticket */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-3.5 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-6 h-6 text-teal-700" />
            <span>Print Inspection Pass</span>
          </button>

          {/* QR Code Inspection */}
          <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50 text-teal-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs">
            <QrCode className="w-6 h-6 text-teal-800" />
            <span className="text-[10px] font-mono">TICKET #{report.id.slice(0, 6)}</span>
          </div>

        </div>

        {/* Copy Direct URL Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Direct Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-600 font-mono select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-800 hover:bg-teal-900 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
