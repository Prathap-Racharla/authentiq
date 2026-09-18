from typing import List
from app.schemas.fusion import EvidenceItemSchema, EvidenceSignalSchema


class SyntheticContextTelemetryService:
    """
    Evaluates contextual telemetry signals:
    - Submission velocity (single attempt vs rapid multi-identity burst)
    - Device fingerprint & browser environment
    - Geolocation consistency
    - Prior verification history
    """

    SOURCE_NAME = "Historical Telemetry & Device Intelligence (Simulated)"

    def evaluate_context(
        self,
        verification_id: str,
        simulate_high_velocity: bool = False,
        simulate_untrusted_vpn: bool = False,
    ) -> EvidenceItemSchema:
        signals: List[EvidenceSignalSchema] = []

        if simulate_untrusted_vpn or simulate_high_velocity:
            signals.append(
                EvidenceSignalSchema(
                    label="Submission Velocity",
                    impact="risk",
                    description="Multiple intake attempts observed across distinct credentials within 10 minutes (+25 risk).",
                )
            )
            signals.append(
                EvidenceSignalSchema(
                    label="Network Routing",
                    impact="risk",
                    description="Connection routed through non-domestic anonymization proxy (+15 risk).",
                )
            )
            return EvidenceItemSchema(
                category="context_history",
                title="Context & History",
                status="Negative",
                confidence=86,
                availability="Available",
                source=self.SOURCE_NAME,
                last_checked="Just now",
                summary="High-velocity intake attempts detected from anonymized endpoint. Requires officer review.",
                signals=signals,
            )

        # Standard trusted domestic context
        signals.append(
            EvidenceSignalSchema(
                label="Geolocation Consistency",
                impact="positive",
                description="IP subnet matches declared regional jurisdiction and residency.",
            )
        )
        signals.append(
            EvidenceSignalSchema(
                label="Submission Velocity",
                impact="positive",
                description="Single standard submission within 24-hour observation window.",
            )
        )
        signals.append(
            EvidenceSignalSchema(
                label="Device Integrity",
                impact="positive",
                description="Consistent browser environment without emulator or virtual machine indicators.",
            )
        )
        signals.append(
            EvidenceSignalSchema(
                label="Prior History",
                impact="neutral",
                description="Zero conflicting historical identities associated with client endpoint fingerprint.",
            )
        )

        return EvidenceItemSchema(
            category="context_history",
            title="Context & History",
            status="Informational",
            confidence=92,
            availability="Available",
            source=self.SOURCE_NAME,
            last_checked="Just now",
            summary="Submission originated from a trusted regional network. Device environment aligns with standard patterns with zero automated velocity flags.",
            signals=signals,
        )


_CONTEXT_SERVICE = SyntheticContextTelemetryService()


def get_context_service() -> SyntheticContextTelemetryService:
    return _CONTEXT_SERVICE

