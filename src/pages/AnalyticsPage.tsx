import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  RefreshCw
} from 'lucide-react';
import { fetchAnalytics } from '../services/api.ts';
import { CityAnalytics } from '../types/index.ts';

export default function AnalyticsPage() {
  const [data, setData] = useState<CityAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-mono">AGGREGATING MUNICIPAL INCIDENT METRICS...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111620] border-t border-l border-white/15 border-b border-r border-black/80 text-[11px] font-mono font-bold text-cyan-300 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] animate-pulse" />
            <span>MUNICIPAL PERFORMANCE INTELLIGENCE // TELEMETRY CORE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            City Incident Analytics & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time data aggregation across reported categories, resolution speeds, and department workflows.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="tactile-button flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 w-fit"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* Top 4 KPI Instruments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="console-panel p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase font-mono font-bold text-slate-300">Total Logged</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
          </div>
          <p className="font-mono text-3xl font-extrabold text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            {data.totalIssues}
          </p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="h-full bg-cyan-400 shadow-[0_0_6px_#00d9ff] w-full" />
          </div>
          <p className="text-[10px] font-mono text-slate-400">Neighborhood tickets on record</p>
        </div>

        {/* KPI 2 */}
        <div className="console-panel p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase font-mono font-bold text-slate-300">Resolution Rate</span>
            <span className="led-green" />
          </div>
          <p className="font-mono text-3xl font-extrabold text-[#2ed573] tabular-nums drop-shadow-[0_0_8px_#2ed573]">
            {data.resolutionRatePercent}%
          </p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
            <div 
              className="h-full bg-[#2ed573] shadow-[0_0_6px_#2ed573]" 
              style={{ width: `${data.resolutionRatePercent}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-emerald-400 font-semibold">
            {data.resolvedIssues} of {data.totalIssues} successfully closed
          </p>
        </div>

        {/* KPI 3 */}
        <div className="console-panel p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase font-mono font-bold text-slate-300">Avg Turnaround</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
          </div>
          <p className="font-mono text-3xl font-extrabold text-cyan-300 tabular-nums drop-shadow-[0_0_8px_#00d9ff]">
            {data.avgResolutionHours}h
          </p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="h-full bg-cyan-400 shadow-[0_0_6px_#00d9ff] w-[75%]" />
          </div>
          <p className="text-[10px] font-mono text-cyan-400 font-semibold">Mean dispatch-to-close</p>
        </div>

        {/* KPI 4 */}
        <div className="console-panel p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] uppercase font-mono font-bold text-slate-300">Active In-Flight</span>
            <span className="led-amber" />
          </div>
          <p className="font-mono text-3xl font-extrabold text-[#ffa502] tabular-nums drop-shadow-[0_0_8px_#ffa502]">
            {data.inProgressIssues}
          </p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="h-full bg-[#ffa502] shadow-[0_0_6px_#ffa502] w-[50%]" />
          </div>
          <p className="text-[10px] font-mono text-amber-400 font-semibold">Work orders currently open</p>
        </div>
      </div>

      {/* CHARTS GRID IN RECESSED BEZEL INSTRUMENT SCREENS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Issues by Category */}
        <div className="console-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/40">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wide">Incidents by Category</h3>
              <p className="text-xs text-slate-400">Distribution across municipal service areas</p>
            </div>
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="recessed-display p-4 rounded-xl h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.categoryBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#cbd5e1' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111620',
                    borderColor: '#262c38',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ color: '#00d9ff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution (Donut) */}
        <div className="console-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/40">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wide">Status Pipeline Distribution</h3>
              <p className="text-xs text-slate-400">Current state of reported civic tickets</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-teal-400" />
          </div>

          <div className="recessed-display p-4 rounded-xl h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {data.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111620',
                    borderColor: '#262c38',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Clean Legend */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-xs pt-1 border-t border-black/40 w-full font-mono">
              {data.statusBreakdown.map((st) => (
                <div key={st.status} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="text-slate-300">
                    {st.status}: <b className="font-mono text-cyan-300">{st.count}</b>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: 7-Day Inflow vs Resolution Trend */}
        <div className="console-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-black/40">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wide">
                7-Day Inflow vs Resolution Velocity
              </h3>
              <p className="text-xs text-slate-400">Comparing citizen reporting rate against completed work orders</p>
            </div>
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="recessed-display p-4 rounded-xl h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.recentActivityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ed573" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2ed573" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2432" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111620',
                    borderColor: '#262c38',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reported"
                  stroke="#00d9ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReported)"
                  name="Reports Filed"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#2ed573"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  name="Reports Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
