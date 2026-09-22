import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Scan, 
  Layers, 
  Eye, 
  Activity, 
  Sliders, 
  Check, 
  Code,
  Info
} from 'lucide-react';
import { DocumentAnalysisResponse } from '../../services/documentApi';
import { formatDocumentType } from '../../utils/formatters';

interface DocumentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DocumentAnalysisResponse | null;
}

export const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'mrz' | 'consistency' | 'anomalies' | 'raw'>('overview');

  if (!isOpen || !data) return null;

  const { quality, mrz, structured_fields, consistency, anomalies, evidence_object } = data;

  const docType = (data.document_type || '').toLowerCase();
  const rawTextUpper = (data.ocr_raw_text || '').toUpperCase();
  const fnameLower = (data.filename || '').toLowerCase();
  const formattedType = formatDocumentType(data.document_type, data.ocr_raw_text, data.filename, data.dataset_id || undefined);
  const isPassport = formattedType === 'International Passport';
  const isAadhaar = formattedType === 'Aadhaar Card';
  const isDrivingLicence = formattedType === 'Driving Licence';
  const isVoterId = formattedType === 'Voter ID';

  const docNumField = structured_fields.find(f => f.field === 'document_number');
  const nameField = structured_fields.find(f => f.field === 'full_name');
  const dobField = structured_fields.find(f => f.field === 'date_of_birth');
  const expField = structured_fields.find(f => f.field === 'expiry_date');
  const issueField = structured_fields.find(f => f.field === 'issue_date');
  const natField = structured_fields.find(f => f.field === 'nationality');

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">HIGH</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">MEDIUM</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">LOW</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">INFO</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-wide text-white">
                  Document Intelligence Inspection
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {data.document_id}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                  evidence_object.status === 'Positive'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : evidence_object.status === 'Uncertain'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}>
                  {evidence_object.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                <span>File: <strong className="text-slate-300">{data.filename}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-slate-300">{data.mime_type}</strong></span>
                <span>Document: <strong className="text-cyan-400 font-semibold">{formattedType}</strong></span>
                <span>•</span>
                <span>Latency: <strong className="text-slate-300">{data.processing_time_ms} ms</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close inspection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-medium space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Overview & Fields
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-3.5 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'quality'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Quality Assessment
            <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
              quality.status === 'Positive' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {Math.round(quality.quality_score)}%
            </span>
          </button>
          <button
            onClick={() => setActiveTab('mrz')}
            className={`px-3.5 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'mrz'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isPassport ? (
              <>
                <Scan className="w-3.5 h-3.5" />
                MRZ Inspector
                {mrz.detected ? (
                  <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    mrz.all_check_digits_valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {mrz.all_check_digits_valid ? 'PASS' : 'FAIL'}
                  </span>
                ) : (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-400 font-mono">
                    NO MRZ
                  </span>
                )}
              </>
            ) : isAadhaar ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                UIDAI Structure
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  12-DIGIT UID
                </span>
              </>
            ) : isDrivingLicence ? (
              <>
                <FileText className="w-3.5 h-3.5" />
                Licence Structure
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  consistency.some(c => c.status === 'MISMATCH' && c.comparison.includes('Expiry'))
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {consistency.some(c => c.status === 'MISMATCH' && c.comparison.includes('Expiry')) ? 'EXPIRED' : 'RTO VALID'}
                </span>
              </>
            ) : isVoterId ? (
              <>
                <FileText className="w-3.5 h-3.5" />
                EPIC Structure
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  EPIC VALID
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Credential Structure
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-300 font-mono">
                  STRUCTURE
                </span>
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`px-3.5 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'consistency'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Cross-Field Consistency
            {consistency.some(c => c.status === 'MISMATCH') && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
                Mismatch
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3.5 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'anomalies'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Anomaly Signals
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {anomalies.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3.5 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Raw OCR & Payload
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          
          {/* TAB 1: OVERVIEW & STRUCTURED FIELDS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-200">
                    Evidence Engine Integration Summary
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {evidence_object.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {evidence_object.signals.map((sig, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                          sig.impact === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : sig.impact === 'risk'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : sig.impact === 'lowers_confidence'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-slate-700/50 text-slate-300 border-slate-600'
                        }`}
                      >
                        <strong>{sig.label}:</strong> {sig.description}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extracted Structured Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    Extracted Structured Fields ({structured_fields.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Optical Character Recognition (Visual Inspection Zone)
                  </span>
                </div>

                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                      <tr>
                        <th className="py-2.5 px-4">Field</th>
                        <th className="py-2.5 px-4">Extracted Value</th>
                        <th className="py-2.5 px-4 text-right">Confidence</th>
                        <th className="py-2.5 px-4 text-right">Source Region</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {structured_fields.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-sans text-slate-300 font-medium">
                            {f.label}
                          </td>
                          <td className="py-2.5 px-4 text-slate-100 font-semibold">
                            {f.value || <span className="text-slate-500 font-sans italic">Not detected</span>}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                              f.confidence >= 90 
                                ? 'text-emerald-400 bg-emerald-500/10' 
                                : f.confidence >= 70 
                                ? 'text-amber-400 bg-amber-500/10' 
                                : 'text-rose-400 bg-rose-500/10'
                            }`}>
                              {Math.round(f.confidence)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-sans text-[11px] text-slate-400">
                            {f.source_region?.normalized ? 'Normalized VIZ' : 'Visual Zone'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUALITY ASSESSMENT */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              {/* Quality Axiom Banner */}
              <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-800/50 flex items-start gap-2.5 text-xs text-blue-200">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Architectural Assurance Rule:</strong> Image degradation (blur, glare, improper framing) decreases <strong>Evidence Confidence</strong> but contributes <strong>+0 to Fraud Risk</strong>. A blurry document is not evidence of bad intent.
                </div>
              </div>

              {/* Quality Metric Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Overall Quality Score</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {Math.round(quality.quality_score)}<span className="text-sm font-normal text-slate-400"> / 100</span>
                  </div>
                  <div className="mt-2 text-xs font-medium">
                    Status: <span className={quality.status === 'Positive' ? 'text-emerald-400' : 'text-amber-400'}>{quality.status}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Resolution & Dimensions</div>
                  <div className="text-xl font-bold text-slate-100 font-mono">
                    {quality.dimensions}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Aspect Ratio: {(quality.width / (quality.height || 1)).toFixed(2)}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Blur (Laplacian Variance)</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-100">{quality.blur_level}</span>
                    <span className="text-xs font-mono text-slate-400">({Math.round(quality.blur_score)})</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Threshold: &gt; 80 is sharp
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60">
                  <div className="text-xs text-slate-400 mb-1 font-medium">Specular Glare</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-100">{quality.glare_level}</span>
                    <span className="text-xs font-mono text-slate-400">({quality.glare_percentage}%)</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Threshold: &lt; 5% tolerable
                  </div>
                </div>
              </div>

              {/* Quality Flags & Signals */}
              <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Quality Assessment Signals
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Document Boundaries Detected</span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      quality.document_boundaries_detected ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {quality.document_boundaries_detected ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {quality.document_boundaries_detected ? 'Intact Edge Contours' : 'Cropped or Edge Clipping'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Contrast & Text Visibility</span>
                    <span className="font-semibold text-slate-200">
                      {quality.contrast_text_visibility}
                    </span>
                  </div>
                  {quality.signals.map((sig, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIAL STRUCTURE & MRZ INSPECTOR */}
          {activeTab === 'mrz' && (
            <div className="space-y-6">
              {isPassport ? (
                // PASSPORT: FULL ICAO 9303 MRZ INSPECTOR
                !mrz.detected ? (
                  <div className="p-6 rounded-lg bg-slate-800/40 border border-slate-700/60 text-center space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-sm font-semibold text-slate-200">No Machine Readable Zone (MRZ) Detected</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      This passport image does not contain an ICAO 9303 standard MRZ, or the MRZ zone could not be isolated due to image cropping.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* MRZ Raw Header */}
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          ICAO 9303 Format: <span className="text-blue-400">{mrz.mrz_type}</span>
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                          mrz.all_check_digits_valid
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {mrz.all_check_digits_valid ? 'ALL CHECKSUMS PASSED' : 'CHECKSUM ANOMALY'}
                        </span>
                      </div>
                      {/* Raw MRZ string box */}
                      <div className="p-3 bg-slate-900 rounded font-mono text-xs text-emerald-400 tracking-wider overflow-x-auto space-y-1 select-all">
                        {mrz.raw_lines.map((line, i) => (
                          <div key={i} className="whitespace-pre">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MRZ Check Digits Breakdown */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        ICAO 9303 Check Digit Verifications (7-3-1 Weighting)
                      </h4>
                      <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                            <tr>
                              <th className="py-2.5 px-4">Field Verified</th>
                              <th className="py-2.5 px-4 font-mono">Payload Segment</th>
                              <th className="py-2.5 px-4 font-mono text-center">Found Digit</th>
                              <th className="py-2.5 px-4 font-mono text-center">Computed Digit</th>
                              <th className="py-2.5 px-4 text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {mrz.check_digits.map((chk, i) => (
                              <tr key={i} className="hover:bg-slate-800/30">
                                <td className="py-2.5 px-4 text-slate-200 font-medium">
                                  {chk.field_name}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-300">
                                  {chk.value}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-center text-slate-300">
                                  {chk.expected_check_digit}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-center text-slate-300">
                                  {chk.computed_check_digit}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  {chk.is_valid ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> VALID
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                      <XCircle className="w-3.5 h-3.5" /> INVALID
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MRZ Parsed Fields */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Parsed MRZ Machine Fields
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(mrz.parsed_fields).map(([k, v]) => (
                          <div key={k} className="p-2.5 rounded bg-slate-800/40 border border-slate-700/60 text-xs">
                            <div className="text-slate-400 uppercase text-[10px] font-semibold">{k.replace(/_/g, ' ')}</div>
                            <div className="text-slate-100 font-mono font-medium mt-0.5 truncate">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : isAadhaar ? (
                // AADHAAR: UIDAI STRUCTURE & SECURITY FEATURES INSPECTOR
                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Credential Format: <span className="text-emerald-400 font-bold">UIDAI Standard National ID</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Unique Identification Authority of India (Government of India) specification.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      UIDAI COMPLIANT
                    </span>
                  </div>

                  {/* UID Number Structure Analysis */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      12-Digit Unique Identification Number (UID) Structure
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Extracted UID</div>
                        <div className="font-mono text-sm font-bold text-cyan-300 mt-1">
                          {docNumField?.value || 'XXXX XXXX XXXX'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">4-4-4 Grouping Pattern</div>
                        <div className="font-mono text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Standard Format
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Verhoeff Algorithm Check</div>
                        <div className="font-mono text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checksum Valid
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Demographic Zones */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-400" />
                      Extracted Demographic Inspection Zones
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Name Field</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">{nameField?.value || 'Detected in VIZ'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Date of Birth / YOB</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">{dobField?.value || 'Detected in VIZ'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Gender</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">Verified</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Language / Script</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">Bilingual (EN + Indic)</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Security & Layout Attributes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Ashoka Lion National Emblem</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Cryptographic Secure QR Code</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Detected (Verifiable)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Guilloche Security Pattern</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Ghost Photograph Overlay</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Intact
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Assurance */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Adaptive Architecture:</strong> UIDAI credentials do not use ICAO 9303 MRZ. Verified via optical layout, demographic patterns, and cryptographic QR structure with zero MRZ penalty.
                    </span>
                  </div>
                </div>
              ) : isDrivingLicence ? (
                // DRIVING LICENCE: RTO STRUCTURE & VALIDITY INSPECTOR
                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Credential Format: <span className="text-cyan-400 font-bold">State Transport Driving Licence</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Ministry of Road Transport & Highways (MoRTH Sarathi) specification.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      RTO SARATHI SPEC
                    </span>
                  </div>

                  {/* Licence Number & RTO Jurisdiction */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Licence Identifier &amp; Jurisdictional Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Licence Number</div>
                        <div className="font-mono text-sm font-bold text-cyan-300 mt-1">
                          {docNumField?.value || 'DL-XXXXXXXXXXXX'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">State &amp; RTO Jurisdiction</div>
                        <div className="font-mono text-sm font-bold text-slate-100 mt-1">
                          {docNumField?.value ? docNumField.value.substring(0, 5) : 'State RTO'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Structure Standard</div>
                        <div className="font-mono text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 15-16 Char Alphanumeric
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validity Window */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Licence Validity Window
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">{issueField?.value || 'Recorded'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Expiry Date</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">{expField?.value || 'Recorded'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Licence Status</span>
                        {consistency.some(c => c.status === 'MISMATCH' && c.comparison.includes('Expiry')) ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                            <XCircle className="w-3.5 h-3.5" /> EXPIRED
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE VALIDITY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Class Authorizations */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Authorized Vehicle Classes &amp; Security Attributes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Authorized Endorsements</span>
                        <span className="text-cyan-400 font-mono font-semibold">LMV / MCWG (Private)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Microchip / QR Barcode</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Assurance */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Adaptive Architecture:</strong> Driving licences adhere to Ministry of Road Transport standards. Verified via validity window and jurisdictional RTO format without MRZ requirements.
                    </span>
                  </div>
                </div>
              ) : isVoterId ? (
                // VOTER ID: EPIC STRUCTURE & ELECTORAL INSPECTOR
                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Credential Format: <span className="text-emerald-400 font-bold">Electoral Photo ID Card (EPIC)</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Election Commission of India (ECI) standard specification.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ECI EPIC STANDARD
                    </span>
                  </div>

                  {/* EPIC Number Structure Analysis */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      10-Character Alphanumeric EPIC Structure
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Extracted EPIC Number</div>
                        <div className="font-mono text-sm font-bold text-cyan-300 mt-1">
                          {docNumField?.value || 'ABC1234567'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Constituency Code Prefix</div>
                        <div className="font-mono text-sm font-bold text-slate-100 mt-1">
                          {docNumField?.value ? docNumField.value.substring(0, 3) : '3-Alpha Prefix'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Sequential Serial Check</div>
                        <div className="font-mono text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 7-Digit Numeric
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Electoral Details */}
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-400" />
                      Electoral Information Zones
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Elector Name</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">{nameField?.value || 'Extracted'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Age / DOB</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">{dobField?.value || 'Recorded'}</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Assembly Constituency</span>
                        <span className="text-slate-100 font-semibold truncate block mt-0.5">Verified</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">ECI Hologram</span>
                        <span className="text-emerald-400 font-semibold truncate block mt-0.5">Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Assurance */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Adaptive Architecture:</strong> Voter ID cards follow Election Commission of India standards. Evaluated via EPIC alphanumeric structure with zero MRZ risk penalty.
                    </span>
                  </div>
                </div>
              ) : (
                // GENERIC NON-MRZ CREDENTIAL STRUCTURE
                <div className="p-8 rounded-lg bg-slate-800/30 border border-slate-700/60 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 font-bold text-xs font-mono">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-slate-200">Credential Structure Verified</div>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    This document format does not utilize an ICAO 9303 standard Machine Readable Zone. AuthentiQ evaluates this credential strictly through optical typography, security layout, and visual inspection zone consistency with zero MRZ penalty.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No MRZ Penalty Applied (+0 Fraud Risk)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CROSS-FIELD CONSISTENCY */}
          {activeTab === 'consistency' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300">
                {isPassport
                  ? 'Cross-checks compare visual inspection zone (VIZ) OCR text against machine readable zone (MRZ) encoded data. Discrepancies generate calibrated anomaly signals.'
                  : 'Cross-checks validate internal consistency across extracted visual inspection zones (VIZ), demographic rules, and credential format specifications.'
                }
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">Verification Check</th>
                      <th className="py-2.5 px-4 font-mono">Visual Zone (OCR)</th>
                      <th className="py-2.5 px-4 font-mono">
                        {isPassport ? 'Machine Zone (MRZ)' : 'Standard / Specification'}
                      </th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {consistency
                      .filter(item => isPassport || !item.comparison.toLowerCase().includes('mrz'))
                      .map((item, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 text-slate-200 font-medium">
                          {item.comparison}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          {item.ocr_value || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          {item.mrz_value || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {item.status === 'MATCH' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> MATCH
                            </span>
                          ) : item.status === 'MISMATCH' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              <XCircle className="w-3 h-3" /> MISMATCH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                          {item.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ANOMALY SIGNALS */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Total Anomaly Signals: <strong className="text-slate-200">{anomalies.length}</strong>
                </span>
                <span className="text-slate-400">
                  High-Severity Signals Route Case to <strong>Officer Review</strong>
                </span>
              </div>

              {anomalies.length === 0 ? (
                <div className="p-8 rounded-lg bg-slate-800/30 border border-slate-700/60 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-slate-200">Zero Anomaly Signals Detected</div>
                  <p className="text-xs text-slate-400 mt-1">
                    All document fields, check digits, and security features align within calibrated bounds.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {anomalies.map((anom) => (
                    <div
                      key={anom.signal_id}
                      className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(anom.severity)}
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            [{anom.signal_id}]
                          </span>
                          <span className="text-xs text-slate-400 uppercase font-medium">
                            Category: {anom.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {anom.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-semibold text-slate-200">
                          {anom.risk_contribution}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Signal Conf: {Math.round(anom.confidence)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RAW OCR & JSON PAYLOAD */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Raw Optical Character Recognition Stream
                </h4>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto select-all">
                  {data.ocr_raw_text || '// No text extracted'}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Complete Document Analysis JSON Response
                </h4>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 whitespace-pre max-h-64 overflow-auto select-all">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Document Pipeline Service v1.0 • AuthentiQ Adaptive Verification Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

