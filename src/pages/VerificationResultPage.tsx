import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_VERIFICATIONS } from '../data/mockVerifications';
import { VerificationRecord, OfficerDecision } from '../types';
import { DecisionSummaryCard } from '../components/verification/DecisionSummaryCard';
import { KeyFindingsList } from '../components/verification/KeyFindingsList';
import { OfficerDecisionPanel } from '../components/verification/OfficerDecisionPanel';
import { StickyDecisionBar } from '../components/verification/StickyDecisionBar';
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
  analyzeDocument,
  analyzeDatasetDocument
} from '../services/documentApi';
import { BiometricAnalysisResponse } from '../services/biometricApi';
import { recordAuditEvent } from '../services/auditApi';
import { evaluateEvidence } from '../services/riskEngine';
import { OfficerDecisionResponse } from '../services/verificationApi';
import { 
  ArrowLeft, 
  Layers, 
  Loader2 
} from 'lucide-react';

export const VerificationResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Find record or default to benchmark showcase
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

  // Detailed view visibility state
  const [isFullAssessmentOpen, setIsFullAssessmentOpen] = useState(false);

  // Modals state
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [isReviewTriggered, setIsReviewTriggered] = useState(false);
  const [isDocInspectionOpen, setIsDocInspectionOpen] = useState(false);
  const [isLoadingInspection, setIsLoadingInspection] = useState(false);

  // Synchronize record with active intake and document analysis
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

        // Extract structured fields from document analysis if available
        const docFields = docAnalysis?.structured_fields || [];
        const docName = docFields.find(f => f.field === 'full_name')?.value;
        const docNum = docFields.find(f => f.field === 'document_number')?.value;
        const docNat = docFields.find(f => f.field === 'nationality')?.value;
        const docDob = docFields.find(f => f.field === 'date_of_birth')?.value;

        const effectiveDocType = intakeData?.formData?.documentType || docAnalysis?.document_type || prev.documentType;
        const effectiveName = intakeData?.formData?.fullName || docName || prev.subjectName;
        const effectiveDocNum = intakeData?.formData?.documentNumber || docNum || '';
        const effectiveNat = intakeData?.formData?.nationality || docNat || prev.nationality;
        const effectiveDob = intakeData?.formData?.dob || docDob || prev.dob;

        // 4. Re-evaluate transparent decision engine with the new multi-modal evidence
        const evaluation = evaluateEvidence(updatedEvidence, effectiveDocType);

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

    setIsLoadingInspection(true);
    try {
      let res: DocumentAnalysisResponse;
      try {
        res = await analyzeDatasetDocument('PASS-001');
      } catch {
        const sample = await fetchSampleFile('clean');
        res = await analyzeDocument(sample);
      }
      setDocAnalysis(res);
      setIsDocInspectionOpen(true);
    } catch (err) {
      console.error('Failed to load sample analysis:', err);
    } finally {
      setIsLoadingInspection(false);
    }
  };

  const handleOfficerDecisionSuccess = (res: OfficerDecisionResponse) => {
    setRecord((prev) => ({
      ...prev,
      officerDecision: res.officer_decision as OfficerDecision,
      officerNotes: res.officer_notes,
      officerActionTimestamp: res.officer_action_timestamp,
    }));
  };

  const scrollToDecisionPanel = () => {
    const el = document.getElementById('officer-decision-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto py-1 sm:py-2 w-full min-w-0">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* A. STATUS HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wider">
                VERIFICATION COMPLETE
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Processing completed successfully.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Session ID:</span>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {record.id}
            </span>
          </div>
        </div>

        {/* Identity Claim / Subject Demographic Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs font-mono pt-1">
          <div>
            <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Subject Name</span>
            <span className="font-semibold text-slate-100 truncate block text-xs">{record.subjectName}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Document Type</span>
            <span className="font-semibold text-white truncate block text-xs">{record.documentType}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Document Number</span>
            <span className="font-semibold text-cyan-400 truncate block text-xs">{record.documentNumberMasked}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Nationality • DOB</span>
            <span className="font-semibold text-slate-200 truncate block text-xs">{record.nationality} • {record.dob}</span>
          </div>
        </div>
      </div>

      {/* LEVEL 1: OPERATIONAL DECISION VIEW */}

      {/* B. DECISION SUMMARY CARD */}
      <DecisionSummaryCard
        fraudRisk={record.fraudRisk}
        evidenceConfidence={record.evidenceConfidence}
        recommendation={record.status}
        recommendationReason={record.recommendationReason}
        riskFactors={record.riskFactors}
        confidenceFactors={record.confidenceFactors}
        evidenceMap={record.evidence}
        documentType={record.documentType}
      />

      {/* C. KEY FINDINGS LIST */}
      <KeyFindingsList
        findings={record.findings}
        evidenceMap={record.evidence}
        documentType={record.documentType}
      />

      {/* D. OFFICER DECISION PANEL */}
      <div id="officer-decision-section">
        <OfficerDecisionPanel
          verificationId={record.id}
          initialDecision={record.officerDecision}
          initialNotes={record.officerNotes}
          initialTimestamp={record.officerActionTimestamp}
          onDecisionSuccess={handleOfficerDecisionSuccess}
        />
      </div>

      {/* Deep Investigation Toggle */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
        <p className="text-xs text-slate-400">
          Need to review raw signals, biometric vectors, or database history?
        </p>
        <button
          type="button"
          onClick={() => setIsFullAssessmentOpen(!isFullAssessmentOpen)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <span>{isFullAssessmentOpen ? 'Hide Detailed Evidence ↑' : 'View Detailed Evidence →'}</span>
        </button>
      </div>

      {/* LEVEL 2: DETAILED EVIDENCE (COLLAPSIBLE) */}
      {isFullAssessmentOpen && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
          <StickyDecisionBar
            fraudRisk={record.fraudRisk}
            evidenceConfidence={record.evidenceConfidence}
            recommendation={record.status}
            onScrollToDecision={scrollToDecisionPanel}
          />

          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Detailed Evidence &amp; Findings</span>
            </h2>
          </div>

          {/* 4 Multi-Source Evidence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <EvidenceCard 
              evidence={record.evidence.document} 
              onInspect={handleOpenDocInspection}
            />
            <EvidenceCard evidence={record.evidence.biometric} />
            <EvidenceCard evidence={record.evidence.database} />
            <EvidenceCard evidence={record.evidence.context_history} />
          </div>

          {/* Two Column Workspace: Explainable Findings & Adaptive Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ExplainableFindings 
              findings={record.findings} 
              onOpenFactors={() => setIsWhyModalOpen(true)}
            />

            <AdaptiveVerificationCard 
              record={record} 
              onUpdateDecision={(dec, notes) => {
                const ts = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
                setRecord(prev => ({
                  ...prev,
                  officerDecision: dec,
                  officerNotes: notes,
                  officerActionTimestamp: ts
                }));
                recordAuditEvent(
                  record.id,
                  'AUTHORIZED_OFFICER',
                  'Officer Decision Recorded',
                  `Officer decision: ${dec.toUpperCase()} - Reason: ${notes || 'Standard protocol verification completed'}`
                );
              }}
              isOpen={isReviewTriggered}
              onOpenChange={setIsReviewTriggered}
            />
          </div>

          {/* Identity Relationship Preview */}
          <IdentityRelationshipPreview />

          {/* Modals for Deep Inspection */}
          <WhyFactorsModal
            isOpen={isWhyModalOpen}
            onClose={() => setIsWhyModalOpen(false)}
            record={record}
          />

          <DocumentAnalysisModal
            isOpen={isDocInspectionOpen}
            onClose={() => setIsDocInspectionOpen(false)}
            data={docAnalysis}
          />
        </div>
      )}

      {/* Loading overlay */}
      {isLoadingInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 flex items-center gap-3 text-xs font-mono text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Document Pipeline Data...</span>
          </div>
        </div>
      )}
    </div>
  );
};
