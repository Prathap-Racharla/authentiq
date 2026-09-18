import hashlib
import time
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from app.schemas.audit import AuditEventSchema, AuditChainVerificationResponse


def compute_event_hash(
    event_id: str,
    verification_id: str,
    timestamp: str,
    actor: str,
    event_type: str,
    previous_hash: str,
    payload_summary: str,
) -> str:
    """Compute deterministic SHA-256 hash for an audit ledger event block."""
    raw = f"{event_id}|{verification_id}|{timestamp}|{actor}|{event_type}|{previous_hash}|{payload_summary}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class TamperEvidentAuditLedger:
    """
    In-memory, cryptographically linked prototype audit ledger.
    Every event block links to the previous block via its SHA-256 hash.
    
    COMPLIANCE:
    - Never stores raw PII, full document images, or biometric embeddings.
    - Demonstrates tamper-evident cryptographic chaining for SIH 2026.
    """

    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self):
        self._chain: List[AuditEventSchema] = []
        self._initialize_benchmark_chain()

    def _initialize_benchmark_chain(self):
        """Seed the ledger with Genesis block and initial benchmark events."""
        # Block 0: Genesis
        t0 = "2026-09-17 10:40:00 UTC"
        h0 = compute_event_hash(
            "EVT-0000",
            "SYSTEM",
            t0,
            "System Genesis",
            "GENESIS_INITIALIZED",
            self.GENESIS_HASH,
            "AuthentiQ Prototype Audit Ledger initialized with SHA-256 event chaining.",
        )
        self._chain.append(
            AuditEventSchema(
                event_id="EVT-0000",
                verification_id="SYSTEM",
                timestamp=t0,
                actor="System Genesis",
                event_type="GENESIS_INITIALIZED",
                previous_hash=self.GENESIS_HASH,
                current_hash=h0,
                integrity_state="VALID",
                payload_summary="AuthentiQ Prototype Audit Ledger initialized with SHA-256 event chaining.",
            )
        )

        # Block 1: Intake initialized
        self.append_event(
            verification_id="VER-2026-8942",
            actor="Intake Gateway Subsystem",
            event_type="INTAKE_INITIALIZED",
            payload_summary="Intake payload received for subject DEMO-8942. Raw PII omitted.",
            timestamp="2026-09-17 10:41:00 UTC",
        )

        # Block 2: Evidence Fused
        self.append_event(
            verification_id="VER-2026-8942",
            actor="Evidence Fusion Engine",
            event_type="EVIDENCE_FUSED",
            payload_summary="Multi-source evaluation: Document=94%, Biometric=97%, DB=Unavailable(504). Risk=18, Conf=82.",
            timestamp="2026-09-17 10:42:15 UTC",
        )

        # Block 3: Recommendation Generated
        self.append_event(
            verification_id="VER-2026-8942",
            actor="Recommendation Engine",
            event_type="RECOMMENDATION_GENERATED",
            payload_summary="Deterministic rule fired: Fraud Risk < 25 AND Evidence Confidence < 85 -> TARGETED VERIFICATION.",
            timestamp="2026-09-17 10:42:18 UTC",
        )

    def append_event(
        self,
        verification_id: str,
        actor: str,
        event_type: str,
        payload_summary: str,
        timestamp: Optional[str] = None,
    ) -> AuditEventSchema:
        """Append a new tamper-evident event block to the ledger."""
        if not timestamp:
            timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        event_id = f"EVT-{len(self._chain):04d}"
        prev_hash = self._chain[-1].current_hash if self._chain else self.GENESIS_HASH

        curr_hash = compute_event_hash(
            event_id=event_id,
            verification_id=verification_id,
            timestamp=timestamp,
            actor=actor,
            event_type=event_type,
            previous_hash=prev_hash,
            payload_summary=payload_summary,
        )

        event = AuditEventSchema(
            event_id=event_id,
            verification_id=verification_id,
            timestamp=timestamp,
            actor=actor,
            event_type=event_type,
            previous_hash=prev_hash,
            current_hash=curr_hash,
            integrity_state="VALID",
            payload_summary=payload_summary,
        )
        self._chain.append(event)
        return event

    def get_events(
        self,
        limit: int = 50,
        actor_filter: Optional[str] = None,
        type_filter: Optional[str] = None,
        verification_id: Optional[str] = None,
    ) -> List[AuditEventSchema]:
        """Retrieve recent audit events matching optional filters."""
        results = list(reversed(self._chain))
        if actor_filter:
            results = [e for e in results if actor_filter.lower() in e.actor.lower()]
        if type_filter:
            results = [e for e in results if type_filter.lower() in e.event_type.lower()]
        if verification_id:
            results = [e for e in results if verification_id.lower() in e.verification_id.lower()]
        return results[:limit]

    def verify_chain_integrity(self) -> AuditChainVerificationResponse:
        """
        Verify cryptographic integrity of the entire audit chain.
        Recalculates every block hash from Genesis to latest block.
        """
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        if not self._chain:
            return AuditChainVerificationResponse(
                is_valid=True,
                total_blocks=0,
                genesis_hash=self.GENESIS_HASH,
                latest_hash=self.GENESIS_HASH,
                integrity_status="VERIFIED",
                verified_at=now_str,
            )

        # Check block 0 previous hash
        if self._chain[0].previous_hash != self.GENESIS_HASH:
            return AuditChainVerificationResponse(
                is_valid=False,
                total_blocks=len(self._chain),
                genesis_hash=self._chain[0].current_hash,
                latest_hash=self._chain[-1].current_hash,
                integrity_status="COMPROMISED",
                verified_at=now_str,
            )

        for i, block in enumerate(self._chain):
            # Check previous hash pointer
            if i > 0:
                expected_prev = self._chain[i - 1].current_hash
                if block.previous_hash != expected_prev:
                    return AuditChainVerificationResponse(
                        is_valid=False,
                        total_blocks=len(self._chain),
                        genesis_hash=self._chain[0].current_hash,
                        latest_hash=self._chain[-1].current_hash,
                        integrity_status="COMPROMISED",
                        verified_at=now_str,
                    )

            # Recompute block hash
            expected_curr = compute_event_hash(
                event_id=block.event_id,
                verification_id=block.verification_id,
                timestamp=block.timestamp,
                actor=block.actor,
                event_type=block.event_type,
                previous_hash=block.previous_hash,
                payload_summary=block.payload_summary,
            )
            if block.current_hash != expected_curr:
                return AuditChainVerificationResponse(
                    is_valid=False,
                    total_blocks=len(self._chain),
                    genesis_hash=self._chain[0].current_hash,
                    latest_hash=self._chain[-1].current_hash,
                    integrity_status="COMPROMISED",
                    verified_at=now_str,
                )

        return AuditChainVerificationResponse(
            is_valid=True,
            total_blocks=len(self._chain),
            genesis_hash=self._chain[0].current_hash,
            latest_hash=self._chain[-1].current_hash,
            integrity_status="VERIFIED",
            verified_at=now_str,
        )


_AUDIT_LEDGER = TamperEvidentAuditLedger()


def get_audit_ledger() -> TamperEvidentAuditLedger:
    return _AUDIT_LEDGER

