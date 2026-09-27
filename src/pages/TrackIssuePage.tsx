import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Building,
  Share2,
  Check,
  AlertTriangle,
  PlusCircle,
  ThumbsUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { CivicIssue } from '../types/index.ts';
import { fetchIssueByTrackingId, upvoteIssue } from '../services/api.ts';
import { getMyReportIds } from '../utils/device.ts';
import { getCategoryMeta, getPriorityStyles, getStatusStyles } from '../utils/categories.ts';

export default function TrackIssuePage() {
  const { trackingId: paramId } = useParams();

  const [inputVal, setInputVal] = useState<string>(paramId || '');
  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [upvoting, setUpvoting] = useState<boolean>(false);

  const myReportIds = getMyReportIds();

  const handleLookup = async (idToSearch: string) => {
    const cleanId = idToSearch.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await fetchIssueByTrackingId(cleanId);
      setIssue(data);
      setInputVal(cleanId);
      window.history.replaceState(null, '', `/track/${cleanId}`);
    } catch (err: any) {
      setIssue(null);
      setErrorMsg(err.message || `No municipal report found for ID "${cleanId}". Please verify and try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) {
      handleLookup(paramId);
    }
  }, [paramId]);

  const handleCopyLink = () => {
    if (!issue) return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpvote = async () => {
    if (!issue || upvoting) return;
    setUpvoting(true);
    try {
      const updated = await upvoteIssue(issue.trackingId);
      setIssue(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  const steps = [
    { key: 'Reported', label: 'Reported', desc: 'Received & Queued' },
    { key: 'Verified', label: 'Verified', desc: 'Surveyed & Triaged' },
    { key: 'Assigned', label: 'Assigned', desc: 'Dispatched to Crew' },
    { key: 'In Progress', label: 'In Progress', desc: 'Active On-Site Work' },
    { key: 'Resolved', label: 'Resolved', desc: 'Work Order Completed' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Console Section Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111620] border-t border-l border-white/15 border-b border-r border-black/80 text-[11px] font-mono text-cyan-400 font-bold shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          INCIDENT TELEMETRY TRACKER // QUERY TERMINAL
        </div>
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Track Incident Resolution
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Enter your 8-character public tracking ID (e.g. <span className="font-mono text-cyan-300">CP-7A29F</span>) to inspect live field crew actions and lifecycle telemetry.
        </p>
      </div>

      {/* Recessed Control Panel Search Chassis */}
      <div className="console-panel p-5 rounded-2xl max-w-2xl mx-auto space-y-3 relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(inputVal);
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.toUpperCase())}
              placeholder="e.g. CP-7A29F"
              maxLength={12}
              className="w-full recessed-display pl-11 pr-4 py-3 rounded-xl text-base font-mono uppercase tracking-wider font-bold text-cyan-300 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="console-button-primary px-6 py-3 text-xs font-bold text-slate-950 flex items-center justify-center whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track Ticket'}
          </button>
        </form>

        {/* Quick Click Past Reports */}
        {myReportIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 flex-wrap border-t border-black/40">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">DEVICE LOGS:</span>
            {myReportIds.slice(0, 5).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleLookup(id)}
                className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all ${
                  inputVal === id
                    ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_#00d9ff]'
                    : 'tactile-button text-slate-300 hover:text-white'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ERROR STATE */}
      {errorMsg && (
        <div className="console-panel p-6 rounded-2xl border-rose-900/60 bg-[#160d12] text-center max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#200e16] border border-rose-500/40 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8),0_0_12px_rgba(255,71,87,0.3)] mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#ff4757]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-200">Incident Not Found</h3>
            <p className="text-xs text-rose-300/90 leading-relaxed">{errorMsg}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => handleLookup('CP-7A29F')}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold font-mono"
            >
              Load Demo Incident CP-7A29F
            </button>
            <span className="text-slate-600">·</span>
            <Link to="/map" className="text-xs text-slate-300 hover:text-white">
              Browse Active Map
            </Link>
          </div>
        </div>
      )}

      {/* LOADED ISSUE CARD */}
      {issue && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Tactical Card */}
          <div className="console-panel rounded-2xl p-6 sm:p-8 space-y-8 relative overflow-hidden">
            {/* Top metadata strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/50">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-2xl font-black text-cyan-400 tracking-wider drop-shadow-[0_0_8px_rgba(0,217,255,0.4)]">
                    {issue.trackingId}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                      getPriorityStyles(issue.priority).badge
                    }`}
                  >
                    {issue.priority} Priority
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                      getStatusStyles(issue.status).badge
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white pt-1">{issue.title}</h2>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className="tactile-button flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200"
                >
                  <ThumbsUp className="w-4 h-4 text-cyan-400" />
                  <span>Endorse ({issue.upvotes})</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="tactile-button flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#2ed573]" />
                      <span className="text-[#2ed573]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-slate-400" />
                      <span>Share Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STATUS TIMELINE: ROW OF BACKLIT INDICATOR LIGHTS CONNECTED BY PHYSICAL RAIL/TRACK */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
                  LIFECYCLE STATUS PIPELINE // BACKLIT TELEMETRY RAIL
                </h3>
                <span className="text-[11px] font-mono text-cyan-400">
                  STEP {getStatusStyles(issue.status).stepIndex + 1} OF 5
                </span>
              </div>

              {/* Physical Rail Chassis */}
              <div className="recessed-display p-6 rounded-2xl relative overflow-hidden">
                {/* Physical metallic track groove line running behind the LED bulbs */}
                <div className="absolute top-[42px] left-12 right-12 h-2 bg-[#090c12] rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.08)] pointer-events-none z-0" />
                
                {/* Active progress fill on the track */}
                <div 
                  className="absolute top-[42px] left-12 h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-cyan-400 rounded-full shadow-[0_0_10px_#00d9ff] pointer-events-none z-0 transition-all duration-700"
                  style={{
                    width: `calc(${getStatusStyles(issue.status).stepIndex * 25}% - 12px)`
                  }}
                />

                <div className="grid grid-cols-5 gap-2 relative z-10">
                  {steps.map((st, idx) => {
                    const currentIdx = getStatusStyles(issue.status).stepIndex;
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={st.key} className="flex flex-col items-center text-center">
                        {/* Tactile LED Bulb Socket */}
                        <div className="w-12 h-12 rounded-full bg-[#141822] border-t border-l border-white/20 border-b border-r border-black/90 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.6)] flex items-center justify-center p-1 relative">
                          {isCurrent ? (
                            <div className="w-8 h-8 rounded-full bg-cyan-400 border border-white/80 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.5),0_0_16px_#00d9ff,0_0_32px_rgba(0,217,255,0.6)] flex items-center justify-center text-slate-950 font-mono font-black text-xs animate-pulse">
                              {idx + 1}
                            </div>
                          ) : isDone ? (
                            <div className="w-8 h-8 rounded-full bg-[#2ed573] border border-white/60 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.5),0_0_12px_#2ed573] flex items-center justify-center text-slate-950 font-bold text-xs">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0b0e14] border border-white/5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center text-slate-600 font-mono text-xs">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-xs mt-3 font-mono font-bold tracking-tight ${
                            isCurrent ? 'text-cyan-300 drop-shadow-[0_0_6px_#00d9ff]' : isDone ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {st.label}
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline font-mono mt-0.5">{st.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Details Grid & Recessed Screen Photo Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-black/50">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs uppercase font-mono font-semibold text-slate-400 tracking-wider">
                    INCIDENT REPORT LOG
                  </h4>
                  <div className="recessed-display p-4 rounded-xl text-sm text-slate-200 leading-relaxed font-sans">
                    {issue.description}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="tactile-card p-3 rounded-xl space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Building className="w-3.5 h-3.5 text-purple-400" />
                      ASSIGNED JURISDICTION
                    </span>
                    <p className="text-sm font-semibold text-white">{issue.department}</p>
                    {issue.assignedCrew && (
                      <p className="text-[11px] text-purple-300 font-mono font-semibold">{issue.assignedCrew}</p>
                    )}
                  </div>

                  <div className="tactile-card p-3 rounded-xl space-y-1">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      GEOLOCATION LOCK
                    </span>
                    <p className="text-sm font-semibold text-white truncate">{issue.location.address}</p>
                    <p className="text-[11px] font-mono text-cyan-400">
                      GPS: {issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Priority Rule Transparency Console Readout */}
                {issue.priorityReasoning && issue.priorityReasoning.length > 0 && (
                  <div className="recessed-display p-4 rounded-xl space-y-2 border-l-2 border-cyan-400">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00d9ff]" />
                      DETERMINISTIC PRIORITY CLASSIFICATION TRACE:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                      {issue.priorityReasoning.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">›</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Photo Column in Recessed Metal Bezel Screen */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono font-semibold text-slate-400 tracking-wider">
                  CAMERA EVIDENCE FEED
                </h4>
                {issue.photoUrl ? (
                  <div className="recessed-display rounded-xl overflow-hidden relative p-1">
                    <img
                      src={issue.photoUrl}
                      alt={issue.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-cyan-300 border border-white/10">
                      EVID-IMG-01
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded-xl recessed-display flex items-center justify-center text-xs text-slate-500 text-center p-4 font-mono">
                    NO FIELD PHOTO ENCLOSED
                  </div>
                )}

                <div className="tactile-card p-3.5 rounded-xl text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>RECORD CREATED:</span>
                    <span className="text-slate-200">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>CREW SYNC:</span>
                    <span className="text-cyan-300">
                      {new Date(issue.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE LOG - TACTICAL EVENT RECORDER */}
            <div className="space-y-4 pt-4 border-t border-black/50">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="led-amber" />
                DISPATCH & WORK ORDER TELEMETRY LOG
              </h3>

              <div className="space-y-3">
                {issue.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="tactile-card p-4 rounded-xl flex items-start gap-3.5"
                  >
                    <div className="mt-0.5">
                      {item.status === 'Resolved' ? (
                        <span className="led-green" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] inline-block" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-wide">{item.title}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {item.remark && <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.remark}</p>}
                      {item.actor && (
                        <p className="text-[10px] text-cyan-400/80 font-mono">AUTHORIZED LOG BY: {item.actor}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-black/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to="/#report-widget"
                className="tactile-button w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-200 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>Report Another Incident</span>
              </Link>

              <Link
                to="/map"
                className="console-button-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-950 flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Locate on Console Map</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
