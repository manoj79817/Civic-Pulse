import React, { useEffect, useRef, useState } from 'react';
import {
  Filter,
  Search,
  MapPin,
  Layers,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CivicIssue, IssueCategory, IssuePriority, IssueStatus } from '../types/index.ts';
import { fetchIssues } from '../services/api.ts';
import { CATEGORIES, getCategoryMeta, getPriorityStyles, getStatusStyles } from '../utils/categories.ts';
import { getMyReportIds } from '../utils/device.ts';
import IssueDetailModal from '../components/IssueDetailModal.tsx';

export default function LiveMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);

  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [onlyMyReports, setOnlyMyReports] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Load issues
  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await fetchIssues();
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues for map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Filter calculation
  const myIds = getMyReportIds();
  const filteredIssues = issues.filter((issue) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        issue.trackingId.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.location.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && issue.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && issue.priority !== selectedPriority) return false;
    if (onlyMyReports && !myIds.includes(issue.trackingId.toUpperCase())) return false;
    return true;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined') return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [30.2672, -97.7431],
          zoom: 14,
          zoomControl: false
        });

        // Add Dark Matter Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; CARTO',
          maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const markerGroup = L.layerGroup().addTo(map);
        leafletMapRef.current = map;
        markerGroupRef.current = markerGroup;
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Markers with Filtered Issues
  useEffect(() => {
    if (!leafletMapRef.current || !markerGroupRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const markerGroup = markerGroupRef.current;
      markerGroup.clearLayers();

      filteredIssues.forEach((issue) => {
        const prioStyle = getPriorityStyles(issue.priority);
        const isCritical = issue.priority === 'Critical';

        const pinHtml = `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isCritical
                ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(255, 71, 87, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: ${prioStyle.markerBg};
              border: 2.5px solid #ffffff;
              box-shadow: 0 0 14px ${prioStyle.markerBg};
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'civic-marker-pin',
          html: pinHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14]
        });

        const marker = L.marker([issue.location.lat, issue.location.lng], { icon });

        // Popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'civic-popup-body space-y-2 text-xs';
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-family: monospace; font-weight: bold; color: #00d9ff; font-size: 11px;">${issue.trackingId}</span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; font-weight: 600; background: ${prioStyle.markerBg}25; color: ${prioStyle.markerBg}; border: 1px solid ${prioStyle.markerBg}50;">
              ${issue.priority}
            </span>
          </div>
          ${
            issue.photoUrl
              ? `<div style="height: 80px; border-radius: 6px; overflow: hidden; margin-top: 4px; background: #000;">
                  <img src="${issue.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>`
              : ''
          }
          <div style="font-weight: 600; color: #ffffff; font-size: 12px; margin-top: 4px; line-height: 1.3;">
            ${issue.title}
          </div>
          <div style="color: #94a3b8; font-size: 11px;">
            ${issue.location.address}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
            <span style="color: #cbd5e1; font-weight: 500;">Status: <b style="color: #00d9ff;">${issue.status}</b></span>
            <button id="view-details-${issue.id}" style="
              background: #00d9ff;
              color: #020617;
              border: none;
              padding: 4px 10px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 11px;
              cursor: pointer;
            ">
              View Details
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260 });
        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-details-${issue.id}`);
          if (btn) {
            btn.onclick = () => {
              setSelectedIssue(issue);
            };
          }
        });

        markerGroup.addLayer(marker);
      });
    });
  }, [filteredIssues]);

  const handleFocusIssue = (issue: CivicIssue) => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([issue.location.lat, issue.location.lng], 16, {
        duration: 1.2
      });
    }
    setSelectedIssue(issue);
  };

  const handleResetCenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([30.2672, -97.7431], 14, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-[#0b0e14] p-2 sm:p-3 gap-2 sm:gap-3">
      {/* SIDEBAR TACTILE INSTRUMENT CONSOLE */}
      <div
        className={`${
          sidebarOpen ? 'w-full md:w-96' : 'w-0 hidden md:flex md:w-0'
        } transition-all duration-300 h-full flex flex-col console-panel rounded-2xl z-30 overflow-hidden shrink-0`}
      >
        {/* Console Header */}
        <div className="p-4 border-b border-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] animate-pulse" />
            <div>
              <h2 className="text-sm font-mono font-bold text-white tracking-wide uppercase">RADAR CONSOLE // GEOMAP</h2>
              <p className="text-[11px] font-mono text-cyan-400/80">
                ACTIVE SENSORS: {filteredIssues.length} / {issues.length}
              </p>
            </div>
          </div>
          <button
            onClick={loadIssues}
            className="tactile-button p-2 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Refresh map telemetry"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tactical Filter Controls */}
        <div className="p-4 space-y-4 border-b border-black/40 overflow-y-auto max-h-80">
          {/* Recessed Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking ID, street, keyword..."
              className="w-full recessed-display pl-9 pr-3 py-2 rounded-lg text-xs font-mono text-cyan-300 placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Priority Tactical Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300">
              <span className="uppercase tracking-wider">SEVERITY PRIORITY</span>
              <span className="text-cyan-400 text-[10px]">{selectedPriority.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              {['all', 'Critical', 'High', 'Medium'].map((prio) => {
                const isActive = selectedPriority === prio;
                return (
                  <button
                    key={prio}
                    onClick={() => setSelectedPriority(prio)}
                    className={`py-1.5 px-1.5 rounded-lg text-center font-mono text-xs transition-all truncate ${
                      isActive
                        ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_#00d9ff]'
                        : 'tactile-button text-slate-400 hover:text-white'
                    }`}
                  >
                    {prio}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Tactical Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300">
              <span className="uppercase tracking-wider">TELEMETRY STATUS</span>
              <span className="text-cyan-400 text-[10px]">{selectedStatus.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              {['all', 'Reported', 'In Progress', 'Resolved'].map((st) => {
                const isActive = selectedStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`py-1.5 px-1.5 rounded-lg text-center font-mono text-xs transition-all truncate ${
                      isActive
                        ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_#00d9ff]'
                        : 'tactile-button text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              CIVIC JURISDICTION / CHANNEL
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full recessed-display px-3 py-2 rounded-lg text-xs font-mono text-slate-200 bg-[#0d1017] focus:outline-none"
            >
              <option value="all">ALL CIVIC SECTORS</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Realistic 3D Toggle Switch for Only My Reports */}
          {myIds.length > 0 && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                DEVICE ISOLATION ({myIds.length})
              </span>
              <button
                type="button"
                onClick={() => setOnlyMyReports(!onlyMyReports)}
                className="toggle-switch-track cursor-pointer relative"
              >
                <div
                  className={`toggle-switch-knob ${
                    onlyMyReports ? 'toggle-switch-knob-active' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Tactical Incident Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2 font-mono">
              <AlertCircle className="w-6 h-6 mx-auto text-slate-600" />
              <p>NO INCIDENTS DETECTED IN ACTIVE RADAR FILTER</p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const prio = getPriorityStyles(issue.priority);
              const status = getStatusStyles(issue.status);

              return (
                <div
                  key={issue.id}
                  onClick={() => handleFocusIssue(issue)}
                  className="tactile-card p-3 rounded-xl cursor-pointer space-y-1.5 text-left group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={prio.dot} />
                      <span className="font-mono text-cyan-400 font-bold tracking-wider">{issue.trackingId}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${prio.badge}`}>
                      {issue.priority}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {issue.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="truncate max-w-[150px]">{issue.location.address}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.badge}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RECESSED RADAR MAP SCREEN DISPLAY WITH BEZEL */}
      <div className="flex-1 relative h-full rounded-2xl overflow-hidden recessed-display border-2 border-[#262c38] shadow-[inset_3px_3px_8px_rgba(0,0,0,0.95),0_0_20px_rgba(0,217,255,0.08)]">
        {/* Leaflet Mount Element */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Console Overlay Controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="console-button-secondary px-3.5 py-2 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>{sidebarOpen ? 'Hide Console Panel' : 'Open Console Panel'}</span>
          </button>

          <button
            onClick={handleResetCenter}
            className="console-button-secondary px-3.5 py-2 text-xs font-bold text-slate-200 flex items-center gap-2"
            title="Recenter Radar"
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Downtown Radar Lock</span>
          </button>
        </div>

        {/* Tactile Legend Overlay in Screen Corner */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-[#0f131c]/95 border-t border-l border-white/10 border-b border-r border-black/80 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.6)] text-xs text-slate-300 font-mono">
          <span className="font-bold text-cyan-400 text-[11px]">RADAR STATUS:</span>
          <span className="flex items-center gap-2">
            <span className="led-red led-red-pulse" /> Critical
          </span>
          <span className="flex items-center gap-2">
            <span className="led-amber" /> High
          </span>
          <span className="flex items-center gap-2">
            <span className="led-yellow" /> Medium
          </span>
          <span className="flex items-center gap-2">
            <span className="led-green" /> Low / Resolved
          </span>
        </div>
      </div>

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
