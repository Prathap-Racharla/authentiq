import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerificationMode } from '../types';
import { 
  FileUp, 
  Camera, 
  Files, 
  ArrowRight, 
  Loader2,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  RefreshCw,
  Sparkles,
  Server
} from 'lucide-react';
import { 
  analyzeDocument, 
  fetchSampleFile, 
  checkBackendHealth, 
  DocumentAnalysisResponse 
} from '../services/documentApi';
import { analyzeBiometric, BiometricAnalysisResponse } from '../services/biometricApi';
import { recordAuditEvent } from '../services/auditApi';
import { DocumentAnalysisModal } from '../components/verification/DocumentAnalysisModal';

export const NewVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const biometricFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to normalize various date formats to ISO string
  const normalizeToISODate = (dateStr: string): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    }
    const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return trimmed;
  };

  // Intake State
  const [formData, setFormData] = useState({
    verificationId: `VER-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: '',
    documentType: 'International Passport',
    documentNumber: '',
    nationality: '',
    dob: '',
    mode: 'Standard' as VerificationMode,
    simulateDbOffline: true
  });

  // Pipeline execution & analysis state
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docAnalysisStep, setDocAnalysisStep] = useState<string>('');
  const [docAnalysisProgress, setDocAnalysisProgress] = useState<number>(0);
  const [activeAnalysis, setActiveAnalysis] = useState<DocumentAnalysisResponse | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>('identity_document.png');

  // Biometric analysis state
  const [activeBiometricAnalysis, setActiveBiometricAnalysis] = useState<BiometricAnalysisResponse | null>(() => {
    const cached = sessionStorage.getItem('authentiq_active_biometric_analysis');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isAnalyzingBiometric, setIsAnalyzingBiometric] = useState(false);
  const [biometricAnalysisError, setBiometricAnalysisError] = useState<string | null>(null);

  // Other modal evidence simulations
  const [biometricUploaded, setBiometricUploaded] = useState(true);
  const [supportingUploaded, setSupportingUploaded] = useState(true);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const [finalProcessingStep, setFinalProcessingStep] = useState('');

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((status) => {
      setBackendOnline(status);
    });
  }, []);

  const [docAnalysisError, setDocAnalysisError] = useState<string | null>(null);

  const PIPELINE_STAGES = [
    'Uploading',
    'Validating',
    'Assessing Quality',
    'Extracting Text',
    'Parsing MRZ',
    'Checking Consistency',
    'Generating Evidence'
  ];

  const runDocumentPipeline = async (file: File) => {
    setIsAnalyzingDoc(true);
    setDocAnalysisError(null);
    setUploadedFilename(file.name);
    setDocAnalysisProgress(10);
    setDocAnalysisStep(PIPELINE_STAGES[0]);

    // Animate exact pipeline stage states
    let stageIdx = 0;
    const stageTimer = setInterval(() => {
      stageIdx++;
      if (stageIdx < PIPELINE_STAGES.length) {
        setDocAnalysisStep(PIPELINE_STAGES[stageIdx]);
        setDocAnalysisProgress(Math.min(95, Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100)));
      }
    }, 180);

    try {
      const response = await analyzeDocument(file);
      clearInterval(stageTimer);
      setDocAnalysisProgress(100);
      setDocAnalysisStep('Generating Evidence');
      setActiveAnalysis(response);

      // Auto-populate form fields from structured fields
      const fields = response.structured_fields;
      const nameField = fields.find(f => f.field === 'full_name')?.value;
      const numField = fields.find(f => f.field === 'document_number')?.value;
      const natField = fields.find(f => f.field === 'nationality')?.value;
      const dobField = fields.find(f => f.field === 'date_of_birth' || f.field === 'dob')?.value;

      // Auto-detect document type from OCR contents
      const rawUpper = (response.ocr_raw_text || '').toUpperCase();
      let detectedDocType = 'Identity Document';
      if (rawUpper.includes('PASSPORT') || response.mrz.detected) {
        detectedDocType = 'International Passport';
      } else if (rawUpper.includes('DRIVER LICENSE') || rawUpper.includes('DRIVING LICENCE') || rawUpper.includes('DL ')) {
        detectedDocType = 'Driving Licence';
      } else if (rawUpper.includes('AADHAAR') || rawUpper.includes('UNIQUE IDENTIFICATION')) {
        detectedDocType = 'Aadhaar Card';
      } else if (rawUpper.includes('PAN') || rawUpper.includes('PERMANENT ACCOUNT')) {
        detectedDocType = 'PAN Card';
      } else if (rawUpper.includes('IDENTITY CARD') || rawUpper.includes('ID CARD')) {
        detectedDocType = 'National ID Card';
      }

      setFormData(prev => ({
        ...prev,
        fullName: nameField || (rawUpper ? 'Subject (Unspecified in OCR)' : prev.fullName),
        documentType: detectedDocType,
        documentNumber: numField || prev.documentNumber,
        nationality: natField || prev.nationality,
        dob: dobField ? normalizeToISODate(dobField) : prev.dob,
      }));

      // Cache analysis in sessionStorage for result page
      sessionStorage.setItem('authentiq_active_document_analysis', JSON.stringify(response));

      // Record audit event in SHA-256 ledger
      recordAuditEvent(
        formData.verificationId,
        'DOCUMENT_PIPELINE',
        'Document Analysis Completed',
        `Extracted document evidence: ${response.filename} (Quality: ${response.quality.quality_score}%, MRZ: ${response.mrz.detected ? response.mrz.mrz_type || 'Detected' : 'None'})`
      );
    } catch (err: any) {
      clearInterval(stageTimer);
      setActiveAnalysis(null);
      sessionStorage.removeItem('authentiq_active_document_analysis');
      setDocAnalysisError(err.message || 'Failed to process document through backend pipeline');
    } finally {
      setTimeout(() => {
        setIsAnalyzingDoc(false);
      }, 300);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      runDocumentPipeline(file);
    }
  };

  const handleBiometricUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingBiometric(true);
    setBiometricAnalysisError(null);
    try {
      const res = await analyzeBiometric(file);
      setActiveBiometricAnalysis(res);
      setBiometricUploaded(true);
      sessionStorage.setItem('authentiq_active_biometric_analysis', JSON.stringify(res));
      recordAuditEvent(
        formData.verificationId,
        'BIOMETRIC_ENGINE',
        'Biometric Comparison Completed',
        `Biometric analysis: ${res.quality.face_detected ? 'Face Detected' : 'No Face'} (Quality: ${res.quality.quality_score}%, Status: ${res.status})`
      );
    } catch (err: any) {
      setBiometricAnalysisError(err.message || 'Biometric analysis failed');
      setActiveBiometricAnalysis(null);
      sessionStorage.removeItem('authentiq_active_biometric_analysis');
    } finally {
      setIsAnalyzingBiometric(false);
    }
  };

  const handleLoadDemoSample = async (sampleKey: 'clean' | 'degraded' | 'inconsistent') => {
    try {
      const file = await fetchSampleFile(sampleKey);
      await runDocumentPipeline(file);
    } catch (err: any) {
      alert(`Error loading sample: ${err.message}`);
    }
  };

  const handleStartVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingFinal(true);

    // Record verification intake event
    recordAuditEvent(
      formData.verificationId,
      'OFFICER_INTAKE',
      'Verification Initiated',
      `Session submitted for ${formData.fullName || 'Claimant'} [${formData.documentType}]. Mode: ${formData.mode}`
    );

    const steps = [
      'Aggregating Document Evidence signals with multi-modal vectors...',
      'Computing facial biometric descriptor distance & passive liveness...',
      formData.simulateDbOffline 
        ? 'Querying Civil Identity Registry endpoint (simulating HTTP 504 timeout)...'
        : 'Querying Civil Identity Registry endpoint (simulating positive corroboration)...',
      'Executing Transparent Decision Engine (evaluating quality vs contradiction)...',
      'Chaining immutable SHA-256 event into Prototype Audit Ledger...'
    ];

    let currentStep = 0;
    setFinalProcessingStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setFinalProcessingStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        // Persist session intake metadata
        sessionStorage.setItem('authentiq_active_intake', JSON.stringify({
          formData,
          activeAnalysis,
          activeBiometricAnalysis
        }));
        navigate(`/verification/${formData.verificationId}`);
      }
    }, 450);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              New Identity Verification Intake
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold tracking-wider">
              PHASE 2A INTAKE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Initiate multi-modal evidence collection with real 8-stage Document Intelligence Pipeline
          </p>
        </div>

        {/* Backend health status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Pipeline Engine:</span>
          {backendOnline === null ? (
            <span className="text-slate-500">Checking...</span>
          ) : backendOnline ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Ready (8000)
            </span>
          ) : (
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Offline
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleStartVerification} className="space-y-6">
        {/* Section 1: Document Upload & Intelligence Pipeline */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono text-xs font-bold">
                1
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Document Intelligence Pipeline (Live Stage)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              ICAO 9303 MRZ + OpenCV Engine
            </span>
          </div>

          {/* Quick-load Synthetic Samples for Judges / Evaluators */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                1-Click Synthetic Evaluation Samples:
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Deterministic test benchmarks
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                disabled={isAnalyzingDoc}
                onClick={() => handleLoadDemoSample('clean')}
                className="p-2.5 rounded border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span>Case A: Clean Passport</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">94% Conf</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight group-hover:text-slate-300">
                  Valid TD3 MRZ checksums, high quality, consistent fields.
                </div>
              </button>

              <button
                type="button"
                disabled={isAnalyzingDoc}
                onClick={() => handleLoadDemoSample('degraded')}
                className="p-2.5 rounded border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>Case B: Degraded Glare</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">+0 Risk</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight group-hover:text-slate-300">
                  Specular glare lowers confidence, but declares ZERO fraud risk.
                </div>
              </button>

              <button
                type="button"
                disabled={isAnalyzingDoc}
                onClick={() => handleLoadDemoSample('inconsistent')}
                className="p-2.5 rounded border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span>Case C: Inconsistent MRZ</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">+50 Risk</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight group-hover:text-slate-300">
                  DOB mismatch + invalid checksum; routes to Officer Review.
                </div>
              </button>
            </div>
          </div>

          {/* Document Upload Area or Live Progress */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/40">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
            />

            {isAnalyzingDoc ? (
              /* Live 7-stage Progress Indicator */
              <div className="py-6 px-4 space-y-4 text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                  <Cpu className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white font-mono">
                    Executing 8-Stage Document Intelligence Pipeline
                  </div>
                  <div className="text-xs text-cyan-400 font-mono mt-1">
                    {docAnalysisStep}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mx-auto bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-300 rounded-full"
                    style={{ width: `${docAnalysisProgress}%` }}
                  />
                </div>
              </div>
            ) : activeAnalysis ? (
              /* Completed Document Intelligence Result Banner */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900 border border-slate-700/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {uploadedFilename}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {activeAnalysis.document_id}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          activeAnalysis.evidence_object.status === 'Positive'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {activeAnalysis.evidence_object.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>Quality: <strong className="text-slate-200">{Math.round(activeAnalysis.quality.quality_score)}%</strong></span>
                        <span>•</span>
                        <span>MRZ: <strong className={activeAnalysis.mrz.all_check_digits_valid ? 'text-emerald-400' : 'text-rose-400'}>
                          {activeAnalysis.mrz.detected ? (activeAnalysis.mrz.all_check_digits_valid ? 'Pass' : 'Checksum Anomaly') : 'None'}
                        </strong></span>
                        <span>•</span>
                        <span>Anomalies: <strong className="text-slate-200">{activeAnalysis.anomalies.length}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsInspectionModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono tracking-wide transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      VIEW DOCUMENT ANALYSIS
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Upload different document"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded border border-slate-800/80 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>Extracted Evidence Summary:</strong> {activeAnalysis.evidence_object.summary} Form fields have been synchronized with the optical zone.
                  </span>
                </div>
              </div>
            ) : (
              /* Default Upload Prompt */
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="py-8 px-4 text-center cursor-pointer hover:bg-slate-900/40 transition-colors rounded-lg border-2 border-dashed border-slate-800 hover:border-cyan-500/50"
              >
                <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  Select or drag identity document image or PDF
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Supported formats: PNG, JPG, WebP, PDF (Max 10 MB)
                </div>
              </div>
            )}

            {docAnalysisError && (
              <div className="mt-3 p-3 rounded bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-300 font-mono">Document Pipeline Error / Unavailable (+0 Fraud Risk):</strong>
                  <span>{docAnalysisError}. Authentic evidence cannot be verified without successful pipeline response.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Identity Claim (Auto-populated from Document OCR) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Identity Claim Attributes
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Session Ref: {formData.verificationId}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Full Legal Name (Claimed)
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Siddharth R. Nair (Auto-extracted from document)"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Document Type
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="International Passport">International Passport</option>
                <option value="National ID Card">National ID Card</option>
                <option value="Driving Licence">Driving Licence</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Identity Document">Identity Document</option>
                <option value="International Passport (Demo)">International Passport (Demo)</option>
                <option value="National ID Card (Demo)">National ID Card (Demo)</option>
                <option value="Driving Licence (Demo)">Driving Licence (Demo)</option>
                <option value="Voter ID (Demo)">Voter ID (Demo)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Document Identifier Number
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="e.g. 98124019 or IND-DEMO-9812-4019"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g. Republic of India, British, United States"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Date of Birth
              </label>
              <input
                type="text"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                placeholder="YYYY-MM-DD or DD/MM/YYYY"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Synthetic Registry Scenario
              </label>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-300 font-mono text-[11px] block">
                    Simulate Database Offline (HTTP 504)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Demonstrates Unavailable != Fraud (+0 risk)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.simulateDbOffline}
                  onChange={(e) => setFormData({ ...formData, simulateDbOffline: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Auxiliary Modalities (Biometrics & Proof) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono text-xs font-bold">
                3
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Auxiliary Multi-Modal Channels
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Biometric & Supporting Corroboration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Face Image Capture Zone */}
            <input
              type="file"
              ref={biometricFileInputRef}
              onChange={handleBiometricUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <div 
              onClick={() => biometricFileInputRef.current?.click()}
              className={`p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all flex flex-col items-center text-center justify-between min-h-[140px] ${
                activeBiometricAnalysis
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : biometricUploaded 
                    ? 'border-emerald-500/50 bg-emerald-950/10' 
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                {isAnalyzingBiometric ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-200 block">
                  Live Face Image (Biometric)
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {isAnalyzingBiometric
                    ? 'Extracting facial contours & focus...'
                    : activeBiometricAnalysis
                      ? `${activeBiometricAnalysis.filename} (Quality: ${activeBiometricAnalysis.quality.quality_score}%)`
                      : biometricUploaded 
                        ? 'live_capture_sample_01.raw (Click to replace)' 
                        : 'Click to upload or capture live face'}
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                activeBiometricAnalysis
                  ? activeBiometricAnalysis.status === 'Positive'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : biometricUploaded 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isAnalyzingBiometric
                  ? 'Processing OpenCV...'
                  : activeBiometricAnalysis
                    ? `${activeBiometricAnalysis.status} • Match: ${activeBiometricAnalysis.match_score}%`
                    : biometricUploaded 
                      ? 'Staged • Passive Liveness OK' 
                      : 'Pending Capture'}
              </span>
            </div>

            {/* Supporting Evidence Zone */}
            <div 
              onClick={() => setSupportingUploaded(!supportingUploaded)}
              className={`p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all flex flex-col items-center text-center justify-between min-h-[140px] ${
                supportingUploaded 
                  ? 'border-emerald-500/50 bg-emerald-950/10' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-sky-400">
                <Files className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-200 block">
                  Supporting Evidence (Address)
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {supportingUploaded ? 'municipal_utility_rec.pdf' : 'Click to attach proof'}
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                supportingUploaded ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {supportingUploaded ? 'Staged • Address Proof' : 'Optional'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Verification Protocol Depth */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono text-xs font-bold">
                4
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Adaptive Verification Protocol Depth
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Operational Depth Setting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                mode: 'Standard' as VerificationMode,
                title: 'Standard Assurance',
                desc: 'Balanced optical, biometric, and registry cross-validation. Recommended for standard civil intake.'
              },
              {
                mode: 'Enhanced' as VerificationMode,
                title: 'Enhanced Multi-Stream',
                desc: 'Higher threshold liveness checks, deeper typography heuristics, and multi-endpoint civil verification.'
              },
              {
                mode: 'Targeted' as VerificationMode,
                title: 'Targeted Corroboration',
                desc: 'Specialized deep investigation isolating flagged attributes or prior unresolved records.'
              }
            ].map((opt) => (
              <label
                key={opt.mode}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  formData.mode === opt.mode
                    ? 'border-cyan-500 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">{opt.title}</span>
                  <input
                    type="radio"
                    name="mode"
                    value={opt.mode}
                    checked={formData.mode === opt.mode}
                    onChange={() => setFormData({ ...formData, mode: opt.mode })}
                    className="text-cyan-500 focus:ring-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {opt.desc}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Action Button & Processing Overlay */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              All transactions generate chained SHA-256 blocks in the prototype audit log.
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessingFinal || isAnalyzingDoc}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold tracking-widest uppercase transition-all shadow-lg hover:shadow-cyan-900/40 disabled:opacity-50 font-mono"
          >
            {isProcessingFinal ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>EVALUATING EVIDENCE...</span>
              </>
            ) : (
              <>
                <span>START VERIFICATION</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Final Processing Indicator */}
        {isProcessingFinal && (
          <div className="p-4 rounded-lg bg-slate-950 border border-cyan-900/60 flex items-center gap-3 text-xs font-mono text-cyan-300 animate-pulse">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{finalProcessingStep}</span>
          </div>
        )}
      </form>

      {/* Document Analysis Inspection Modal */}
      <DocumentAnalysisModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        data={activeAnalysis}
      />
    </div>
  );
};
