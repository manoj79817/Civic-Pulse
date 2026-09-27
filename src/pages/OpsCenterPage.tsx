import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  UserCheck,
  MessageSquarePlus,
  Eye,
  ChevronRight,
  TrendingUp,
  Activity,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { CivicIssue, IssuePriority, IssueStatus } from '../types/index.ts';
import {
  fetchIssues,
  updateIssueStatus,
  updateIssuePriority,
  assignIssueDepartment,
  addIssueRemark,
  resetDatabaseSeed
} from '../services/api.ts';
import { getCategoryMeta, getPriorityStyles, getStatusStyles } from '../utils/categories.ts';
import IssueDetailModal from '../components/IssueDetailModal.tsx';

const DEPARTMENTS = [
  'Department of Public Works',
  'Municipal Water & Sewer Authority',
  'City Power & Lighting Grid',
  'Waste Management & Sanitation',
  'Bureau of Traffic Management',
  'Parks & Urban Forestry Division'
];

const PRIORITIES: IssuePriority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: IssueStatus[] = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

// Priority Rotary Knob Angles
const PRIORITY_ANGLES: Record<IssuePriority, number> = {
  Low: -45,
  Medium: 0,
  High: 45,
  Critical: 90
};

export default function OpsCenterPage() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  // Active rotary dial popup / editing
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  // Remark Modal
  const [remarkTarget, setRemarkTarget] = useState<CivicIssue | null>(null);
  const [remarkText, setRemarkText] = useState<string>('');
  const [remarkActor, setRemarkActor] = useState<string>('Ops Dispatcher');
  const [isSubmittingRemark, setIsSubmittingRemark] = useState<boolean>(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await fetchIssues();
      setIssues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Inline Status Change via Tactile Switch
  const handleStatusChange = async (trackingId: string, newStatus: IssueStatus) => {
    try {
      const updated = await updateIssueStatus(
        trackingId,
        newStatus,
        `Status shifted to ${newStatus} via Operations Switch Console.`,
        'Ops Dispatcher'
      );
      setIssues((prev) => prev.map((i) => (i.trackingId === trackingId ? updated : i)));
      setEditingStatusId(null);
      showToast(`Shifted ${trackingId} status to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to update status`);
    }
  };

  // Inline Priority Change via Tactile Rotary Dial
  const handlePriorityChange = async (trackingId: string, newPriority: IssuePriority) => {
    try {
      const updated = await updateIssuePriority(
        trackingId,
        newPriority,
        `Manual rotary dial escalation to ${newPriority}`
      );
      setIssues((prev) => prev.map((i) => (i.trackingId === trackingId ? updated : i)));
      setEditingPriorityId(null);
      showToast(`Rotated priority of ${trackingId} to ${newPriority}`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to update priority`);
    }
  };

  // Inline Department Assignment
  const handleDepartmentChange = async (trackingId: string, department: string) => {
    try {
      const updated = await assignIssueDepartment(
        trackingId,
        department,
        undefined,
        `Reassigned work order to ${department} via Operations Console.`
      );
      setIssues((prev) => prev.map((i) => (i.trackingId === trackingId ? updated : i)));
      showToast(`Dispatched ${trackingId} to ${department}`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to reassign department`);
    }
  };

  // Submit Remark
  const handleSaveRemark = async () => {
    if (!remarkTarget || !remarkText.trim()) return;
    setIsSubmittingRemark(true);
    try {
      const updated = await addIssueRemark(remarkTarget.trackingId, remarkText.trim(), remarkActor);
      setIssues((prev) => prev.map((i) => (i.trackingId === remarkTarget.trackingId ? updated : i)));
      showToast(`Official note appended to ${remarkTarget.trackingId}`);
      setRemarkTarget(null);
      setRemarkText('');
    } catch (err) {
      console.error(err);
      showToast(`Failed to add remark`);
    } finally {
      setIsSubmittingRemark(false);
    }
  };

  // Reset Demo Seed
  const handleResetSeed = async () => {
    if (!window.confirm('Reset all issues to original clean demo state?')) return;
    try {
      await resetDatabaseSeed();
      await loadIssues();
      showToast('Master dataset recalibrated to factory seed!');
    } catch (err) {
      console.error(err);
      showToast('Failed to reset dataset');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Tracking ID', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Address', 'Created At'];
    const rows = filteredIssues.map((i) => [
      i.trackingId,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.priority,
      i.status,
      `"${i.department}"`,
      `"${i.location.address.replace(/"/g, '""')}"`,
      i.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civicpulse_dispatch_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported telemetry CSV file.');
  };

  // Filtered dataset
  const filteredIssues = issues.filter((i) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        i.trackingId.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.location.address.toLowerCase().includes(q) ||
        i.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
    if (filterDepartment !== 'all' && i.department !== filterDepartment) return false;
    return true;
  });

  // KPI calculations
  const total = issues.length;
  const critical = issues.filter((i) => i.priority === 'Critical' && i.status !== 'Resolved').length;
  const unassigned = issues.filter((i) => i.status === 'Reported').length;
  const inProgress = issues.filter((i) => i.status === 'In Progress' || i.status === 'Assigned').length;
  const resolved = issues.filter((i) => i.status === 'Resolved').length;

  // Department Workload calculation for analog gauges
  // Max capacity standard per department: 8 active cases nominal
  const deptWorkloads = DEPARTMENTS.map((dept) => {
    const deptIssues = issues.filter((i) => i.department === dept);
    const activeDeptIssues = deptIssues.filter((i) => i.status !== 'Resolved');
    const capacityLimit = 8;
    const loadPercent = Math.min(100, Math.round((activeDeptIssues.length / capacityLimit) * 100));
    const isCriticalOverload = loadPercent >= 80;
    const isHighLoad = loadPercent >= 50 && loadPercent < 80;

    return {
      name: dept,
      totalCount: deptIssues.length,
      activeCount: activeDeptIssues.length,
      loadPercent,
      isCriticalOverload,
      isHighLoad
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#141822] border-t border-l border-white/20 border-b border-r border-black/90 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_20px_rgba(0,217,255,0.4)] animate-bounce flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#16120b] border-t border-l border-white/10 border-b border-r border-black/90 text-[11px] font-mono font-bold text-[#ffa502] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
            <span className="led-amber" />
            <span>MUNICIPAL OPERATIONS CENTER // MASTER COMMAND CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            City Incident Dispatch & Triage
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Internal operations console for managing department dispatches, rotary priority escalations, and mechanical status transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="tactile-button flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleResetSeed}
            className="tactile-button flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200"
            title="Reset to initial seed issues"
          >
            <RotateCcw className="w-4 h-4 text-[#ffa502]" />
            <span>Reset Demo Seed</span>
          </button>

          <button
            onClick={loadIssues}
            className="tactile-button p-2 text-slate-300 hover:text-white"
            title="Refresh issues"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOP KPI TACTILE INSTRUMENTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="console-panel p-4 rounded-xl space-y-1 relative">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Total Backlog</span>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <p className="font-mono text-2xl font-bold text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{total}</p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden mt-2">
            <div className="h-full bg-slate-400 w-full" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">ALL CITY REPORTS</span>
        </div>

        <div className="console-panel p-4 rounded-xl space-y-1 border-rose-900/40 relative">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] uppercase font-mono font-bold text-rose-300">Critical Alerts</span>
            <span className="led-red led-red-pulse" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#ff4757] tabular-nums drop-shadow-[0_0_8px_#ff4757]">{critical}</p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden mt-2">
            <div className="h-full bg-[#ff4757] shadow-[0_0_6px_#ff4757] w-full" />
          </div>
          <span className="text-[10px] text-[#ff4757]/80 font-mono">IMMEDIATE HAZARDS</span>
        </div>

        <div className="console-panel p-4 rounded-xl space-y-1 relative">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Unassigned</span>
            <span className="led-amber" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#ffa502] tabular-nums drop-shadow-[0_0_8px_#ffa502]">{unassigned}</p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden mt-2">
            <div className="h-full bg-[#ffa502] shadow-[0_0_6px_#ffa502] w-[45%]" />
          </div>
          <span className="text-[10px] text-[#ffa502]/80 font-mono">AWAITING TRIAGE</span>
        </div>

        <div className="console-panel p-4 rounded-xl space-y-1 relative">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Active Crews</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
          </div>
          <p className="font-mono text-2xl font-bold text-cyan-300 tabular-nums drop-shadow-[0_0_8px_#00d9ff]">{inProgress}</p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden mt-2">
            <div className="h-full bg-cyan-400 shadow-[0_0_6px_#00d9ff] w-[68%]" />
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono">IN PROGRESS / DISPATCHED</span>
        </div>

        <div className="console-panel p-4 rounded-xl space-y-1 relative col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Resolved</span>
            <span className="led-green" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#2ed573] tabular-nums drop-shadow-[0_0_8px_#2ed573]">{resolved}</p>
          <div className="w-full h-1.5 rounded bg-[#0b0e14] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] overflow-hidden mt-2">
            <div className="h-full bg-[#2ed573] shadow-[0_0_6px_#2ed573] w-[88%]" />
          </div>
          <span className="text-[10px] text-[#2ed573]/80 font-mono">SUCCESSFULLY CLOSED</span>
        </div>
      </div>

      {/* DEPARTMENT WORKLOAD ALLOCATION // ANALOG GAUGES */}
      <section className="console-panel p-6 rounded-2xl space-y-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/40 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] animate-pulse" />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              DEPARTMENT WORKLOAD TELEMETRY // ANALOG GAUGES
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="led-green" /> NOMINAL (&lt;50%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="led-amber" /> ELEVATED (50-80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="led-red led-red-pulse" /> OVERLOAD (&gt;80%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptWorkloads.map((dept) => {
            const isFiltered = filterDepartment === dept.name;

            return (
              <div
                key={dept.name}
                className={`tactile-card p-4 rounded-xl space-y-3 transition-all ${
                  isFiltered ? 'ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,217,255,0.3)]' : ''
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white font-mono line-clamp-1 block" title={dept.name}>
                      {dept.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Active: <b className="text-cyan-300">{dept.activeCount}</b> cases / Total: {dept.totalCount}
                    </span>
                  </div>

                  {/* Status LED */}
                  <div className="shrink-0 mt-0.5">
                    {dept.isCriticalOverload ? (
                      <span className="led-red led-red-pulse" title="Critical Overload" />
                    ) : dept.isHighLoad ? (
                      <span className="led-amber" title="High Workload" />
                    ) : (
                      <span className="led-green" title="Nominal Capacity" />
                    )}
                  </div>
                </div>

                {/* Physical Analog Gauge Bar with Needle & Ticks */}
                <div className="space-y-1">
                  <div className="analog-gauge-track relative h-4">
                    {/* Background multi-zone capacity gradient */}
                    <div
                      className="absolute inset-0 opacity-75"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(46,213,115,0.6) 0%, rgba(255,217,61,0.6) 50%, rgba(255,165,2,0.7) 75%, rgba(255,71,87,0.85) 100%)'
                      }}
                    />

                    {/* Progress Fill Meter */}
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${dept.loadPercent}%`,
                        background: dept.isCriticalOverload
                          ? '#ff4757'
                          : dept.isHighLoad
                          ? '#ffa502'
                          : '#2ed573',
                        boxShadow: dept.isCriticalOverload
                          ? '0 0 10px #ff4757'
                          : dept.isHighLoad
                          ? '0 0 8px #ffa502'
                          : '0 0 8px #2ed573'
                      }}
                    />

                    {/* Analog Physical Gauge Needle */}
                    <div
                      className="analog-gauge-needle"
                      style={{
                        left: `calc(${dept.loadPercent}% - 1.5px)`
                      }}
                    />
                  </div>

                  {/* Calibration tick marks */}
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                    <span>| 0%</span>
                    <span>| 25%</span>
                    <span>| 50%</span>
                    <span>| 75%</span>
                    <span>| 100%</span>
                  </div>
                </div>

                {/* Footer quick action to filter */}
                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-black/30">
                  <span className={`font-bold ${dept.isCriticalOverload ? 'text-[#ff4757]' : 'text-slate-300'}`}>
                    LOAD: {dept.loadPercent}% CAPACITY
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterDepartment(isFiltered ? 'all' : dept.name)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                  >
                    {isFiltered ? 'CLEAR ISOLATION' : 'ISOLATE DEPT ›'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR CHASSIS */}
      <div className="console-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking ID, street, keyword..."
            className="w-full recessed-display pl-9 pr-3 py-2 rounded-lg text-xs font-mono text-cyan-300 placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="recessed-display px-3 py-1.5 rounded-lg text-xs font-mono bg-[#0d1017] text-slate-200 focus:outline-none"
          >
            <option value="all">ALL PIPELINE STATUSES</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="recessed-display px-3 py-1.5 rounded-lg text-xs font-mono bg-[#0d1017] text-slate-200 focus:outline-none"
          >
            <option value="all">ALL SEVERITY LEVELS</option>
            <option value="Critical">🔴 CRITICAL</option>
            <option value="High">🟠 HIGH</option>
            <option value="Medium">🟡 MEDIUM</option>
            <option value="Low">🟢 LOW</option>
          </select>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="recessed-display px-3 py-1.5 rounded-lg text-xs font-mono bg-[#0d1017] text-slate-200 max-w-[200px] focus:outline-none"
          >
            <option value="all">ALL JURISDICTIONS</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* OPERATIONS DATA TABLE CHASSIS */}
      <div className="console-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121620] border-b border-black/60 text-slate-300 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Problem / Location</th>
                <th className="py-3 px-4">Priority (Rotary Dial)</th>
                <th className="py-3 px-4">Status (Mechanical Switch)</th>
                <th className="py-3 px-4">Department Dispatch</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/40">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    NO WORK ORDERS MATCHING ACTIVE FILTER
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const prio = getPriorityStyles(issue.priority);
                  const status = getStatusStyles(issue.status);
                  const meta = getCategoryMeta(issue.category);
                  const isEditingPrio = editingPriorityId === issue.id;
                  const isEditingStatus = editingStatusId === issue.id;

                  return (
                    <tr key={issue.id} className="hover:bg-[#202735]/40 transition-colors">
                      {/* Ticket Col */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={prio.dot} />
                          <span className="font-mono text-cyan-400 font-bold tracking-wider">
                            {issue.trackingId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(issue.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Title & Location Col */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-white truncate">{issue.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{issue.location.address}</p>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                          <span className="text-cyan-400/80">{meta.name}</span>
                          <span>·</span>
                          <span>{issue.upvotes} endorsements</span>
                        </div>
                      </td>

                      {/* PRIORITY CONTROL VIA TACTILE ROTARY DIAL / STEP-SWITCH */}
                      <td className="py-3 px-4 whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-2">
                          {/* Tactile Rotary Dial Knob Button */}
                          <button
                            type="button"
                            onClick={() => {
                              // Cycle to next priority on click or open selector
                              const nextIdx = (PRIORITIES.indexOf(issue.priority) + 1) % PRIORITIES.length;
                              handlePriorityChange(issue.trackingId, PRIORITIES[nextIdx]);
                            }}
                            className="rotary-knob-casing group"
                            title={`Rotary Dial: ${issue.priority} (Click to step next)`}
                          >
                            {/* Inner metallic bezel */}
                            <div className="w-8 h-8 rounded-full bg-[#181f2a] border border-black/80 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center relative">
                              {/* Pointer rotating to angle */}
                              <div
                                className="rotary-knob-pointer transition-transform duration-200"
                                style={{
                                  transform: `rotate(${PRIORITY_ANGLES[issue.priority]}deg)`,
                                  transformOrigin: 'bottom center'
                                }}
                              />
                            </div>
                          </button>

                          {/* Priority Pill & Quick Selector Popover Trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setEditingPriorityId(isEditingPrio ? null : issue.id)}
                              className={`font-semibold font-mono rounded-lg px-2.5 py-1 text-xs border flex items-center gap-1.5 transition-all tactile-button ${prio.badge}`}
                            >
                              <span className={prio.dot} />
                              <span>{issue.priority}</span>
                            </button>

                            {/* Dropdown switchbank popover when clicked */}
                            {isEditingPrio && (
                              <div className="absolute left-0 top-full mt-1.5 z-40 console-panel rounded-xl p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.9)] flex flex-col gap-1 w-32 border border-white/20">
                                {PRIORITIES.map((p) => {
                                  const pStyle = getPriorityStyles(p);
                                  const isActive = issue.priority === p;

                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => handlePriorityChange(issue.trackingId, p)}
                                      className={`px-2 py-1.5 rounded-lg text-left text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                                        isActive
                                          ? 'tactile-button-active text-cyan-300 shadow-[0_0_8px_#00d9ff]'
                                          : 'hover:bg-white/5 text-slate-300'
                                      }`}
                                    >
                                      <span className={pStyle.dot} />
                                      <span>{p}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* STATUS CONTROL VIA MECHANICAL STEPPED SWITCH WIDGET */}
                      <td className="py-3 px-4 whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-2.5">
                          {/* 3D Stepped Switch Indicator */}
                          <button
                            type="button"
                            onClick={() => {
                              // Step to next status in pipeline on click
                              const currIdx = STATUSES.indexOf(issue.status);
                              const nextIdx = (currIdx + 1) % STATUSES.length;
                              handleStatusChange(issue.trackingId, STATUSES[nextIdx]);
                            }}
                            className="toggle-switch-track cursor-pointer relative"
                            title={`Mechanical Switch: ${issue.status} (Click to step next)`}
                          >
                            <div
                              className="toggle-switch-knob"
                              style={{
                                left: `${(STATUSES.indexOf(issue.status) / (STATUSES.length - 1)) * 26 + 3}px`,
                                background:
                                  issue.status === 'Resolved'
                                    ? 'linear-gradient(145deg, #2ed573, #1e9d52)'
                                    : issue.status === 'In Progress'
                                    ? 'linear-gradient(145deg, #00d9ff, #0099b8)'
                                    : 'linear-gradient(145deg, #353f4e, #1d232c)',
                                boxShadow:
                                  issue.status === 'Resolved'
                                    ? '0 0 10px #2ed573'
                                    : issue.status === 'In Progress'
                                    ? '0 0 10px #00d9ff'
                                    : '0 2px 6px rgba(0,0,0,0.85)'
                              }}
                            />
                          </button>

                          {/* Quick Step Switch Selector Popover Trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setEditingStatusId(isEditingStatus ? null : issue.id)}
                              className={`font-semibold font-mono rounded-lg px-2.5 py-1 text-xs border flex items-center gap-1.5 transition-all tactile-button ${status.badge}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span>{issue.status}</span>
                            </button>

                            {/* Dropdown switchbank popover when clicked */}
                            {isEditingStatus && (
                              <div className="absolute left-0 top-full mt-1.5 z-40 console-panel rounded-xl p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.9)] flex flex-col gap-1 w-36 border border-white/20">
                                {STATUSES.map((st, idx) => {
                                  const isActive = issue.status === st;

                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => handleStatusChange(issue.trackingId, st)}
                                      className={`px-2 py-1.5 rounded-lg text-left text-xs font-mono font-bold flex items-center justify-between transition-all ${
                                        isActive
                                          ? 'tactile-button-active text-cyan-300 shadow-[0_0_8px_#00d9ff]'
                                          : 'hover:bg-white/5 text-slate-300'
                                      }`}
                                    >
                                      <span>{st}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">0{idx + 1}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department Inline Dispatch */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={issue.department}
                          onChange={(e) =>
                            handleDepartmentChange(issue.trackingId, e.target.value)
                          }
                          className="text-xs bg-[#111620] text-slate-300 border border-black/80 rounded-md px-2 py-1 max-w-[180px] truncate cursor-pointer font-mono shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]"
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        {issue.assignedCrew && (
                          <div className="text-[10px] text-purple-300 font-mono truncate max-w-[180px] mt-0.5">
                            {issue.assignedCrew}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRemarkTarget(issue);
                              setRemarkText('');
                            }}
                            className="tactile-button p-2 text-slate-300 hover:text-cyan-400"
                            title="Add Official Crew Remark"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedIssue(issue)}
                            className="tactile-button p-2 text-slate-300 hover:text-white"
                            title="View Full Incident File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REMARK MODAL */}
      {remarkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="console-panel rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {remarkTarget.trackingId}
              </span>
              <h3 className="text-base font-bold text-white">Add Official Dispatch Note</h3>
              <p className="text-xs text-slate-400">
                This note will be permanently logged to the public tracking timeline.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold font-mono">AUTHOR / FIELD CREW CALL-SIGN</label>
                <input
                  type="text"
                  value={remarkActor}
                  onChange={(e) => setRemarkActor(e.target.value)}
                  className="w-full recessed-display px-3 py-2 rounded-lg font-mono text-cyan-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold font-mono">OPERATIONAL REMARK</label>
                <textarea
                  rows={3}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Crew arrived on-site. Isolated valve. Scheduled asphalt restoration..."
                  className="w-full recessed-display p-3 rounded-lg resize-none text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemarkTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRemark}
                disabled={isSubmittingRemark || !remarkText.trim()}
                className="console-button-primary px-5 py-2 text-xs font-bold text-slate-950"
              >
                {isSubmittingRemark ? 'Recording...' : 'Append to Timeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdate={(updated) => {
          setSelectedIssue(updated);
          setIssues(issues.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />
    </div>
  );
}
