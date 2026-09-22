from typing import List, Optional
from pydantic import BaseModel, Field


class AuditEventSchema(BaseModel):
    event_id: str
    verification_id: str
    timestamp: str
    actor: str = "System"
    event_type: str
    previous_hash: str
    current_hash: str
    integrity_state: str = "VERIFIED"
    payload_summary: str


class CreateAuditEventRequest(BaseModel):
    verification_id: str
    actor: str = "Authorized Officer"
    event_type: str  # e.g. "OFFICER_DECISION", "INTAKE_INITIALIZED", "EVIDENCE_FUSED"
    payload_summary: str  # Sensitive-safe summary only


class AuditChainVerificationResponse(BaseModel):
    is_valid: bool
    total_blocks: int
    genesis_hash: str
    latest_hash: str
    integrity_status: str  # "VERIFIED" or "COMPROMISED"
    verified_at: str
    disclaimer: str = "Prototype tamper-evident audit ledger using SHA-256 block chaining. Production permissioned blockchain integration is future scope."

