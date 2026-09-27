import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/80 bg-[#0e121a] text-slate-400 text-sm mt-20 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
              <span className="font-display font-extrabold text-white text-base tracking-wider">
                CIVICPULSE // CONSOLE
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Smart-city civic reporting platform. Zero login friction, deterministic priority
              classification, instant duplicate detection, and live status transparency for every citizen.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-2">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                NO ACCOUNT REQUIRED
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-teal-300">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                RADAR GPS LOCK
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
              TERMINAL CHANNELS
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/map" className="hover:text-cyan-400 transition-colors">
                  › Interactive Live Radar
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-cyan-400 transition-colors">
                  › Track Incident by ID
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-cyan-400 transition-colors">
                  › Performance Analytics
                </Link>
              </li>
              <li>
                <Link to="/ops" className="text-amber-400 hover:text-amber-300 transition-colors">
                  › Master Ops Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
              AVIONICS ROADMAP
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-1.5 text-cyan-400">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>AI Computer Vision Triage</span>
              </li>
              <li>· Municipal Health Index</li>
              <li>· Thermal Hotspot Radar</li>
              <li>· Citizen Webhook Relays</li>
              <li>· Automated Before/After Proof</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
          <p>© 2026 CivicPulse · Tactile Smart Neighborhood Incident Console</p>
          <p className="text-cyan-400/80">
            TRANSMISSION: SEE IT. REPORT IT. RESOLVE IT.
          </p>
        </div>
      </div>
    </footer>
  );
}
