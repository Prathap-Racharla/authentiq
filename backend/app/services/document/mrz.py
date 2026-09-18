import re
from typing import List, Optional, Tuple, Dict
from app.schemas.document import MRZResult, MRZCheckDigitResult

ICAO_WEIGHTS = [7, 3, 1]


def char_to_mrz_value(char: str) -> int:
    """Convert a character to its ICAO 9303 numeric value."""
    char = char.upper()
    if '0' <= char <= '9':
        return int(char)
    if 'A' <= char <= 'Z':
        return ord(char) - ord('A') + 10
    if char == '<':
        return 0
    return 0


def calculate_check_digit(data: str) -> str:
    """Calculate the ICAO 9303 check digit (modulo 10 with 7-3-1 weights)."""
    total = 0
    for i, ch in enumerate(data):
        weight = ICAO_WEIGHTS[i % 3]
        total += char_to_mrz_value(ch) * weight
    return str(total % 10)


def extract_mrz_lines(lines: List[str]) -> List[str]:
    """Find and clean potential MRZ lines from OCR output."""
    mrz_candidates = []
    for line in lines:
        cleaned = (
            line.replace('《', '<')
            .replace('》', '<')
            .replace('〈', '<')
            .replace('〉', '<')
            .replace('«', '<')
            .replace('»', '<')
            .replace('（', '<')
            .replace('）', '<')
            .replace('＜', '<')
            .replace('＞', '<')
            .replace('\uff1c', '<')
            .replace('\uff1e', '<')
            .replace('\u4eba', '<')
            .replace('\u2264', '<')
        )
        stripped = re.sub(r'[^A-Z0-9<]', '', cleaned.upper().replace(' ', ''))
        if ('<' in stripped or stripped.startswith(('P<', 'I<', 'A<', 'C<', 'V<', 'P'))) and len(stripped) >= 28:
            mrz_candidates.append(stripped)

    # 1. Check for TD1 (3 lines of ~30 chars each)
    if len(mrz_candidates) >= 3:
        for i in range(len(mrz_candidates) - 2):
            l1, l2, l3 = mrz_candidates[i], mrz_candidates[i + 1], mrz_candidates[i + 2]
            if (27 <= len(l1) <= 33) and (27 <= len(l2) <= 33) and (27 <= len(l3) <= 33):
                return [l1.ljust(30, '<')[:30], l2.ljust(30, '<')[:30], l3.ljust(30, '<')[:30]]

    # 2. Check for TD3 (2 lines: passport line 1 starts with P and length ~44; line 2 starts with doc/digits)
    if len(mrz_candidates) >= 2:
        for i in range(len(mrz_candidates) - 1):
            l1, l2 = mrz_candidates[i], mrz_candidates[i + 1]
            if (l1.startswith('P') and len(l1) >= 32 and len(l2) >= 28) or ((35 <= len(l1) <= 46) and (30 <= len(l2) <= 46)):
                pad1 = l1.ljust(44, '<')[:44]
                # If trailing < were collapsed by OCR, pad before the final composite check digit if present
                if len(l2) < 44 and l2[-1].isdigit() and l2[-2] == '<':
                    pad2 = l2[:-1].ljust(43, '<') + l2[-1]
                else:
                    pad2 = l2.ljust(44, '<')[:44]
                return [pad1, pad2]

    # 3. Check for TD2 (2 lines of ~36 chars)
    if len(mrz_candidates) >= 2:
        for i in range(len(mrz_candidates) - 1):
            l1, l2 = mrz_candidates[i], mrz_candidates[i + 1]
            if (32 <= len(l1) <= 38) and (32 <= len(l2) <= 38):
                return [l1.ljust(36, '<')[:36], l2.ljust(36, '<')[:36]]

    # Fallback to candidates
    if len(mrz_candidates) >= 3 and len(mrz_candidates[-3]) <= 32:
        return mrz_candidates[-3:]
    return mrz_candidates[-2:] if len(mrz_candidates) >= 2 else mrz_candidates


def parse_td1(lines: List[str]) -> Tuple[Dict[str, str], List[MRZCheckDigitResult]]:
    """Parse ICAO TD1 MRZ format (ID cards: 3 lines of 30 characters)."""
    line1, line2, line3 = lines[0].ljust(30, '<'), lines[1].ljust(30, '<'), lines[2].ljust(30, '<')
    fields: Dict[str, str] = {}
    check_digits: List[MRZCheckDigitResult] = []

    # Line 1:
    # 0:2 Doc Type (e.g. 'ID', 'I<')
    # 2:5 Issuing State (e.g. 'IND')
    # 5:14 Document Number (9 chars)
    # 14 Document Number Check Digit
    # 15:30 Optional Data 1 (15 chars)
    fields['document_type'] = line1[0:2].replace('<', '')
    fields['issuing_state'] = line1[2:5].replace('<', '')
    
    doc_num_raw = line1[5:14]
    doc_num = doc_num_raw.replace('<', '')
    doc_num_check = line1[14]
    fields['document_number'] = doc_num
    calc_doc_check = calculate_check_digit(doc_num_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Document Number",
        value=doc_num,
        expected_check_digit=doc_num_check,
        computed_check_digit=calc_doc_check,
        is_valid=(doc_num_check == calc_doc_check)
    ))

    # Line 2:
    # 0:6 Date of Birth (YYMMDD)
    # 6 DOB Check Digit
    # 7 Sex (M/F/X)
    # 8:14 Expiry Date (YYMMDD)
    # 14 Expiry Check Digit
    # 15:18 Nationality (3 chars)
    # 18:29 Optional Data 2 (11 chars)
    # 29 Composite Check Digit
    dob_raw = line2[0:6]
    dob_check = line2[6]
    calc_dob_check = calculate_check_digit(dob_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Date of Birth",
        value=dob_raw,
        expected_check_digit=dob_check,
        computed_check_digit=calc_dob_check,
        is_valid=(dob_check == calc_dob_check)
    ))
    if len(dob_raw) == 6 and dob_raw.isdigit():
        yy = int(dob_raw[:2])
        year_prefix = "19" if yy > 25 else "20"
        fields['date_of_birth'] = f"{year_prefix}{dob_raw[:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}"
    else:
        fields['date_of_birth'] = dob_raw

    fields['sex'] = line2[7].replace('<', 'X')

    exp_raw = line2[8:14]
    exp_check = line2[14]
    calc_exp_check = calculate_check_digit(exp_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Expiry Date",
        value=exp_raw,
        expected_check_digit=exp_check,
        computed_check_digit=calc_exp_check,
        is_valid=(exp_check == calc_exp_check)
    ))
    if len(exp_raw) == 6 and exp_raw.isdigit():
        fields['expiry_date'] = f"20{exp_raw[:2]}-{exp_raw[2:4]}-{exp_raw[4:6]}"
    else:
        fields['expiry_date'] = exp_raw

    fields['nationality'] = line2[15:18].replace('<', '')

    # Composite check digit (Line 2 char 29 verifies Line 1 5-30, Line 2 0-7, 8-15, 18-29)
    comp_check = line2[29]
    comp_data = line1[5:30] + line2[0:7] + line2[8:15] + line2[18:29]
    calc_comp_check = calculate_check_digit(comp_data)
    check_digits.append(MRZCheckDigitResult(
        field_name="Composite Check Digit",
        value="Composite TD1",
        expected_check_digit=comp_check,
        computed_check_digit=calc_comp_check,
        is_valid=(comp_check == calc_comp_check)
    ))

    # Line 3:
    # Names (Surname<<Given Names)
    names_part = line3
    names = names_part.split('<<')
    surname = names[0].replace('<', ' ').strip()
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    fields['surname'] = surname
    fields['given_names'] = given_names
    fields['full_name'] = f"{given_names} {surname}".strip()

    return fields, check_digits


def parse_td2(line1: str, line2: str) -> Tuple[Dict[str, str], List[MRZCheckDigitResult]]:
    """Parse ICAO TD2 MRZ format (Official travel documents: 2 lines of 36 characters)."""
    line1, line2 = line1.ljust(36, '<'), line2.ljust(36, '<')
    fields: Dict[str, str] = {}
    check_digits: List[MRZCheckDigitResult] = []

    # Line 1:
    # 0:2 Doc Type
    # 2:5 Issuing State
    # 5:36 Names
    fields['document_type'] = line1[0:2].replace('<', '')
    fields['issuing_state'] = line1[2:5].replace('<', '')

    names_part = line1[5:36]
    names = names_part.split('<<')
    surname = names[0].replace('<', ' ').strip()
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    fields['surname'] = surname
    fields['given_names'] = given_names
    fields['full_name'] = f"{given_names} {surname}".strip()

    # Line 2:
    # 0:9 Doc Number
    # 9 Doc Check
    # 10:13 Nationality
    # 13:19 DOB
    # 19 DOB Check
    # 20 Sex
    # 21:27 Expiry Date
    # 27 Expiry Check
    # 28:35 Optional Data
    # 35 Composite Check Digit
    doc_num_raw = line2[0:9]
    doc_num = doc_num_raw.replace('<', '')
    doc_num_check = line2[9]
    fields['document_number'] = doc_num
    calc_doc_check = calculate_check_digit(doc_num_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Document Number",
        value=doc_num,
        expected_check_digit=doc_num_check,
        computed_check_digit=calc_doc_check,
        is_valid=(doc_num_check == calc_doc_check)
    ))

    fields['nationality'] = line2[10:13].replace('<', '')

    dob_raw = line2[13:19]
    dob_check = line2[19]
    calc_dob_check = calculate_check_digit(dob_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Date of Birth",
        value=dob_raw,
        expected_check_digit=dob_check,
        computed_check_digit=calc_dob_check,
        is_valid=(dob_check == calc_dob_check)
    ))
    if len(dob_raw) == 6 and dob_raw.isdigit():
        yy = int(dob_raw[:2])
        year_prefix = "19" if yy > 25 else "20"
        fields['date_of_birth'] = f"{year_prefix}{dob_raw[:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}"
    else:
        fields['date_of_birth'] = dob_raw

    fields['sex'] = line2[20].replace('<', 'X')

    exp_raw = line2[21:27]
    exp_check = line2[27]
    calc_exp_check = calculate_check_digit(exp_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Expiry Date",
        value=exp_raw,
        expected_check_digit=exp_check,
        computed_check_digit=calc_exp_check,
        is_valid=(exp_check == calc_exp_check)
    ))
    if len(exp_raw) == 6 and exp_raw.isdigit():
        fields['expiry_date'] = f"20{exp_raw[:2]}-{exp_raw[2:4]}-{exp_raw[4:6]}"
    else:
        fields['expiry_date'] = exp_raw

    comp_check = line2[35]
    comp_data = line2[0:10] + line2[13:20] + line2[21:35]
    calc_comp_check = calculate_check_digit(comp_data)
    check_digits.append(MRZCheckDigitResult(
        field_name="Composite Check Digit",
        value="Composite TD2",
        expected_check_digit=comp_check,
        computed_check_digit=calc_comp_check,
        is_valid=(comp_check == calc_comp_check)
    ))

    return fields, check_digits


def parse_td3(line1: str, line2: str) -> Tuple[Dict[str, str], List[MRZCheckDigitResult]]:
    """Parse standard ICAO TD3 passport MRZ lines (2 lines of 44 characters)."""
    line1, line2 = line1.ljust(44, '<'), line2.ljust(44, '<')
    fields: Dict[str, str] = {}
    check_digits: List[MRZCheckDigitResult] = []

    # Line 1: P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<
    fields['document_type'] = line1[0:2].replace('<', '')
    fields['issuing_state'] = line1[2:5].replace('<', '')
    
    names_part = line1[5:]
    names = names_part.split('<<')
    surname = names[0].replace('<', ' ').strip()
    given_names = names[1].replace('<', ' ').strip() if len(names) > 1 else ""
    fields['surname'] = surname
    fields['given_names'] = given_names
    fields['full_name'] = f"{given_names} {surname}".strip()

    # Line 2 (44 chars):
    # 0:9 Doc Number, 9 Doc Check, 10:13 Nat, 13:19 DOB, 19 DOB Check, 20 Sex, 21:27 Exp, 27 Exp Check
    doc_num_raw = line2[0:9]
    doc_num = doc_num_raw.replace('<', '')
    doc_num_check = line2[9]
    fields['document_number'] = doc_num

    calc_doc_check = calculate_check_digit(doc_num_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Document Number",
        value=doc_num,
        expected_check_digit=doc_num_check,
        computed_check_digit=calc_doc_check,
        is_valid=(doc_num_check == calc_doc_check)
    ))

    fields['nationality'] = line2[10:13].replace('<', '')

    # Date of Birth: YYMMDD
    dob_raw = line2[13:19]
    dob_check = line2[19]
    calc_dob_check = calculate_check_digit(dob_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Date of Birth",
        value=dob_raw,
        expected_check_digit=dob_check,
        computed_check_digit=calc_dob_check,
        is_valid=(dob_check == calc_dob_check)
    ))

    if len(dob_raw) == 6 and dob_raw.isdigit():
        yy = int(dob_raw[:2])
        year_prefix = "19" if yy > 25 else "20"
        fields['date_of_birth'] = f"{year_prefix}{dob_raw[:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}"
    else:
        fields['date_of_birth'] = dob_raw

    fields['sex'] = line2[20].replace('<', 'X')

    # Expiry Date: YYMMDD
    exp_raw = line2[21:27]
    exp_check = line2[27]
    calc_exp_check = calculate_check_digit(exp_raw)
    check_digits.append(MRZCheckDigitResult(
        field_name="Expiry Date",
        value=exp_raw,
        expected_check_digit=exp_check,
        computed_check_digit=calc_exp_check,
        is_valid=(exp_check == calc_exp_check)
    ))

    if len(exp_raw) == 6 and exp_raw.isdigit():
        fields['expiry_date'] = f"20{exp_raw[:2]}-{exp_raw[2:4]}-{exp_raw[4:6]}"
    else:
        fields['expiry_date'] = exp_raw

    # Composite check digit (char 43)
    if len(line2) >= 44:
        composite_check = line2[43]
        composite_data = line2[0:10] + line2[13:20] + line2[21:43]
        calc_comp_check = calculate_check_digit(composite_data)
        check_digits.append(MRZCheckDigitResult(
            field_name="Composite Check Digit",
            value="Composite Line 2",
            expected_check_digit=composite_check,
            computed_check_digit=calc_comp_check,
            is_valid=(composite_check == calc_comp_check)
        ))

    return fields, check_digits


def process_mrz(lines: List[str]) -> MRZResult:
    """Detect, parse, and validate MRZ lines supporting TD1, TD2, and TD3."""
    mrz_lines = extract_mrz_lines(lines)
    if not mrz_lines or len(mrz_lines) < 2:
        return MRZResult(
            detected=False,
            mrz_type=None,
            raw_lines=[],
            parsed_fields={},
            check_digits=[],
            all_check_digits_valid=False
        )

    # TD1 (3 lines of 30 chars each)
    if len(mrz_lines) == 3 or (len(mrz_lines) >= 3 and len(mrz_lines[0]) <= 32):
        fields, check_digits = parse_td1(mrz_lines[:3])
        all_valid = all(cd.is_valid for cd in check_digits)
        return MRZResult(
            detected=True,
            mrz_type="TD1 (Identity Card)",
            raw_lines=mrz_lines[:3],
            parsed_fields=fields,
            check_digits=check_digits,
            all_check_digits_valid=all_valid
        )

    # TD2 (2 lines of 36 chars each)
    if len(mrz_lines) == 2 and (len(mrz_lines[0]) == 36 or len(mrz_lines[0]) <= 38):
        fields, check_digits = parse_td2(mrz_lines[0], mrz_lines[1])
        all_valid = all(cd.is_valid for cd in check_digits)
        return MRZResult(
            detected=True,
            mrz_type="TD2 (Official Document)",
            raw_lines=mrz_lines,
            parsed_fields=fields,
            check_digits=check_digits,
            all_check_digits_valid=all_valid
        )

    # TD3 (2 lines of 44 chars each - Passport)
    fields, check_digits = parse_td3(mrz_lines[0], mrz_lines[1])
    all_valid = all(cd.is_valid for cd in check_digits)
    return MRZResult(
        detected=True,
        mrz_type="TD3 (Passport)",
        raw_lines=mrz_lines,
        parsed_fields=fields,
        check_digits=check_digits,
        all_check_digits_valid=all_valid
    )
