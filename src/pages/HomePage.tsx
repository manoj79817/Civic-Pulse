import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Radio
} from 'lucide-react';
import QuickReportWidget from '../components/QuickReportWidget.tsx';
import { fetchAnalytics, fetchIssues } from '../services/api.ts';
import { CityAnalytics, CivicIssue } from '../types/index.ts';
import { getCategoryMeta, getPriorityStyles, getStatusStyles } from '../utils/categories.ts';
import IssueDetailModal from '../components/IssueDetailModal.tsx';

export default function HomePage() {
  const [analytics, setAnalytics] = useState<CityAnalytics | null>(null);
  const [recentIssues, setRecentIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, issuesData] = await Promise.all([
        fetchAnalytics(),
        fetchIssues()
      ]);
      setAnalytics(analyticsData);
      setRecentIssues(issuesData.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCreated = (newIssue: CivicIssue) => {
    setRecentIssues((prev) => [newIssue, ...prev.slice(0, 5)]);
    if (analytics) {
      setAnalytics({
        ...analytics,
        totalIssues: analytics.totalIssues + 1,
        inProgressIssues: analytics.inProgressIssues + 1
      });
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION / MAIN COCKPIT HEADER */}
      <section className="relative pt-10 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle top-left light spill ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Tactical Cockpit System Status Ribbon */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141822] border-t border-l border-white/20 border-b border-r border-black/90 text-xs font-mono text-cyan-300 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.6)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] animate-pulse" />
            <span className="tracking-widest uppercase font-bold">MUNICIPAL MESH: ONLINE // ZERO LOGIN REQUIRED</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              See it. Report it.{' '}
              <span className="text-cyan-400 drop-shadow-[0_0_16px_rgba(0,217,255,0.7)]">
                Resolve it.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
              CivicPulse is a high-speed civic reporting console. No account signup, no friction.
              File neighborhood hazards, get an encrypted tracking code, and observe municipal dispatch teams in real time.
            </p>
          </div>

          {/* Quick Cockpit Navigation Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#report-widget"
              className="console-button-primary px-6 py-3 text-xs tracking-wider font-bold text-slate-950 flex items-center gap-2"
            >
              <span>LOG AN INCIDENT</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/map"
              className="console-button-secondary px-6 py-3 text-xs tracking-wider font-bold text-slate-200 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>RADAR GEOMAP</span>
            </Link>

            <Link
              to="/track"
              className="tactile-button px-6 py-3 text-xs tracking-wider font-bold text-slate-300 flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-purple-400" />
              <span>QUERY TICKET</span>
            </Link>
          </div>
        </div>

        {/* 4 TACTILE STAT GAUGES WITH DUAL-TONE SHADOWS & BEVELS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto text-left">
          {/* Gauge 1 */}
          <div className="console-panel p-4 sm:p-5 rounded-2xl relative space-y-2">
            <div className="absolute top-2.5 right-2.5 hex-screw" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-300">
                TOTAL TELEMETRY
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              {analytics ? analytics.totalIssues : '---'}
            </p>
            {/* Recessed horizontal gauge fill meter */}
            <div className="w-full h-2 rounded-full bg-[#090c12] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] w-full" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 block">Reported in Metro</span>
          </div>

          {/* Gauge 2 */}
          <div className="console-panel p-4 sm:p-5 rounded-2xl relative space-y-2">
            <div className="absolute top-2.5 right-2.5 hex-screw" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-300">
                RESOLUTION RATE
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
            </div>
            <p className="text-3xl font-mono font-black text-[#2ed573] tabular-nums drop-shadow-[0_0_8px_rgba(46,213,115,0.4)]">
              {analytics ? `${analytics.resolutionRatePercent}%` : '---'}
            </p>
            <div className="w-full h-2 rounded-full bg-[#090c12] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
              <div 
                className="h-full bg-[#2ed573] shadow-[0_0_8px_#2ed573] transition-all duration-500" 
                style={{ width: analytics ? `${analytics.resolutionRatePercent}%` : '85%' }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400 block">Field Work Orders Closed</span>
          </div>

          {/* Gauge 3 */}
          <div className="console-panel p-4 sm:p-5 rounded-2xl relative space-y-2">
            <div className="absolute top-2.5 right-2.5 hex-screw" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-300">
                AVG TURNAROUND
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-mono font-black text-amber-300 tabular-nums drop-shadow-[0_0_8px_rgba(255,165,2,0.4)]">
              {analytics ? `${analytics.avgResolutionHours}h` : '---'}
            </p>
            <div className="w-full h-2 rounded-full bg-[#090c12] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="h-full bg-amber-400 shadow-[0_0_8px_#ffa502] w-3/4" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 block">Dispatch-to-completion</span>
          </div>

          {/* Gauge 4 */}
          <div className="console-panel p-4 sm:p-5 rounded-2xl relative space-y-2">
            <div className="absolute top-2.5 right-2.5 hex-screw" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-300">
                ACTIVE IN FIELD
              </span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-mono font-black text-purple-300 tabular-nums drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
              {analytics ? analytics.inProgressIssues : '---'}
            </p>
            <div className="w-full h-2 rounded-full bg-[#090c12] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="h-full bg-purple-400 shadow-[0_0_8px_#a855f7] w-1/2" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 block">Crew Units Deployed</span>
          </div>
        </div>
      </section>

      {/* CORE QUICK REPORT WIDGET IN CONSOLE DECK */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-6 space-y-1">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00d9ff]" />
            CITIZEN REPORTING DISPATCH INTERFACE
          </span>
          <h2 className="text-2xl font-display font-extrabold text-white">
            Log an Infrastructure Issue
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Submit a neighborhood problem in 4 simple physical tactile steps.
          </p>
        </div>

        <QuickReportWidget onIssueCreated={handleIssueCreated} />
      </section>

      {/* RECENT INCIDENTS TELEMETRY DECK */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/40 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="led-amber" />
              <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wide">
                Live Incident Telemetry Feed
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time feed of neighborhood reports across Austin metropolitan grid
            </p>
          </div>

          <Link
            to="/map"
            className="tactile-button px-4 py-2 text-xs font-bold text-cyan-300 flex items-center gap-2 w-fit"
          >
            <span>FULL RADAR MAP</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentIssues.map((issue) => {
            const prio = getPriorityStyles(issue.priority);
            const status = getStatusStyles(issue.status);
            const cat = getCategoryMeta(issue.category);

            return (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="console-panel console-panel-interactive p-4 sm:p-5 rounded-2xl cursor-pointer space-y-3 group"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={prio.dot} />
                    <span className="font-mono text-cyan-400 font-bold text-xs tracking-wider">
                      {issue.trackingId}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${prio.badge}`}>
                    {issue.priority} Priority
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {issue.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-sans">
                    {issue.description}
                  </p>
                </div>

                {/* Recessed mini photo if available */}
                {issue.photoUrl && (
                  <div className="recessed-display h-28 rounded-xl overflow-hidden p-0.5">
                    <img
                      src={issue.photoUrl}
                      alt={issue.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Footer telemetry */}
                <div className="pt-2 border-t border-black/40 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{issue.location.address}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.badge}`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DETAIL MODAL */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdate={(updated) => {
          setSelectedIssue(updated);
          setRecentIssues(recentIssues.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />
    </div>
  );
}
