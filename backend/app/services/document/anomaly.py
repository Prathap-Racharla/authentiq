from typing import List
from app.schemas.document import (
    DocumentAnomalySignal,
    QualityAssessment,
    MRZResult,
    CrossFieldConsistencyItem
)


def generate_anomaly_signals(
    quality: QualityAssessment,
    mrz: MRZResult,
    consistency_items: List[CrossFieldConsistencyItem]
) -> List[DocumentAnomalySignal]:
    """
    Generate structured document anomaly signals with calibrated severities.
    Note: Anomaly signals report objective findings to the AuthentiQ engine;
    they do not autonomously declare a final fraud verdict.
    """
    signals: List[DocumentAnomalySignal] = []

    # 1. Quality Signals
    if quality.blur_level == "High":
        signals.append(DocumentAnomalySignal(
            signal_id="SIG-QUAL-BLUR-01",
            category="quality",
            severity="medium",
            confidence=95.0,
            description=f"Significant optical blur detected (Laplacian variance {quality.blur_score}). Text legibility degraded.",
            risk_contribution="+0 fraud risk (lowers confidence)"
        ))
    elif quality.blur_level == "Medium":
        signals.append(DocumentAnomalySignal(
            signal_id="SIG-QUAL-BLUR-02",
            category="quality",
            severity="low",
            confidence=85.0,
            description="Moderate blur observed; text fields remain decipherable.",
            risk_contribution="+0 fraud risk"
        ))

    if quality.glare_level == "High":
        signals.append(DocumentAnomalySignal(
            signal_id="SIG-QUAL-GLARE-01",
            category="quality",
            severity="medium",
            confidence=92.0,
            description=f"Specular reflection glare over {quality.glare_percentage}% of surface.",
            risk_contribution="+0 fraud risk (lowers confidence)"
        ))
    elif quality.glare_level == "Medium":
        signals.append(DocumentAnomalySignal(
            signal_id="SIG-QUAL-GLARE-02",
            category="quality",
            severity="low",
            confidence=80.0,
            description="Mild surface glare detected; optical features partially visible.",
            risk_contribution="+0 fraud risk"
        ))

    if not quality.document_boundaries_detected:
        signals.append(DocumentAnomalySignal(
            signal_id="SIG-QUAL-BOUND-01",
            category="quality",
            severity="low",
            confidence=82.0,
            description="Document boundary contour not fully isolated from image background.",
            risk_contribution="+0 fraud risk"
        ))

    # 2. MRZ Check Digit Signals
    if mrz.detected:
        failed_checks = [cd for cd in mrz.check_digits if not cd.is_valid]
        if failed_checks:
            for cd in failed_checks:
                signals.append(DocumentAnomalySignal(
                    signal_id=f"SIG-MRZ-CHK-{cd.field_name.replace(' ', '_').upper()}",
                    category="integrity",
                    severity="high",
                    confidence=98.0,
                    description=f"MRZ {cd.field_name} check digit failed: expected '{cd.expected_check_digit}', computed '{cd.computed_check_digit}'.",
                    risk_contribution="+20 risk"
                ))
        else:
            signals.append(DocumentAnomalySignal(
                signal_id="SIG-MRZ-PASS-01",
                category="integrity",
                severity="informational",
                confidence=99.0,
                description="All ICAO 9303 MRZ check digits verified valid.",
                risk_contribution="+0 fraud risk"
            ))

    # 3. Cross-Field Consistency Signals
    for item in consistency_items:
        if item.status == "MISMATCH":
            signals.append(DocumentAnomalySignal(
                signal_id=f"SIG-CONSIST-MIS-{item.comparison.replace(' ', '_').replace('↔', '_')}",
                category="consistency",
                severity="high",
                confidence=94.0,
                description=f"Field inconsistency detected in {item.comparison}: {item.explanation}",
                risk_contribution="+15 risk"
            ))
        elif item.status == "MATCH" and "Cross-Check" not in item.comparison:
            signals.append(DocumentAnomalySignal(
                signal_id=f"SIG-CONSIST-OK-{item.comparison.replace(' ', '_').replace('↔', '_')}",
                category="consistency",
                severity="informational",
                confidence=96.0,
                description=f"{item.comparison} verified consistent.",
                risk_contribution="+0 fraud risk"
            ))

    return signals

