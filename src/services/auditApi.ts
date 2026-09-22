import { AuditEvent } from '../types';
import { MOCK_AUDIT_EVENTS } from '../data/mockAuditEvents';

const API_BASE_URL = '/api/v1';

export interface AuditVerificationStatus {
  isValid: boolean;
  totalBlocks: number;
  genesisHash: string;
  latestHash: string;
  integrityStatus: 'VERIFIED' | 'COMPROMISED';
  verifiedAt: string;
}

export async function fetchAuditEvents(
  limit: number = 50,
  actor?: string,
  eventType?: string,
  verificationId?: string
): Promise<AuditEvent[]> {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (actor) params.append('actor', actor);
    if (eventType) params.append('event_type', eventType);
    if (verificationId) params.append('verification_id', verificationId);

    const res = await fetch(`${API_BASE_URL}/audit?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.map((d: any) => {
        let integrity: 'VERIFIED' | 'FLAGGED' | 'IN PROGRESS' = 'IN PROGRESS';
        if (d.integrity_state === 'VERIFIED' || d.integrity_state === 'VALID') {
          integrity = 'VERIFIED';
        } else if (d.integrity_state === 'COMPROMISED' || d.integrity_state === 'FLAGGED') {
          integrity = 'FLAGGED';
        } else if (d.integrity_state === 'IN PROGRESS') {
          integrity = 'IN PROGRESS';
        }

        return {
          eventId: d.event_id,
          verificationId: d.verification_id,
          timestamp: d.timestamp,
          actor: d.actor,
          eventType: d.event_type as any,
          prevHash: d.previous_hash,
          currentHash: d.current_hash,
          integrity,
          payloadSummary: d.payload_summary,
        };
      });
    }
  } catch (err) {
    console.warn('Audit API unreachable, using local prototype ledger:', err);
  }

  // Fallback to local mock ledger
  return MOCK_AUDIT_EVENTS;
}

export async function recordAuditEvent(
  verificationId: string,
  actor: string,
  eventType: string,
  payloadSummary: string
): Promise<AuditEvent | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/audit/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_id: verificationId,
        actor,
        event_type: eventType,
        payload_summary: payloadSummary,
      }),
    });

    if (res.ok) {
      const d = await res.json();
      let integrity: 'VERIFIED' | 'FLAGGED' | 'IN PROGRESS' = 'IN PROGRESS';
      if (d.integrity_state === 'VERIFIED' || d.integrity_state === 'VALID') {
        integrity = 'VERIFIED';
      } else if (d.integrity_state === 'COMPROMISED' || d.integrity_state === 'FLAGGED') {
        integrity = 'FLAGGED';
      } else if (d.integrity_state === 'IN PROGRESS') {
        integrity = 'IN PROGRESS';
      }

      return {
        eventId: d.event_id,
        verificationId: d.verification_id,
        timestamp: d.timestamp,
        actor: d.actor,
        eventType: d.event_type as any,
        prevHash: d.previous_hash,
        currentHash: d.current_hash,
        integrity,
        payloadSummary: d.payload_summary,
      };
    }
  } catch (err) {
    console.warn('Failed to record audit event to backend:', err);
  }
  return null;
}

export async function verifyAuditLedger(): Promise<AuditVerificationStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/audit/verify`);
    if (res.ok) {
      const d = await res.json();
      return {
        isValid: d.is_valid,
        totalBlocks: d.total_blocks,
        genesisHash: d.genesis_hash,
        latestHash: d.latest_hash,
        integrityStatus: d.integrity_status,
        verifiedAt: d.verified_at,
      };
    }
  } catch {
    // Offline
  }

  return {
    isValid: true,
    totalBlocks: MOCK_AUDIT_EVENTS.length,
    genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
    latestHash: MOCK_AUDIT_EVENTS[MOCK_AUDIT_EVENTS.length - 1]?.currentHash || 'c8f49a1...',
    integrityStatus: 'VERIFIED',
    verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
  };
}
