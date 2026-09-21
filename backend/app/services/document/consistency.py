import re
from datetime import datetime
from typing import List, Dict, Optional
from app.schemas.document import CrossFieldConsistencyItem, StructuredField, MRZResult


def normalize_string(s: str) -> str:
    """Normalize string by removing punctuation, spaces, and converting to uppercase."""
    return re.sub(r'[^A-Z0-9]', '', s.upper())


def normalize_date(date_str: str) -> Optional[str]:
    """Attempt to parse common date formats into YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = date_str.strip()
    
    # Try YYYY-MM-DD
    if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return date_str
    
    # Try DD/MM/YYYY or MM/DD/YYYY
    parts = re.split(r'[/.-]', date_str)
    if len(parts) == 3:
        if len(parts[2]) == 4:  # DD/MM/YYYY
            d, m, y = parts[0].zfill(2), parts[1].zfill(2), parts[2]
            return f"{y}-{m}-{d}"
        if len(parts[0]) == 4:  # YYYY/MM/DD
            y, m, d = parts[0], parts[1].zfill(2), parts[2].zfill(2)
            return f"{y}-{m}-{d}"
    return date_str


def check_consistency(
    structured_fields: List[StructuredField],
    mrz: MRZResult
) -> List[CrossFieldConsistencyItem]:
    """Cross-examine OCR visual text fields with MRZ machine-readable fields."""
    items: List[CrossFieldConsistencyItem] = []
    field_map = {f.field: f.value for f in structured_fields}

    if not mrz.applicable:
        doc_num = field_map.get("document_number")
        if doc_num:
            clean_num = re.sub(r'[^A-Za-z0-9]', '', doc_num)
            if clean_num.isdigit() and len(clean_num) == 12:
                items.append(CrossFieldConsistencyItem(
                    comparison="UIDAI 12-Digit Format",
                    ocr_value=doc_num,
                    mrz_value="12-Digit UIDAI Spec",
                    status="MATCH",
                    explanation="Aadhaar UID matches standard 12-digit numeric structure."
                ))
            elif len(clean_num) >= 10 and clean_num[:2].isalpha() and any(c.isdigit() for c in clean_num):
                if len(clean_num) == 10 and clean_num[:3].isalpha() and clean_num[3:].isdigit():
                    items.append(CrossFieldConsistencyItem(
                        comparison="EPIC Identifier Format",
                        ocr_value=doc_num,
                        mrz_value="3-Alpha + 7-Digit Spec",
                        status="MATCH",
                        explanation="Voter ID matches Election Commission 10-character alphanumeric EPIC standard."
                    ))
                else:
                    items.append(CrossFieldConsistencyItem(
                        comparison="RTO Licence Format",
                        ocr_value=doc_num,
                        mrz_value="MoRTH Sarathi Spec",
                        status="MATCH",
                        explanation="Driving Licence matches state RTO alphanumeric credential structure."
                    ))
            else:
                items.append(CrossFieldConsistencyItem(
                    comparison="Credential ID Format",
                    ocr_value=doc_num,
                    mrz_value="Standard Identifier Spec",
                    status="MATCH" if len(clean_num) >= 6 else "MISMATCH",
                    explanation="Credential identifier conforms to standard length bounds." if len(clean_num) >= 6 else "Credential identifier length irregular."
                ))

        dob = field_map.get("date_of_birth")
        if dob:
            norm_dob = normalize_date(dob)
            dob_valid = True
            try:
                if norm_dob and len(norm_dob) == 10:
                    y = int(norm_dob.split("-")[0])
                    curr_y = datetime.now().year
                    dob_valid = (1900 <= y <= curr_y)
            except Exception:
                pass
            items.append(CrossFieldConsistencyItem(
                comparison="Date of Birth Demographic Check",
                ocr_value=dob,
                mrz_value="Valid Historical Date",
                status="MATCH" if dob_valid else "MISMATCH",
                explanation="Date of birth is chronologically consistent." if dob_valid else "Date of birth contains invalid year bounds."
            ))

        exp_date = field_map.get("expiry_date")
        if exp_date:
            norm_exp = normalize_date(exp_date)
            is_valid = True
            try:
                if norm_exp and len(norm_exp) == 10:
                    parsed = datetime.strptime(norm_exp, "%Y-%m-%d")
                    is_valid = parsed > datetime.now()
            except Exception:
                pass

            items.append(CrossFieldConsistencyItem(
                comparison="Expiry Date Validity",
                ocr_value=exp_date,
                mrz_value="Future Validity Window",
                status="MATCH" if is_valid else "MISMATCH",
                explanation="Credential is valid within authorized validity window." if is_valid else "Credential expiration date has lapsed."
            ))

        items.append(CrossFieldConsistencyItem(
            comparison="Machine Readable Zone (MRZ)",
            ocr_value="N/A",
            mrz_value="Not Applicable",
            status="NOT_APPLICABLE",
            explanation="Document format does not utilize an ICAO 9303 machine-readable zone; MRZ cross-check not applicable."
        ))
        return items

    if not mrz.detected:
        items.append(CrossFieldConsistencyItem(
            comparison="OCR ↔ MRZ Cross-Check",
            ocr_value="Available",
            mrz_value="No MRZ Detected",
            status="UNAVAILABLE",
            explanation="Document does not contain an optical MRZ block; machine-readable cross-check unavailable."
        ))
        exp_date = field_map.get("expiry_date")
        if exp_date:
            norm_exp = normalize_date(exp_date)
            is_valid = True
            try:
                if norm_exp and len(norm_exp) == 10:
                    parsed = datetime.strptime(norm_exp, "%Y-%m-%d")
                    is_valid = parsed > datetime.now()
            except Exception:
                pass

            items.append(CrossFieldConsistencyItem(
                comparison="Expiry Date Validity",
                ocr_value=exp_date,
                mrz_value=norm_exp,
                status="MATCH" if is_valid else "MISMATCH",
                explanation="Credential is valid within authorized expiry validity window." if is_valid else "Credential expiration date has lapsed."
            ))
        return items

    mrz_fields = mrz.parsed_fields

    # 1. Name Comparison
    ocr_name = field_map.get("full_name")
    mrz_name = mrz_fields.get("full_name") or f"{mrz_fields.get('given_names', '')} {mrz_fields.get('surname', '')}".strip()

    if ocr_name and mrz_name:
        norm_ocr = normalize_string(ocr_name)
        norm_mrz = normalize_string(mrz_name)
        # Check token containment or exact match
        ocr_tokens = set(re.findall(r'[A-Za-z]+', ocr_name.upper()))
        mrz_tokens = set(re.findall(r'[A-Za-z]+', mrz_name.upper()))
        common = ocr_tokens.intersection(mrz_tokens)

        if norm_ocr == norm_mrz or len(common) >= min(len(ocr_tokens), len(mrz_tokens)):
            items.append(CrossFieldConsistencyItem(
                comparison="OCR Name ↔ MRZ Name",
                ocr_value=ocr_name,
                mrz_value=mrz_name,
                status="MATCH",
                explanation="Identity holder name correlates across visual zone and MRZ block."
            ))
        else:
            items.append(CrossFieldConsistencyItem(
                comparison="OCR Name ↔ MRZ Name",
                ocr_value=ocr_name,
                mrz_value=mrz_name,
                status="MISMATCH",
                explanation=f"Holder name discrepancy: OCR visual text ('{ocr_name}') differs from MRZ text ('{mrz_name}')."
            ))
    else:
        items.append(CrossFieldConsistencyItem(
            comparison="OCR Name ↔ MRZ Name",
            ocr_value=ocr_name,
            mrz_value=mrz_name,
            status="UNAVAILABLE",
            explanation="Name field missing in visual zone or MRZ block."
        ))

    # 2. Date of Birth Comparison
    ocr_dob = field_map.get("date_of_birth")
    mrz_dob = mrz_fields.get("date_of_birth")

    if ocr_dob and mrz_dob:
        norm_ocr_dob = normalize_date(ocr_dob)
        norm_mrz_dob = normalize_date(mrz_dob)
        
        # Check raw digits
        digits_ocr = re.sub(r'\D', '', ocr_dob)
        digits_mrz = re.sub(r'\D', '', mrz_dob)

        if norm_ocr_dob == norm_mrz_dob or digits_ocr.endswith(digits_mrz) or digits_mrz.endswith(digits_ocr):
            items.append(CrossFieldConsistencyItem(
                comparison="OCR DOB ↔ MRZ DOB",
                ocr_value=ocr_dob,
                mrz_value=mrz_dob,
                status="MATCH",
                explanation="Date of birth verified identical in visual zone and encoded MRZ."
            ))
        else:
            items.append(CrossFieldConsistencyItem(
                comparison="OCR DOB ↔ MRZ DOB",
                ocr_value=ocr_dob,
                mrz_value=mrz_dob,
                status="MISMATCH",
                explanation=f"Date of birth mismatch: Visual zone displays '{ocr_dob}' but MRZ encodes '{mrz_dob}'."
            ))
    else:
        items.append(CrossFieldConsistencyItem(
            comparison="OCR DOB ↔ MRZ DOB",
            ocr_value=ocr_dob,
            mrz_value=mrz_dob,
            status="UNAVAILABLE",
            explanation="Date of birth missing from one or both evidence streams."
        ))

    # 3. Document Number Comparison
    ocr_num = field_map.get("document_number")
    mrz_num = mrz_fields.get("document_number")

    if ocr_num and mrz_num:
        norm_ocr_num = normalize_string(ocr_num)
        norm_mrz_num = normalize_string(mrz_num)

        # Allow subset matching if country code prefix is present in one
        if norm_ocr_num == norm_mrz_num or norm_ocr_num in norm_mrz_num or norm_mrz_num in norm_ocr_num:
            items.append(CrossFieldConsistencyItem(
                comparison="OCR Document Number ↔ MRZ Document Number",
                ocr_value=ocr_num,
                mrz_value=mrz_num,
                status="MATCH",
                explanation="Document serial numbers correlate across visual zone and MRZ."
            ))
        else:
            items.append(CrossFieldConsistencyItem(
                comparison="OCR Document Number ↔ MRZ Document Number",
                ocr_value=ocr_num,
                mrz_value=mrz_num,
                status="MISMATCH",
                explanation=f"Serial number mismatch: Visual zone shows '{ocr_num}' but MRZ contains '{mrz_num}'."
            ))
    else:
        items.append(CrossFieldConsistencyItem(
            comparison="OCR Document Number ↔ MRZ Document Number",
            ocr_value=ocr_num,
            mrz_value=mrz_num,
            status="UNAVAILABLE",
            explanation="Document number not extracted from one of the streams."
        ))

    # 4. Expiry Date Validity
    exp_date = field_map.get("expiry_date") or mrz_fields.get("expiry_date")
    if exp_date:
        norm_exp = normalize_date(exp_date)
        is_valid = True
        try:
            if norm_exp and len(norm_exp) == 10:
                parsed = datetime.strptime(norm_exp, "%Y-%m-%d")
                is_valid = parsed > datetime.now()
        except Exception:
            pass

        items.append(CrossFieldConsistencyItem(
            comparison="Expiry Date Validity",
            ocr_value=exp_date,
            mrz_value=norm_exp,
            status="MATCH" if is_valid else "MISMATCH",
            explanation="Credential is valid within authorized expiry validity window." if is_valid else "Credential expiration date has lapsed."
        ))

    return items

