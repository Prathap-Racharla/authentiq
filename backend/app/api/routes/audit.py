from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Optional

from app.schemas.audit import (
    AuditEventSchema,
    CreateAuditEventRequest,
    AuditChainVerificationResponse,
)
from app.services.audit.ledger import get_audit_ledger

router = APIRouter(prefix="/audit", tags=["Tamper-Evident Audit Ledger"])


@router.get(
    "",
    response_model=List[AuditEventSchema],
    summary="Get Audit Events Ledger",
    description="Retrieve tamper-evident audit event log chained with SHA-256 block hashes."
)
def get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    actor: Optional[str] = Query(None, description="Filter by actor name"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    verification_id: Optional[str] = Query(None, description="Filter by verification ID"),
):
    ledger = get_audit_ledger()
    return ledger.get_events(
        limit=limit,
        actor_filter=actor,
        type_filter=event_type,
        verification_id=verification_id
    )


@router.post(
    "/event",
    response_model=AuditEventSchema,
    summary="Append Audit Event",
    description="Record an authorized action (such as an officer final decision) into the immutable hash chain."
)
def record_audit_event(payload: CreateAuditEventRequest):
    ledger = get_audit_ledger()
    event = ledger.append_event(
        verification_id=payload.verification_id,
        actor=payload.actor,
        event_type=payload.event_type,
        payload_summary=payload.payload_summary
    )
    return event


@router.get(
    "/verify",
    response_model=AuditChainVerificationResponse,
    summary="Verify Audit Ledger Integrity",
    description="Recalculates cryptographic SHA-256 hashes across all blocks to certify the ledger is uncompromised."
)
def verify_audit_ledger():
    ledger = get_audit_ledger()
    return ledger.verify_chain_integrity()

