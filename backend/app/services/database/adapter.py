from typing import Dict, Any, List
from app.schemas.fusion import EvidenceItemSchema, EvidenceSignalSchema


class SyntheticDatabaseAdapter:
    """
    Synthetic civil identity registry and watchlist adapter.
    
    IMPORTANT ARCHITECTURAL CONSTRAINTS:
    1. Clearly labeled as a SIMULATED SOURCE. Does not query actual government databases.
    2. Adheres to AuthentiQ Decoupled Metric Law:
       Database Unavailable != Fraud (+0 fraud risk).
    """

    SOURCE_NAME = "Civil Identity Registry Gateway (Simulated Endpoint)"

    def query_registry(
        self,
        document_number: str,
        full_name: str,
        simulate_offline: bool = False,
        simulate_revoked: bool = False,
        simulate_mismatch: bool = False,
    ) -> EvidenceItemSchema:
        """Simulate civil identity registry lookup under varying connectivity and record states."""
        signals: List[EvidenceSignalSchema] = []

        if simulate_offline:
            # Case 1: Registry Timeout (HTTP 504)
            # Demonstrates unavailability != fraud
            signals.append(
                EvidenceSignalSchema(
                    label="Registry Connection",
                    impact="lowers_confidence",
                    description="Civil identity gateway timed out after 3 retries (HTTP 504 Gateway Timeout).",
                )
            )
            signals.append(
                EvidenceSignalSchema(
                    label="Fraud Assessment",
                    impact="neutral",
                    description="Database unavailability does NOT indicate fraud (+0 fraud risk).",
                )
            )
            signals.append(
                EvidenceSignalSchema(
                    label="Completeness Impact",
                    impact="lowers_confidence",
                    description="Missing authoritative confirmation reduces overall evidence confidence score.",
                )
            )
            return EvidenceItemSchema(
                category="database",
                title="Database Verification",
                status="Unavailable",
                confidence=48,
                availability="Unavailable",
                source=self.SOURCE_NAME,
                last_checked="1 min ago (Timed out)",
                summary="Primary civil identity registry endpoint timed out after 3 retries (504 Gateway Timeout). Service maintenance window in progress.",
                signals=signals,
            )

        if simulate_revoked:
            # Case 2: Document Revoked / Cancelled
            signals.append(
                EvidenceSignalSchema(
                    label="Registry Status",
                    impact="risk",
                    description="Credential status flagged as REVOKED in central registry (+45 risk).",
                )
            )
            signals.append(
                EvidenceSignalSchema(
                    label="Revocation Order",
                    impact="risk",
                    description="Credential reported cancelled or replaced by issuing directorate.",
                )
            )
            return EvidenceItemSchema(
                category="database",
                title="Database Verification",
                status="Negative",
                confidence=94,
                availability="Available",
                source=self.SOURCE_NAME,
                last_checked="Just now",
                summary="Registry query confirmed credential cancellation or active revocation order.",
                signals=signals,
            )

        if simulate_mismatch:
            # Case 3: Biographic Divergence in Registry
            signals.append(
                EvidenceSignalSchema(
                    label="Name Divergence",
                    impact="risk",
                    description="Registry holder name records secondary variance (+10 risk).",
                )
            )
            signals.append(
                EvidenceSignalSchema(
                    label="Address Alignment",
                    impact="lowers_confidence",
                    description="Registered residential state differs from submitted claim.",
                )
            )
            return EvidenceItemSchema(
                category="database",
                title="Database Verification",
                status="Uncertain",
                confidence=72,
                availability="Available",
                source=self.SOURCE_NAME,
                last_checked="Just now",
                summary="Civil registry query confirmed credential exists, but biographic fields exhibit minor variance.",
                signals=signals,
            )

        # Case 4: Default Positive Registry Match
        signals.append(
            EvidenceSignalSchema(
                label="Registry Match",
                impact="positive",
                description="National registry record verified active and in good standing.",
            )
        )
        signals.append(
            EvidenceSignalSchema(
                label="Revocation Check",
                impact="positive",
                description="Zero active flags, replacement notices, or adverse administrative holds.",
            )
        )
        signals.append(
            EvidenceSignalSchema(
                label="Issuance Verification",
                impact="positive",
                description="Credential issue date and issuing office correspond with central log.",
            )
        )

        return EvidenceItemSchema(
            category="database",
            title="Database Verification",
            status="Positive",
            confidence=95,
            availability="Available",
            source=self.SOURCE_NAME,
            last_checked="Just now",
            summary="Direct civil identity registry query confirmed credential validity, active status, and biographic consistency.",
            signals=signals,
        )


_DB_ADAPTER = SyntheticDatabaseAdapter()


def get_database_adapter() -> SyntheticDatabaseAdapter:
    return _DB_ADAPTER

