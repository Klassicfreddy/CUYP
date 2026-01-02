
import React, { useState } from 'react';
import { FileText, Send, Share2, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

declare const google: any;

interface ReportViewProps {
  report: string | null;
  loading: boolean;
  onClose: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, loading, onClose }) => {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleWhatsAppShare = () => {
    if (!report) return;
    const encoded = encodeURIComponent(report);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleEmailAdmin = () => {
    if (!report) return;
    setEmailStatus('sending');

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(() => {
          setEmailStatus('sent');
          setTimeout(() => setEmailStatus('idle'), 3000);
        })
        .withFailureHandler((err: Error) => {
          console.error("Email error:", err);
          setEmailStatus('error');
          setTimeout(() => setEmailStatus('idle'), 3000);
        })
        .sendReportEmail(report);
    } else {
      // Mock for local development
      setTimeout(() => {
        setEmailStatus('sent');
        setTimeout(() => setEmailStatus('idle'), 3000);
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-lg font-semibold text-slate-700">Generating Monthly Report...</p>
          <p className="text-sm text-slate-500 text-center italic">Gemini is summarizing current and upcoming activities for you.</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Monthly Summary Report</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 bg-white p-6 rounded-xl border border-slate-200 shadow-inner">
            {report}
          </pre>
        </div>

        <div className="p-6 border-t bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
             <button
              onClick={handleEmailAdmin}
              disabled={emailStatus !== 'idle'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                emailStatus === 'sent' 
                  ? 'bg-green-600 text-white' 
                  : emailStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
              } ${emailStatus === 'sending' ? 'opacity-70 cursor-wait' : ''}`}
            >
              {emailStatus === 'sending' ? (
                <Loader2 className="animate-spin" size={18} />
              ) : emailStatus === 'sent' ? (
                <>
                  <CheckCircle2 size={18} />
                  Email Sent
                </>
              ) : emailStatus === 'error' ? (
                <>
                  <AlertCircle size={18} />
                  Failed
                </>
              ) : (
                <>
                  <Send size={18} />
                  Email to Me
                </>
              )}
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <Share2 size={18} />
              WhatsApp
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Powered by Gemini AI Intelligence</p>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
