import React from 'react';
import {
  AlertTriangle,
  Lightbulb,
  Trash2,
  Droplets,
  Waves,
  Footprints,
  TrafficCone,
  Trees,
  HelpCircle
} from 'lucide-react';
import { IssueCategory, IssuePriority, IssueStatus } from '../types/index.ts';

export interface CategoryMeta {
  id: IssueCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accentBg: string;
  shortDesc: string;
  department: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'road',
    name: 'Road & Pothole',
    icon: TrafficCone,
    color: '#00d9ff',
    accentBg: 'rgba(0, 217, 255, 0.1)',
    shortDesc: 'Pavement cracks, potholes, street surface damage',
    department: 'Department of Public Works'
  },
  {
    id: 'streetlight',
    name: 'Streetlight',
    icon: Lightbulb,
    color: '#ffd93d',
    accentBg: 'rgba(255, 217, 61, 0.1)',
    shortDesc: 'Blackout, flickering pole, damaged casing',
    department: 'City Power & Lighting Grid'
  },
  {
    id: 'waste',
    name: 'Waste & Garbage',
    icon: Trash2,
    color: '#2ed573',
    accentBg: 'rgba(46, 213, 115, 0.1)',
    shortDesc: 'Illegal dumping, overflowing dumpsters, debris',
    department: 'Waste Management & Sanitation'
  },
  {
    id: 'water',
    name: 'Water Leakage',
    icon: Droplets,
    color: '#00d9ff',
    accentBg: 'rgba(0, 217, 255, 0.1)',
    shortDesc: 'Burst pipe, water main break, low pressure',
    department: 'Municipal Water & Sewer Authority'
  },
  {
    id: 'drainage',
    name: 'Drainage & Clog',
    icon: Waves,
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.1)',
    shortDesc: 'Flooded street drain, backed up storm runoff',
    department: 'Municipal Water & Sewer Authority'
  },
  {
    id: 'footpath',
    name: 'Damaged Sidewalk',
    icon: Footprints,
    color: '#ffa502',
    accentBg: 'rgba(255, 165, 2, 0.1)',
    shortDesc: 'Broken concrete, uneven sidewalk, tripping hazard',
    department: 'Department of Public Works'
  },
  {
    id: 'parks',
    name: 'Parks & Greenery',
    icon: Trees,
    color: '#2ed573',
    accentBg: 'rgba(46, 213, 115, 0.1)',
    shortDesc: 'Fallen tree limbs, damaged playground, park safety',
    department: 'Parks & Urban Forestry Division'
  },
  {
    id: 'other',
    name: 'Other Civic Issue',
    icon: HelpCircle,
    color: '#94a3b8',
    accentBg: 'rgba(148, 163, 184, 0.1)',
    shortDesc: 'General public safety or municipal infrastructure',
    department: 'Bureau of Traffic Management'
  }
];

export function getCategoryMeta(id: IssueCategory): CategoryMeta {
  const found = CATEGORIES.find((c) => c.id === id);
  if (found) return found;
  return CATEGORIES[CATEGORIES.length - 1];
}

export function getPriorityStyles(priority: IssuePriority) {
  switch (priority) {
    case 'Critical':
      return {
        badge: 'bg-[#200e14] text-[#ff4757] border border-rose-500/40 shadow-[0_0_10px_rgba(255,71,87,0.3)]',
        dot: 'led-red led-red-pulse',
        markerBg: '#ff4757',
        border: 'border-rose-500/60'
      };
    case 'High':
      return {
        badge: 'bg-[#20150b] text-[#ffa502] border border-amber-500/40 shadow-[0_0_8px_rgba(255,165,2,0.3)]',
        dot: 'led-amber',
        markerBg: '#ffa502',
        border: 'border-amber-500/50'
      };
    case 'Medium':
      return {
        badge: 'bg-[#201c0b] text-[#ffd93d] border border-yellow-500/40 shadow-[0_0_8px_rgba(255,217,61,0.3)]',
        dot: 'led-yellow',
        markerBg: '#ffd93d',
        border: 'border-yellow-500/40'
      };
    case 'Low':
    default:
      return {
        badge: 'bg-[#0b1f14] text-[#2ed573] border border-emerald-500/40 shadow-[0_0_8px_rgba(46,213,115,0.3)]',
        dot: 'led-green',
        markerBg: '#2ed573',
        border: 'border-emerald-500/40'
      };
  }
}

export function getStatusStyles(status: IssueStatus) {
  switch (status) {
    case 'Reported':
      return {
        badge: 'bg-[#181d26] text-slate-300 border border-slate-700/60 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05)]',
        color: '#94a3b8',
        stepIndex: 0
      };
    case 'Verified':
      return {
        badge: 'bg-[#181a2e] text-[#a855f7] border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
        color: '#a855f7',
        stepIndex: 1
      };
    case 'Assigned':
      return {
        badge: 'bg-[#0f212a] text-[#00d9ff] border border-cyan-500/40 shadow-[0_0_8px_rgba(0,217,255,0.25)]',
        color: '#00d9ff',
        stepIndex: 2
      };
    case 'In Progress':
      return {
        badge: 'bg-[#221c0e] text-[#ffa502] border border-amber-500/40 shadow-[0_0_8px_rgba(255,165,2,0.3)]',
        color: '#ffa502',
        stepIndex: 3
      };
    case 'Resolved':
      return {
        badge: 'bg-[#0e2217] text-[#2ed573] border border-emerald-500/40 shadow-[0_0_8px_rgba(46,213,115,0.3)]',
        color: '#2ed573',
        stepIndex: 4
      };
  }
}
