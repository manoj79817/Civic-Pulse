import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Loader2,
  Compass,
  Layers,
  ShieldCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { IssueCategory, IssuePriority, CivicIssue, DuplicateCheckResult, PriorityEvaluation } from '../types/index.ts';
import { CATEGORIES, getCategoryMeta, getPriorityStyles } from '../utils/categories.ts';
import { submitIssueReport, checkDuplicateIssue, evaluatePriorityPreview } from '../services/api.ts';
import { saveMyReport, getDeviceId } from '../utils/device.ts';

interface Props {
  onIssueCreated?: (newIssue: CivicIssue) => void;
  defaultCategory?: IssueCategory;
}

const SAMPLE_PHOTOS = [
  { label: 'Pothole on Asphalt', url: '/src/assets/images/civic_pothole_street_1790358903775.jpg', category: 'road' as IssueCategory },
  { label: 'Dark Streetlight', url: '/src/assets/images/civic_broken_streetlight_1790358917214.jpg', category: 'streetlight' as IssueCategory },
  { label: 'Water Leak Curb', url: '/src/assets/images/civic_water_leak_street_1790358929673.jpg', category: 'water' as IssueCategory }
];

export default function QuickReportWidget({ onIssueCreated, defaultCategory }: Props) {
  const navigate = useNavigate();

  // Step state: 1 = Category, 2 = Photo, 3 = Location, 4 = Description, 5 = Analyzing, 6 = Success
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<IssueCategory>(defaultCategory || 'road');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Location state
  const [lat, setLat] = useState<number>(30.2672);
  const [lng, setLng] = useState<number>(-97.7431);
  const [address, setAddress] = useState<string>('600 Congress Ave, Austin, TX 78701');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Description & Title
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Innovation Features: Duplicate & Priority Engine
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);
  const [dismissDuplicate, setDismissDuplicate] = useState<boolean>(false);
  const [priorityPreview, setPriorityPreview] = useState<PriorityEvaluation | null>(null);

  // Analysis & Submission
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdIssue, setCreatedIssue] = useState<CivicIssue | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const miniMapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Run duplicate check & priority preview whenever category or location or description changes
  useEffect(() => {
    let active = true;

    async function evaluate() {
      try {
        const dup = await checkDuplicateIssue(category, lat, lng);
        if (active && dup.isDuplicate) {
          setDuplicateWarning(dup);
        } else if (active) {
          setDuplicateWarning(null);
        }

        const prio = await evaluatePriorityPreview(category, description, title, lat, lng);
        if (active) {
          setPriorityPreview(prio);
        }
      } catch (err) {
        // silent fail
      }
    }

    if (step >= 3) {
      evaluate();
    }

    return () => {
      active = false;
    };
  }, [category, lat, lng, description, title, step]);

  // Mini Map setup for Step 3
  useEffect(() => {
    if (step === 3 && miniMapRef.current && typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        if (!miniMapRef.current) return;

        if (!leafletMapInstance.current) {
          const map = L.map(miniMapRef.current, {
            center: [lat, lng],
            zoom: 15,
            zoomControl: false
          });

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 19
          }).addTo(map);

          const customIcon = L.divIcon({
            className: 'custom-pin-marker',
            html: `
              <div style="
                background: #00d9ff;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid #ffffff;
                box-shadow: 0 0 16px #00d9ff, inset 0 0 4px rgba(0,0,0,0.8);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);

          marker.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            setLat(pos.lat);
            setLng(pos.lng);
            setAddress(`Custom Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
          });

          map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            setLat(e.latlng.lat);
            setLng(e.latlng.lng);
            setAddress(`Custom Pin (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`);
          });

          leafletMapInstance.current = map;
          markerInstance.current = marker;
        } else {
          leafletMapInstance.current.invalidateSize();
          leafletMapInstance.current.setView([lat, lng], 15);
          if (markerInstance.current) {
            markerInstance.current.setLatLng([lat, lng]);
          }
        }
      });
    }
  }, [step]);

  // Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser. You can pin the map manually.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring precise satellite GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setAddress(`Locked GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocationStatus('Location locked successfully.');
        setIsLocating(false);

        if (leafletMapInstance.current && markerInstance.current) {
          leafletMapInstance.current.setView([latitude, longitude], 16);
          markerInstance.current.setLatLng([latitude, longitude]);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('Could not access current GPS. Using default metro coordinates.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Image upload handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submission Flow with Cockpit Pipeline Animation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !description.trim()) {
      setErrorMsg('Please enter a brief description of the issue.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setStep(5); // Transition to analysis stage
    setAnalysisStep(1); // Photo verification check

    await new Promise((r) => setTimeout(r, 650));
    setAnalysisStep(2); // GPS lock check
    await new Promise((r) => setTimeout(r, 650));

    setAnalysisStep(3); // Category & keyword check
    await new Promise((r) => setTimeout(r, 600));

    setAnalysisStep(4); // Priority Engine computed
    await new Promise((r) => setTimeout(r, 500));

    try {
      const deviceId = getDeviceId();
      const issue = await submitIssueReport({
        title,
        description,
        category,
        location: {
          lat,
          lng,
          address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          neighborhood: 'Central District'
        },
        photoUrl: photoUrl || undefined,
        deviceId
      });

      saveMyReport(issue.trackingId);
      setCreatedIssue(issue);
      setIsSubmitting(false);
      setStep(6); // Success screen

      try {
        confetti({
          particleCount: 85,
          spread: 85,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      if (onIssueCreated) {
        onIssueCreated(issue);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
      setStep(4);
    }
  };

  const handleCopyId = () => {
    if (!createdIssue) return;
    navigator.clipboard.writeText(createdIssue.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setStep(1);
    setCategory('road');
    setPhotoUrl('');
    setTitle('');
    setDescription('');
    setCreatedIssue(null);
    setDuplicateWarning(null);
    setDismissDuplicate(false);
    setErrorMsg('');
  };

  return (
    <div id="report-widget" className="relative w-full max-w-3xl mx-auto">
      {/* Tactile Console Chassis */}
      <div className="console-panel rounded-2xl p-6 sm:p-8 relative">
        {/* Console Chassis Screws */}
        <div className="absolute top-3.5 left-3.5 hex-screw" />
        <div className="absolute top-3.5 right-3.5 hex-screw" />
        <div className="absolute bottom-3.5 left-3.5 hex-screw" />
        <div className="absolute bottom-3.5 right-3.5 hex-screw" />

        {/* Step Indicator (Steps 1-4) with Tactile Track */}
        {step <= 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span className="text-cyan-400 font-bold tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff] animate-pulse" />
                COMMAND BUS // STAGE 0{step} OF 04
              </span>
              <span className="text-slate-400 uppercase tracking-wide">
                {step === 1 && 'DOMAIN ACTUATOR MATRIX'}
                {step === 2 && 'OPTICAL SENSOR FEED'}
                {step === 3 && 'GEOSPATIAL COORDINATES'}
                {step === 4 && 'TELEMETRY DISPATCH LOG'}
              </span>
            </div>
            {/* Recessed physical track groove with calibration markers */}
            <div className="relative h-3 w-full bg-[#080b10] rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.98),0_1px_1px_rgba(255,255,255,0.08)] p-0.5 border border-black/80">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full shadow-[0_0_12px_#00d9ff] transition-all duration-300 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: CATEGORY SELECTION WITH EMBOSSED HEX BUTTONS */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                  PHYSICAL SECTOR BANK
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Select Incident Domain
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Press the embossed sector switch corresponding to the municipal infrastructure defect.
              </p>
            </div>

            {/* Embossed Hex/Circular Tactile Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`tactile-hex-button p-4 rounded-xl text-left relative flex flex-col justify-between min-h-[120px] ${
                      isSelected ? 'tactile-hex-button-active' : ''
                    }`}
                  >
                    {/* Top Row: Icon and Backlit LED Indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#0a121a] text-cyan-300 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.9),0_0_10px_#00d9ff]'
                            : 'bg-[#10141c] text-slate-400 border border-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      
                      {/* Backlit LED Bulb */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isSelected
                            ? 'bg-cyan-400 shadow-[0_0_10px_#00d9ff,0_0_20px_rgba(0,217,255,0.9)] border border-white/80'
                            : 'bg-[#080b10] border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)]'
                        }`}
                      />
                    </div>

                    {/* Bottom: Text and Status */}
                    <div>
                      <p
                        className={`text-xs font-bold tracking-tight font-mono uppercase ${
                          isSelected ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(0,217,255,0.5)]' : 'text-slate-200'
                        }`}
                      >
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight font-sans">
                        {cat.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-black/40">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="console-button-primary px-7 py-3 text-xs font-bold text-slate-950 flex items-center gap-2"
              >
                <span>PROCEED TO OPTICAL FEED</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PHOTO UPLOAD */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                  OPTICAL RECONNAISSANCE CHASSIS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Optical Evidence Capture
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Upload on-site camera imagery to feed municipal AI classification and dispatch triage.
              </p>
            </div>

            {/* Recessed Instrument Display Frame */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(true);
              }}
              onDragLeave={() => setIsDraggingPhoto(false)}
              onDrop={handleDrop}
              className={`recessed-display p-6 sm:p-8 rounded-xl text-center border-2 border-dashed transition-all relative ${
                isDraggingPhoto ? 'border-cyan-400 bg-[#0d1624]' : 'border-slate-700/60 hover:border-slate-500'
              }`}
            >
              {photoUrl ? (
                <div className="relative inline-block max-w-full">
                  <img
                    src={photoUrl}
                    alt="Uploaded evidence"
                    className="max-h-64 rounded-lg object-contain mx-auto border border-cyan-400/40 shadow-[0_0_16px_rgba(0,217,255,0.2)]"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-white/20"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-mono text-cyan-300 mt-2">
                    OPTICAL BUFFER ATTACHED // READY FOR RECOGNITION
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#141a26] border border-cyan-400/30 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_0_12px_rgba(0,217,255,0.2)] mx-auto flex items-center justify-center text-cyan-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <label className="cursor-pointer font-mono text-sm font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
                      <span>ENGAGE CAMERA SENSOR / BROWSE FILE</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      Or drag and drop camera frame directly into display chassis
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Sample Photos */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                OR MOUNT RECONNAISSANCE PRESET SAMPLES:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_PHOTOS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setPhotoUrl(sample.url);
                      setCategory(sample.category);
                    }}
                    className="tactile-button p-2.5 rounded-lg text-left flex items-center gap-2.5 text-xs text-slate-300 hover:text-white"
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-10 h-10 rounded object-cover border border-white/10 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold truncate">{sample.label}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">1-CLICK MOUNT</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-black/40">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="tactile-button px-4 py-2 text-xs font-bold text-slate-300 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="console-button-primary px-7 py-3 text-xs font-bold text-slate-950 flex items-center gap-2"
              >
                <span>LOCK GEOLOCATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION PINNING */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                  SATELLITE POSITIONING LOCK
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Geospatial Coordinate Lock
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Acquire satellite fix or manually drag pin to the exact municipal location.
              </p>
            </div>

            {/* Quick GPS Geolocation Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="tactile-button w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
                <span>{isLocating ? 'ACQUIRING GPS LOCK...' : 'AUTO-ACQUIRE CURRENT GPS'}</span>
              </button>

              <div className="w-full relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address or landmark description..."
                  className="w-full recessed-display px-3 py-2.5 rounded-lg text-xs font-mono text-cyan-300 placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {locationStatus && (
              <p className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {locationStatus}
              </p>
            )}

            {/* Recessed Mini Map Display with Metal Bezel */}
            <div className="recessed-display p-1 rounded-xl relative overflow-hidden border border-[#262c38]">
              <div ref={miniMapRef} className="h-60 w-full rounded-lg z-10" />
              <div className="absolute bottom-2 left-2 z-20 px-2.5 py-1 rounded bg-[#0b0e14]/90 border border-white/10 text-[10px] font-mono text-cyan-300 shadow">
                LAT: {lat.toFixed(5)} | LNG: {lng.toFixed(5)}
              </div>
            </div>

            {/* Duplicate Incident Radar Warning Callout */}
            {duplicateWarning && duplicateWarning.isDuplicate && !dismissDuplicate && (
              <div className="p-4 rounded-xl bg-[#20150b] border-t border-l border-amber-400/40 border-b border-r border-black/80 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_0_12px_rgba(255,165,2,0.25)] space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="led-amber" />
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                      POSSIBLE DUPLICATE DETECTED ({duplicateWarning.distanceMeters}m AWAY)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissDuplicate(true)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                  A similar report exists nearby: <b className="font-mono text-white">"{duplicateWarning.existingIssue?.title}"</b> (Ticket #{duplicateWarning.existingIssue?.trackingId}).
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/track/${duplicateWarning.existingIssue?.trackingId}`)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                  >
                    <span>Inspect Existing Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => setDismissDuplicate(true)}
                    className="text-xs text-slate-300 hover:text-white font-mono"
                  >
                    File Anyway As Separate Issue
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-black/40">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="tactile-button px-4 py-2 text-xs font-bold text-slate-300 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="console-button-primary px-7 py-3 text-xs font-bold text-slate-950 flex items-center gap-2"
              >
                <span>PROCEED TO TELEMETRY DETAILS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DESCRIPTION & ENGINE PREVIEW WITH ANALOG NEEDLE GAUGE */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                  TELEMETRY LOGGING DISPATCH
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Incident Description & Triage
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter details. Our deterministic rule engine calculates urgency level automatically.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            {/* Inputs in Recessed Chassis */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>INCIDENT SUMMARY / TITLE</span>
                  <span className="text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep pothole causing tire damage near crosswalk"
                  className="w-full recessed-display px-3.5 py-2.5 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>DETAILED FIELD DESCRIPTION</span>
                  <span className="text-slate-500 font-normal">{description.length}/500</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location details, severity, traffic impact, or immediate risks..."
                  className="w-full recessed-display p-3 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans resize-none"
                />
              </div>
            </div>

            {/* Live Deterministic Priority Preview Cockpit Gauge with Analog Needle & Ticks */}
            {priorityPreview && (
              <div className="tactile-card p-4 rounded-xl space-y-3 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d9ff]" />
                    ANALOG URGENCY GAUGE // RULE ENGINE PREVIEW
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${getPriorityStyles(priorityPreview.priority).badge}`}>
                    {priorityPreview.priority} (Hazard: {priorityPreview.score}/100)
                  </span>
                </div>

                {/* Analog Gauge with Physical Needle and Tick Marks */}
                <div className="space-y-1">
                  <div className="analog-gauge-track relative">
                    {/* Background gradient zones: Low (green) -> Medium (yellow) -> High (amber) -> Critical (red) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 opacity-60" />
                    {/* Needle Indicator */}
                    <div
                      className="analog-gauge-needle"
                      style={{
                        left: `${Math.min(99, Math.max(1, priorityPreview.score))}%`
                      }}
                    />
                  </div>
                  {/* Calibrated Ticks */}
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                    <span>| 0 LOW</span>
                    <span>| 35 MED</span>
                    <span>| 65 HIGH</span>
                    <span>| 100 CRIT</span>
                  </div>
                </div>

                <ul className="text-[11px] font-mono text-slate-400 space-y-1 pt-1 border-t border-black/40">
                  {priorityPreview.reasons.map((r, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-cyan-400">›</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* LARGE PRESSABLE CONSOLE ACTUATOR SUBMIT BUTTON */}
            <div className="flex items-center justify-between pt-4 border-t border-black/40">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="tactile-button px-4 py-2.5 text-xs font-bold text-slate-300 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="console-button-primary px-8 py-3.5 text-sm font-black tracking-wider uppercase flex items-center gap-2.5 shadow-[0_6px_20px_rgba(0,217,255,0.5)] active:translate-y-1"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>DISPATCH TO MUNICIPALITY</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: ANALYSIS & TRIAGE ANIMATION */}
        {step === 5 && (
          <div className="py-12 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin shadow-[0_0_20px_rgba(0,217,255,0.4)]" />
              <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-display font-extrabold text-white">
                Transmitting Municipal Work Order...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Running automated pipeline verification, duplicate radar scan, and department queue assignment.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2 text-left font-mono text-xs">
              <div className={`flex items-center gap-2.5 ${analysisStep >= 1 ? 'text-cyan-300' : 'text-slate-600'}`}>
                {analysisStep >= 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Image payload verified</span>
              </div>
              <div className={`flex items-center gap-2.5 ${analysisStep >= 2 ? 'text-cyan-300' : 'text-slate-600'}`}>
                {analysisStep >= 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Geospatial lock confirmed</span>
              </div>
              <div className={`flex items-center gap-2.5 ${analysisStep >= 3 ? 'text-cyan-300' : 'text-slate-600'}`}>
                {analysisStep >= 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Duplicate radius checked (0 detected)</span>
              </div>
              <div className={`flex items-center gap-2.5 ${analysisStep >= 4 ? 'text-cyan-300' : 'text-slate-600'}`}>
                {analysisStep >= 4 ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Priority classification sealed</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SUCCESS & TRACKING RECEIPT */}
        {step === 6 && createdIssue && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#12221b] border-2 border-emerald-500/60 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8),0_0_24px_rgba(46,213,115,0.4)] mx-auto flex items-center justify-center text-[#2ed573]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                CIVIC INCIDENT RECORDED SUCCESSFULLY
              </span>
              <h2 className="text-2xl font-display font-extrabold text-white">
                Work Order Created
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No account or login required. Retain your public tracking reference to inspect live field updates.
              </p>
            </div>

            {/* Recessed Tracking Receipt Card */}
            <div className="recessed-display p-6 rounded-2xl max-w-md mx-auto space-y-4 text-left border border-[#2a3240]">
              <div className="flex items-center justify-between border-b border-black/60 pb-3">
                <span className="text-xs font-mono text-slate-400 uppercase">PUBLIC TRACKING ID</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#141d18] text-[#2ed573] border border-emerald-500/30">
                  {createdIssue.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-3xl font-extrabold text-cyan-400 tracking-wider drop-shadow-[0_0_8px_rgba(0,217,255,0.4)]">
                  {createdIssue.trackingId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="tactile-button px-3 py-1.5 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2ed573]" />
                      <span className="text-[#2ed573]">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs font-mono space-y-1.5 text-slate-400 border-t border-black/60 pt-3">
                <div className="flex justify-between">
                  <span>DISPATCHED JURISDICTION:</span>
                  <span className="text-slate-200 font-semibold">{createdIssue.department}</span>
                </div>
                <div className="flex justify-between">
                  <span>SEVERITY CLASSIFICATION:</span>
                  <span className="text-amber-400 font-bold">{createdIssue.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span>ESTIMATED TURNAROUND:</span>
                  <span className="text-cyan-300">24 – 48 Hours</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/track/${createdIssue.trackingId}`)}
                className="console-button-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-950 flex items-center justify-center gap-2"
              >
                <span>OPEN TRACKING COCKPIT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="tactile-button w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-300"
              >
                LOG ANOTHER INCIDENT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
