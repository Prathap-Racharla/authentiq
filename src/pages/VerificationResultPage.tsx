import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_VERIFICATIONS } from '../data/mockVerifications';
import { VerificationRecord, OfficerDecision } from '../types';
import { AuthentiqDecisionPanel } from '../components/verification/AuthentiqDecisionPanel';
import { EvidenceCard } from '../components/verification/EvidenceCard';
import { ExplainableFindings } from '../components/verification/ExplainableFindings';
import { AdaptiveVerificationCard } from '../components/verification/AdaptiveVerificationCard';
import { IdentityRelationshipPreview } from '../components/verification/IdentityRelationshipPreview';
import { WhyFactorsModal } from '../components/verification/WhyFactorsModal';
import { DocumentAnalysisModal } from '../components/verification/DocumentAnalysisModal';
import { 
  DocumentAnalysisResponse, 
  toAuthentiqEvidenceItem, 
  fetchSampleFile, 
  analyzeDocument 
} from '../services/documentApi';
import { BiometricAnalysisResponse } from '../services/biometricApi';
import { recordAuditEvent } from '../services/auditApi';
import { evaluateEvidence } from '../services/riskEngine';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const VerificationResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Find record or default to the benchmark VER-2026-8942 showcase
  const existingRecord = MOCK_VERIFICATIONS.find((v) => v.id === id);
  const [record, setRecord] = useState<VerificationRecord>(() => {
    if (existingRecord) return existingRecord;
    const base = MOCK_VERIFICATIONS[0];
    return {
      ...base,
      id: id || 'VER-2026-8942',
    };
  });

  const [docAnalysis, setDocAnalysis] = useState<DocumentAnalysisResponse | null>(() => {
    const cached = sessionStorage.getItem('authentiq_active_document_analysis');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [biometricAnalysis, setBiometricAnalysis] = useState<BiometricAnalysisResponse | null>(() => {
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

  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [isReviewTriggered, setIsReviewTriggered] = useState(false);
  const [isDocInspectionOpen, setIsDocInspectionOpen] = useState(false);
  const [isLoadingInspection, setIsLoadingInspection] = useState(false);

  // Initialize or synchronize record with active intake and document analysis
  useEffect(() => {
    const intakeRaw = sessionStorage.getItem('authentiq_active_intake');
    let intakeData: any = null;
    if (intakeRaw) {
      try {
        intakeData = JSON.parse(intakeRaw);
      } catch {
        intakeData = null;
      }
    }

    if (docAnalysis || biometricAnalysis || intakeData) {
      setRecord((prev) => {
        const updatedEvidence = { ...prev.evidence };

        // 1. Update Document Evidence Stream with real pipeline output
        if (docAnalysis) {
          updatedEvidence.document = toAuthentiqEvidenceItem(docAnalysis);
        }

        // 2. Update Biometric Stream if live analysis was performed
        const activeBio = biometricAnalysis || intakeData?.activeBiometricAnalysis;
        if (activeBio?.evidence_object) {
          updatedEvidence.biometric = activeBio.evidence_object;
        }

        // 3. Update Database Stream based on simulation toggle
        if (intakeData?.formData?.simulateDbOffline === false) {
          updatedEvidence.database = {
            ...updatedEvidence.database,
            status: 'Positive',
            confidence: 96,
            availability: 'Available',
            summary: 'Direct civil registry query confirmed record validity and credential status.',
            signals: [
              { label: 'Registry Match', impact: 'positive', description: 'National registry record verified active' },
              { label: 'Revocation Check', impact: 'positive', description: 'No active flags or revocation orders' }
            ]
          };
        }

        // 4. Re-evaluate transparent decision engine with the new multi-modal evidence
        const evaluation = evaluateEvidence(updatedEvidence);

        // Extract structured fields from document analysis if available
        const docFields = docAnalysis?.structured_fields || [];
        const docName = docFields.find(f => f.field === 'full_name')?.value;
        const docNum = docFields.find(f => f.field === 'document_number')?.value;
        const docNat = docFields.find(f => f.field === 'nationality')?.value;
        const docDob = docFields.find(f => f.field === 'date_of_birth')?.value;

        const effectiveName = intakeData?.formData?.fullName || docName || prev.subjectName;
        const effectiveDocNum = intakeData?.formData?.documentNumber || docNum || '';
        const effectiveNat = intakeData?.formData?.nationality || docNat || prev.nationality;
        const effectiveDob = intakeData?.formData?.dob || docDob || prev.dob;
        const effectiveDocType = intakeData?.formData?.documentType || prev.documentType;

        const maskedNum = effectiveDocNum
          ? (effectiveDocNum.length > 4 ? `${effectiveDocNum.slice(0, 4)}-XXXX` : `${effectiveDocNum}-XXXX`)
          : prev.documentNumberMasked;

        return {
          ...prev,
          subjectName: effectiveName,
          documentType: effectiveDocType,
          documentNumberMasked: maskedNum,
          nationality: effectiveNat,
          dob: effectiveDob,
          mode: intakeData?.formData?.mode || prev.mode,
          evidence: updatedEvidence,
          fraudRisk: evaluation.fraudRisk,
          evidenceConfidence: evaluation.evidenceConfidence,
          status: evaluation.recommendation,
          recommendationReason: evaluation.recommendationReason,
          recommendedAction: evaluation.recommendedAction,
          riskFactors: evaluation.riskFactors,
          confidenceFactors: evaluation.confidenceFactors,
          findings: evaluation.findings,
        };
      });
    }
  }, [docAnalysis]);

  const handleOpenDocInspection = async () => {
    if (docAnalysis) {
      setIsDocInspectionOpen(true);
      return;
    }

    // Lazy load fallback clean sample if user opened page directly
    setIsLoadingInspection(true);
    try {
      const sample = await fetchSampleFile('clean');
      const res = await analyzeDocument(sample);
      setDocAnalysis(res);
      setIsDocInspectionOpen(true);
    } catch (err) {
      console.error('Failed to load sample analysis:', err);
    } finally {
      setIsLoadingInspection(false);
    }
  };

  const handleUpdateOfficerDecision = (decision: OfficerDecision, notes: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    setRecord((prev) => ({
      ...prev,
      officerDecision: decision,
      officerNotes: notes,
      officerActionTimestamp: timestamp,
    }));

    // Immutably record officer adjudication in backend SHA-256 ledger
    recordAuditEvent(
      record.id,
      'AUTHORIZED_OFFICER',
      'Officer Decision Recorded',
      `Officer decision: ${decision.toUpperCase()} - Reason: ${notes || 'Standard protocol verification completed'}`
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-semibold tracking-wider">
            SYNTHETIC DECISION DOSSIER
          </span>
          {docAnalysis && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold">
              DOCUMENT PIPELINE CONNECTED
            </span>
          )}
        </div>
      </div>

      {/* THE AUTHENTIQ DECISION PANEL: Visual Focal Point (Fraud Risk + Evidence Confidence) */}
      <AuthentiqDecisionPanel
        record={record}
        onOpenFactors={() => setIsWhyModalOpen(true)}
        onOpenReview={() => setIsReviewTriggered(true)}
      />

      {/* Subject Demographic Attributes Summary Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <span className="text-slate-400 text-[10px] block">Subject:</span>
          <span className="font-semibold text-slate-200 truncate block">{record.subjectName}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Document ID:</span>
          <span className="font-semibold text-slate-200 truncate block">{record.documentNumberMasked}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Nationality:</span>
          <span className="font-semibold text-slate-200 truncate block">{record.nationality}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Date of Birth:</span>
          <span className="font-semibold text-slate-200 truncate block">{record.dob}</span>
        </div>
      </div>

      {/* EVIDENCE CARDS: 4 Streams Fitting the Viewport */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Multi-Source Evidence Quality &amp; Status
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            4 Corroboration Streams
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <EvidenceCard 
            evidence={record.evidence.document} 
            onInspect={handleOpenDocInspection}
          />
          <EvidenceCard evidence={record.evidence.biometric} />
          <EvidenceCard evidence={record.evidence.database} />
          <EvidenceCard evidence={record.evidence.context_history} />
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: Explainable Findings & Adaptive Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Explainable Findings */}
        <ExplainableFindings 
          findings={record.findings} 
          onOpenFactors={() => setIsWhyModalOpen(true)}
        />

        {/* Right Column: Adaptive Routing & Officer Adjudication */}
        <AdaptiveVerificationCard 
          record={record} 
          onUpdateDecision={handleUpdateOfficerDecision}
          isOpen={isReviewTriggered}
          onOpenChange={setIsReviewTriggered}
        />
      </div>

      {/* BOTTOM WIDGET: Potential Identity Relationship Preview */}
      <IdentityRelationshipPreview />

      {/* INTERACTIVE WHY / VIEW FACTORS MODAL */}
      <WhyFactorsModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        record={record}
      />

      {/* 8-STAGE DOCUMENT INTELLIGENCE INSPECTION MODAL */}
      <DocumentAnalysisModal
        isOpen={isDocInspectionOpen}
        onClose={() => setIsDocInspectionOpen(false)}
        data={docAnalysis}
      />

      {/* Loading overlay for lazy-loaded inspection */}
      {isLoadingInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 flex items-center gap-3 text-xs font-mono text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Document Pipeline Inspection Data...</span>
          </div>
        </div>
      )}
    </div>
  );
};
