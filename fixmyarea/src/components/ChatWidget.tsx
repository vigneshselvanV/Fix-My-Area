import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { askAssistant } from '../services/chatbotService';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actionLink?: {
    label: string;
    path: string;
  };
}

const QUICK_PROMPTS = [
  'How do I report an issue?',
  "What's my report status?",
  'How does risk scoring work?',
  'What categories can I report?',
];

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am your FixMyArea civic assistant. I can help you report issues, check report statuses, explain risk scoring, and answer app FAQs.',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Gather current user's reports context safely
  const fetchUserReportsSummary = async (): Promise<string> => {
    if (!user) return '';

    try {
      const reportsRef = collection(db, 'reports');
      let q = query(
        reportsRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(5)
      );

      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (orderErr) {
        // Fallback without orderBy in case composite index is still creating
        const simpleQ = query(reportsRef, where('user_id', '==', user.uid), limit(5));
        snapshot = await getDocs(simpleQ);
      }

      if (snapshot.empty) {
        return 'You have not submitted any reports yet.';
      }

      const reportLines = snapshot.docs.map((docSnap, index) => {
        const d = docSnap.data();
        const category = d.category || 'Civic Issue';
        const status = d.status || 'Reported';
        const risk = d.risk_level || 'Medium';
        const address = d.address || 'Location on map';
        const dateStr = d.created_at?.toDate
          ? d.created_at.toDate().toLocaleDateString()
          : 'Recently';
        return `Report #${index + 1}: ${category} at ${address} - Status: ${status}, Risk: ${risk}, Date: ${dateStr}`;
      });

      return reportLines.join('\n');
    } catch (err) {
      console.warn('Could not fetch user reports for chatbot context:', err);
      return '';
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend || inputMessage).trim();
    if (!rawText || loading || isCoolingDown) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: new Date(),
    };

    // Keep last 20 messages
    setMessages((prev) => [...prev.slice(-19), userMsg]);
    setInputMessage('');
    setLoading(true);
    setIsCoolingDown(true);

    // Rate-limit cooldown: release after 1.5 seconds
    setTimeout(() => setIsCoolingDown(false), 1500);

    try {
      const userReportsSummary = await fetchUserReportsSummary();
      const result = await askAssistant(rawText, userReportsSummary);

      // Check if response mentions navigating to /report/new
      let actionLink: { label: string; path: string } | undefined;
      const lowerReply = result.reply.toLowerCase();
      const lowerQuery = rawText.toLowerCase();

      if (
        lowerQuery.includes('how do i report') ||
        lowerQuery.includes('how to report') ||
        lowerQuery.includes('file a report') ||
        lowerReply.includes('report issue') ||
        lowerReply.includes('/report/new')
      ) {
        actionLink = {
          label: 'File a New Report Now',
          path: '/report/new',
        };
      } else if (
        lowerQuery.includes('live map') ||
        lowerQuery.includes('view map') ||
        lowerReply.includes('live map')
      ) {
        actionLink = {
          label: 'Open Live Map',
          path: '/map',
        };
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: result.reply,
        timestamp: new Date(),
        actionLink,
      };

      setMessages((prev) => [...prev.slice(-19), assistantMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        sender: 'assistant',
        text: "Sorry, I'm having trouble connecting right now — please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(-19), fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. How else can I assist with your civic reports today?',
        timestamp: new Date(),
      },
    ]);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Launcher Button (visible at bottom-right) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open FixMyArea Assistant"
            className="flex items-center gap-2.5 bg-teal-800 hover:bg-teal-900 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-[0_6px_20px_rgba(13,110,110,0.35)] transition-all hover:scale-105 active:scale-95 group cursor-pointer border-2 border-teal-600/40"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-teal-800" />
            </div>
            <span className="hidden sm:inline text-xs font-bold font-heading tracking-wide">
              Civic Assistant
            </span>
          </button>
        )}
      </div>

      {/* Floating Chat Panel (slide-up on mobile, popover card on desktop) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="FixMyArea Citizen Assistant"
          className="fixed inset-x-3 bottom-20 top-20 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[530px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="bg-teal-900 text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-800 border border-teal-600/60 flex items-center justify-center text-amber-300 shadow-2xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-white">
                    FixMyArea Assistant
                  </h3>
                  <span className="px-1.5 py-0.2 bg-teal-800/90 text-amber-300 text-[9px] font-bold rounded-sm border border-teal-700">
                    AI HELPER
                  </span>
                </div>
                <p className="text-[10px] text-teal-200/80 font-medium">
                  Official Civic & Triage Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Clear Chat"
                className="p-1.5 text-teal-300 hover:text-white hover:bg-teal-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                className="p-1.5 text-teal-300 hover:text-white hover:bg-teal-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FBF9F6]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-teal-800 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Deep-link action button inside assistant reply */}
                  {msg.actionLink && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(msg.actionLink!.path);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-[11px] border border-teal-300 transition-colors shadow-2xs cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
                        <span>{msg.actionLink.label}</span>
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 font-medium ${
                      msg.sender === 'user' ? 'text-teal-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing / Loading indicator */}
            {loading && (
              <div className="flex gap-2 items-center text-slate-500 animate-in fade-in">
                <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" />
                  <span className="text-[11px] font-semibold text-slate-500 ml-1">
                    Checking civic records...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick-Reply Chips */}
          {messages.length <= 3 && !loading && (
            <div className="px-3 pt-2 pb-1.5 bg-[#FBF9F6] border-t border-slate-200/60 overflow-x-auto scrollbar-none flex items-center gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading || isCoolingDown}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-[11px] font-semibold border border-slate-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about reports, statuses, categories..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading || isCoolingDown}
              className="p-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Send Message"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>Scoped to FixMyArea civic inquiries only. No private data shared.</span>
          </div>
        </div>
      )}
    </>
  );
};
