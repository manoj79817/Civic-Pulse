import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  ThumbsUp,
  Share2,
  Check,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { CivicIssue } from '../types/index.ts';
import { getCategoryMeta, getPriorityStyles, getStatusStyles } from '../utils/categories.ts';
import { upvoteIssue } from '../services/api.ts';

interface Props {
  issue: CivicIssue | null;
  onClose: () => void;
  onUpdate?: (updated: CivicIssue) => void;
}

export default function IssueDetailModal({ issue, onClose, onUpdate }: Props) {
  const [copied, setCopied] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<CivicIssue | null>(issue);

  if (!issue) return null;

  const active = currentIssue || issue;
  const categoryMeta = getCategoryMeta(active.category);
  const priorityStyle = getPriorityStyles(active.priority);
  const statusStyle = getStatusStyles(active.status);
  const CategoryIcon = categoryMeta.icon;

  const handleCopy = () => {
    const url = `${window.location.origin}/track/${active.trackingId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const updated = await upvoteIssue(active.trackingId);
      setCurrentIssue(updated);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  const steps = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl console-panel rounded-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-black/40 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-cyan-400 font-bold text-sm tracking-wider bg-[#111620] px-3 py-1 rounded border-t border-l border-white/10 border-b border-r border-black/80 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                {active.trackingId}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${priorityStyle.badge}`}>
                {active.priority} Priority
              </span>
              <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${statusStyle.badge}`}>
                {active.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white pt-1">{active.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="tactile-button p-2 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Photo in recessed display frame if present */}
          {active.photoUrl && (
            <div className="recessed-display rounded-xl overflow-hidden max-h-72 p-1 relative">
              <img
                src={active.photoUrl}
                alt={active.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover max-h-72 rounded-lg"
              />
              <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-white/10">
                EVID-CAPTURE
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              CITIZEN INCIDENT STATEMENT
            </h4>
            <div className="recessed-display p-4 rounded-xl text-sm text-slate-200 leading-relaxed font-sans">
              {active.description}
            </div>
          </div>

          {/* Classification & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="tactile-card p-3.5 rounded-xl space-y-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <CategoryIcon className="w-4 h-4 text-cyan-400" />
                CIVIC CATEGORY
              </span>
              <p className="text-sm font-semibold text-white">{categoryMeta.name}</p>
              <p className="text-[11px] text-slate-400 font-sans">{categoryMeta.shortDesc}</p>
            </div>

            <div className="tactile-card p-3.5 rounded-xl space-y-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Building className="w-4 h-4 text-purple-400" />
                ASSIGNED JURISDICTION
              </span>
              <p className="text-sm font-semibold text-white">{active.department}</p>
              {active.assignedCrew && (
                <p className="text-[11px] text-purple-300 font-bold">{active.assignedCrew}</p>
              )}
            </div>

            <div className="tactile-card p-3.5 rounded-xl space-y-1.5 sm:col-span-2">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <MapPin className="w-4 h-4 text-rose-400" />
                COORDINATES & ADDRESS
              </span>
              <p className="text-sm font-semibold text-white font-sans">{active.location.address}</p>
              <p className="text-[11px] text-cyan-400">
                GPS: {active.location.lat.toFixed(5)}, {active.location.lng.toFixed(5)}
                {active.location.neighborhood && ` · ${active.location.neighborhood}`}
              </p>
            </div>
          </div>

          {/* Priority Evaluation Reasons */}
          {active.priorityReasoning && active.priorityReasoning.length > 0 && (
            <div className="recessed-display p-4 rounded-xl space-y-2 border-l-2 border-cyan-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  DETERMINISTIC PRIORITY AUDIT
                </h4>
              </div>
              <ul className="space-y-1 text-xs text-slate-300 font-mono">
                {active.priorityReasoning.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">›</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Stepper Progression */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              WORKFLOW PIPELINE
            </h4>
            <div className="recessed-display p-4 rounded-xl">
              <div className="grid grid-cols-5 gap-1 relative text-center">
                {steps.map((st, idx) => {
                  const isPassed = statusStyle.stepIndex >= idx;
                  const isCurrent = statusStyle.stepIndex === idx;

                  return (
                    <div key={st} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                          isCurrent
                            ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_#00d9ff] animate-pulse'
                            : isPassed
                            ? 'bg-[#2ed573] text-slate-950'
                            : 'bg-[#111620] text-slate-600 border border-white/5'
                        }`}
                      >
                        {isPassed && !isCurrent ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] mt-1.5 font-mono ${
                          isCurrent ? 'text-cyan-300 font-bold' : isPassed ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Activity Timeline Events */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              CREW DISPATCH LOG
            </h4>
            <div className="space-y-2.5">
              {active.timeline.map((evt) => (
                <div
                  key={evt.id}
                  className="tactile-card p-3 rounded-lg flex items-start gap-3"
                >
                  <div className="mt-0.5">
                    {evt.status === 'Resolved' ? (
                      <span className="led-green" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] inline-block" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{evt.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {evt.remark && <p className="text-xs text-slate-300 font-sans">{evt.remark}</p>}
                    {evt.actor && (
                      <p className="text-[10px] text-cyan-400 font-mono">CALL-SIGN: {evt.actor}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#111620] border-t border-black/40 flex items-center justify-between gap-3">
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className="tactile-button flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Endorse ({active.upvotes})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="tactile-button flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2ed573]" />
                  <span className="text-[#2ed573]">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tracking Link</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="console-button-primary px-4 py-2 text-xs font-bold text-slate-950"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
