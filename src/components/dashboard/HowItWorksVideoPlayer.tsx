import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  UserCheck, 
  Check, 
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StageInfo {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  points: string[];
}

const STAGES: StageInfo[] = [
  {
    id: 1,
    title: 'Arriving at the Verification Office',
    subtitle: 'Applicant visits the verification counter',
    description: 'The applicant arrives at the identity verification office and approaches the desk where the authorized officer is ready to assist with document verification.',
    points: [
      'Applicant walks up to the verification service counter',
      'Officer welcomes the applicant and prepares the system',
      'Secure workstation is active and ready for intake'
    ]
  },
  {
    id: 2,
    title: 'Presenting the ID Document',
    subtitle: 'Consulting the officer and handing over credentials',
    description: 'The applicant sits across from the officer and hands over their identity document (such as a Passport, Aadhaar, Driving Licence, or Voter ID) for review.',
    points: [
      'Applicant hands the physical ID to the officer',
      'Officer inspects the document for basic physical condition',
      'Document is placed onto the optical scanner'
    ]
  },
  {
    id: 3,
    title: 'Scanning ID & Quick Photo Check',
    subtitle: 'Optical scan and live face matching',
    description: 'The officer places the document on the scanner to read the text and security lines. A small desk camera captures a quick photo of the applicant to confirm face match.',
    points: [
      'Scanner automatically reads text and security codes',
      'Desk camera takes a live photo of the applicant',
      'System matches the live face with the document photo'
    ]
  },
  {
    id: 4,
    title: 'Officer Reviews Results on Screen',
    subtitle: 'Checking the system scores and records',
    description: 'The officer looks at the computer screen showing the verification scores. With genuine documents, the system shows low risk, high confidence, and green checks.',
    points: [
      'Screen displays clear scores: Low Risk and High Confidence',
      'Confirms document, photo, and records match',
      'System recommends approval to the officer'
    ]
  },
  {
    id: 5,
    title: 'Approved & Document Returned',
    subtitle: 'Final approval stamp and confirmed verification',
    description: 'The officer clicks approve, enters a brief confirmation note, and hands the document back to the applicant with an official verified digital receipt.',
    points: [
      'Officer approves the verification on screen',
      'Document is handed back to the applicant',
      'Record is permanently locked and secured'
    ]
  }
];

export const HowItWorksVideoPlayer: React.FC = () => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const currentStage = STAGES[currentStageIdx];
  const STAGE_DURATION_MS = 6000;
  const TICK_MS = 50;

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStageIdx((s) => (s + 1) % STAGES.length);
          return 0;
        }
        return prev + (TICK_MS / STAGE_DURATION_MS) * 100;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isPlaying, currentStageIdx]);

  const handleSelectStage = (idx: number) => {
    setCurrentStageIdx(idx);
    setProgress(0);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    setCurrentStageIdx((prev) => (prev > 0 ? prev - 1 : STAGES.length - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentStageIdx((prev) => (prev + 1) % STAGES.length);
    setProgress(0);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
            In-Person Verification Process
          </h2>
          <span className="text-slate-600 text-xs hidden sm:inline">&bull;</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            How an Applicant Verifies Documents with an Officer
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Step {currentStageIdx + 1} of {STAGES.length}
        </span>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Side: Plain Description (6 Cols) */}
        <div className="lg:col-span-6 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between bg-slate-950/40">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                {currentStage.subtitle}
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                {currentStage.id}. {currentStage.title}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {currentStage.description}
            </p>

            <div className="space-y-1.5 pt-1">
              {currentStage.points.map((pt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-sans text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls & Steps */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            {/* Step Selector Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STAGES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStage(idx)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    idx === currentStageIdx 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Step {s.id}
                </button>
              ))}
            </div>

            {/* Play/Pause & Step Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => { setCurrentStageIdx(0); setProgress(0); }}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                  title="Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs font-mono text-slate-500">
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Animated Office Consultation Scene (6 Cols) */}
        <div className="lg:col-span-6 p-6 flex flex-col justify-between bg-slate-950/80 relative overflow-hidden">
          <div className="py-4 flex items-center justify-center min-h-[260px]">
            {/* Scene 1: Applicant Walking into Office & Approaching Desk */}
            {currentStage.id === 1 && (
              <div className="w-full max-w-[280px] h-[200px] rounded-xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between font-sans">
                {/* Office Sign */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">Verification Desk 01</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Open</span>
                </div>

                {/* Animated Office Scene: Applicant walking to desk */}
                <div className="relative flex-1 flex items-center justify-between px-2">
                  {/* Walking Applicant Figure */}
                  <div 
                    className="flex flex-col items-center transition-all duration-300"
                    style={{ transform: `translateX(${Math.min(60, (progress * 0.7))}px)` }}
                  >
                    {/* Head */}
                    <div className="w-6 h-6 rounded-full bg-cyan-400/90 shadow-md"></div>
                    {/* Body */}
                    <div className="w-8 h-10 rounded-t-lg bg-cyan-600 mt-0.5 flex items-center justify-center text-[8px] text-white font-bold">
                      ID
                    </div>
                    {/* Legs */}
                    <div className="flex gap-1 mt-0.5">
                      <div className="w-1.5 h-5 bg-slate-400 rounded-b"></div>
                      <div className="w-1.5 h-5 bg-slate-500 rounded-b"></div>
                    </div>
                    <span className="text-[9px] text-slate-300 font-mono mt-1">Applicant</span>
                  </div>

                  {/* Office Desk & Officer */}
                  <div className="flex flex-col items-center">
                    {/* Officer Head */}
                    <div className="w-6 h-6 rounded-full bg-emerald-400/90 shadow-md"></div>
                    {/* Officer Body */}
                    <div className="w-8 h-8 rounded-t-lg bg-emerald-700 mt-0.5"></div>
                    {/* Service Desk */}
                    <div className="w-20 h-7 bg-slate-800 border border-slate-700 rounded-t-md flex items-center justify-center text-[8px] font-mono text-slate-300 shadow-lg">
                      [ Counter ]
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono mt-1">Officer</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Applicant arriving at the counter...
                </div>
              </div>
            )}

            {/* Scene 2: Applicant Consulting Officer & Handing Over Document */}
            {currentStage.id === 2 && (
              <div className="w-full max-w-[280px] h-[200px] rounded-xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">Document Handover</span>
                  <span className="text-[10px] text-cyan-300 font-mono">Consulting</span>
                </div>

                {/* Desk with Applicant & Officer Sitting Across */}
                <div className="relative flex-1 flex items-center justify-between px-3">
                  {/* Applicant Sitting */}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-cyan-400 shadow"></div>
                    <div className="w-8 h-9 rounded-t bg-cyan-600 mt-0.5"></div>
                    <span className="text-[9px] text-slate-400 font-mono mt-1">Applicant</span>
                  </div>

                  {/* ID Document Passing Across Desk */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-12 h-8 rounded bg-slate-800 border-2 border-cyan-400 p-1 flex items-center justify-between shadow-lg transition-all duration-300"
                      style={{ transform: `translateX(${((progress % 100) > 50 ? 10 : -10)}px)` }}
                    >
                      <div className="w-3 h-4 bg-cyan-500/40 rounded-xs"></div>
                      <div className="space-y-0.5 flex-1 ml-1">
                        <div className="h-0.5 bg-slate-300 w-full"></div>
                        <div className="h-0.5 bg-slate-400 w-2/3"></div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-cyan-300 mt-1.5 flex items-center gap-1">
                      <span>Presenting ID</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* Officer Sitting */}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 shadow"></div>
                    <div className="w-8 h-9 rounded-t bg-emerald-700 mt-0.5"></div>
                    <span className="text-[9px] text-emerald-400 font-mono mt-1">Officer</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Officer accepts document for scanning...
                </div>
              </div>
            )}

            {/* Scene 3: Officer Scanning Document & Taking Live Photo */}
            {currentStage.id === 3 && (
              <div className="w-full max-w-[280px] h-[200px] rounded-xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">Scanning &amp; Photo Check</span>
                  <span className="text-[10px] text-emerald-400 font-mono">&check; Scanning</span>
                </div>

                <div className="relative flex-1 grid grid-cols-2 gap-3 items-center pt-2">
                  {/* Scanner on Desk */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/40 relative overflow-hidden flex flex-col items-center justify-center space-y-1">
                    <div className="w-10 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-mono text-cyan-300">
                      ID CARD
                    </div>
                    {/* Animated Scanning Beam */}
                    <div 
                      className="absolute left-2 right-2 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all"
                      style={{ top: `${Math.max(20, Math.min(80, progress % 100))}%` }}
                    ></div>
                    <span className="text-[8px] font-mono text-cyan-300">Document Scan</span>
                  </div>

                  {/* Live Camera Photo of Applicant */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 flex flex-col items-center justify-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-emerald-400 flex items-center justify-center text-emerald-300">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono text-emerald-300">&check; Face Match 97%</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Text extracted &bull; Face verified with photo
                </div>
              </div>
            )}

            {/* Scene 4: Officer Reviews Results on Screen */}
            {currentStage.id === 4 && (
              <div className="w-full max-w-[280px] h-[200px] rounded-xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">Officer Workstation</span>
                  <span className="text-[10px] text-emerald-400 font-mono">&check; Low Risk</span>
                </div>

                {/* Computer Monitor showing Results */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300 font-bold">Verification Dossier</span>
                    <span className="text-emerald-400 font-bold">GENUINE</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-300 pt-0.5">
                    <span>Fraud Risk: <strong className="text-emerald-400">12/100</strong></span>
                    <span>Confidence: <strong className="text-cyan-300">96/100</strong></span>
                  </div>
                  <div className="p-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-center text-[9px] font-bold text-emerald-300">
                    AI: PROCEED (NORMAL PROCESSING)
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Officer reviews recommendation and confirms approval...
                </div>
              </div>
            )}

            {/* Scene 5: Officer Approves & Hands Back Document */}
            {currentStage.id === 5 && (
              <div className="w-full max-w-[280px] h-[200px] rounded-xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">&check; Approved</span>
                  <span className="text-[10px] text-slate-400 font-mono">Completed</span>
                </div>

                {/* Handing back stamped document */}
                <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[12px]">
                      <Check className="w-4 h-4" />
                      <span>Verification Approved</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      OFFICIAL
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Document handed back &bull; Decision signed by Officer
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-cyan-300 font-mono pt-0.5">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Safely locked with digital security stamp</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Applicant verification successfully completed!
                </div>
              </div>
            )}
          </div>

          {/* Clean Progress Bar */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-400 h-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
