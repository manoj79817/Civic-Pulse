import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { PlusCircle, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#141822] border-b-2 border-black/90 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand Cockpit Call-sign */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Tactical Indicator light on logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#242b38] to-[#141822] border-t border-l border-white/25 border-b border-r border-black/80 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.7)] flex items-center justify-center p-0.5">
            <div className="w-4 h-4 rounded-full bg-cyan-400 border border-white/80 shadow-[0_0_10px_#00d9ff,0_0_20px_rgba(0,217,255,0.8)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                CIVIC<span className="text-cyan-400 drop-shadow-[0_0_8px_#00d9ff]">PULSE</span>
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#0b0e14] text-cyan-400 border border-cyan-500/40 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                SYS.V2
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5">
              MUNICIPAL INCIDENT CONSOLE
            </p>
          </div>
        </Link>

        {/* Tactile Nav Menu Tabs */}
        <nav className="hidden md:flex items-center gap-2 font-mono text-xs">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,217,255,0.4)]'
                  : 'tactile-button text-slate-300 hover:text-white'
              }`
            }
          >
            01 // COCKPIT
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,217,255,0.4)]'
                  : 'tactile-button text-slate-300 hover:text-white'
              }`
            }
          >
            02 // LIVE RADAR
          </NavLink>

          <NavLink
            to="/track"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,217,255,0.4)]'
                  : 'tactile-button text-slate-300 hover:text-white'
              }`
            }
          >
            03 // TRACK TICKET
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'tactile-button-active text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,217,255,0.4)]'
                  : 'tactile-button text-slate-300 hover:text-white'
              }`
            }
          >
            04 // METRICS
          </NavLink>

          <NavLink
            to="/ops"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg border-amber-500/40 text-amber-300 flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'tactile-button-active text-amber-200 font-bold shadow-[0_0_10px_rgba(255,165,2,0.4)]'
                  : 'tactile-button text-amber-400 hover:text-amber-200'
              }`
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>OPS DECK</span>
          </NavLink>
        </nav>

        {/* Right CTA Cockpit Action */}
        <div className="flex items-center gap-3">
          <a
            href="#report-widget"
            className="console-button-primary px-4 py-2 text-xs font-bold flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="tracking-wide">LOG INCIDENT</span>
          </a>
        </div>
      </div>
    </header>
  );
}
