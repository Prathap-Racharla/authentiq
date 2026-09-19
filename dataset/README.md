# AuthentiQ Synthetic Multi-Document Demonstration Dataset

## 1. Overview & Purpose
This dataset contains 12 synthetic demonstration documents designed for comprehensive testing, demonstration, and evaluation of **AuthentiQ's AI-based Identity Assurance & Adaptive Verification Engine**.

Rather than using mocked results or simulated responses, every document in this dataset is an actual high-resolution image asset (`PNG`) that passes through the **real, production AuthentiQ document analysis pipeline** (`POST /api/v1/documents/analyze`).

---

## 2. Safety & Privacy Guarantee (Zero Real PII)
- **100% Synthetic**: All names, dates of birth, identity numbers, addresses, and portrait silhouettes are completely artificial and fictional.
- **Visible Markers**: Every generated document explicitly features the prominent watermark:  
  `"SYNTHETIC DEMO DOCUMENT — NOT A REAL ID"`.
- **No Real PII**: Complies with privacy policies and data protection principles. No personal data from any living or deceased person is present.

---

## 3. Dataset Catalog & Ground Truth

The dataset includes 12 documents distributed across 4 major credential categories:

| Document ID | Category | Title | Ground Truth / Variant | MRZ Applicable | Expected Risk Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PASS-001` | Passport | Clean International Passport | Genuine ICAO 9303 TD3 | Yes (Passes check digits) | LOW_RISK |
| `PASS-002` | Passport | Passport with MRZ Check Digit Mismatch | Tampered check digit | Yes (Fails checksum) | HIGH_RISK |
| `PASS-003` | Passport | Low Resolution / Degraded Passport | Degraded/blurred optical scan | Yes (Degraded OCR confidence) | MEDIUM_RISK |
| `AAD-001` | Aadhaar-Style | Clean Aadhaar-Style ID Card | Genuine 12-digit format | No (MRZ: Not Applicable) | LOW_RISK |
| `AAD-002` | Aadhaar-Style | Aadhaar with Name/DOB Anomaly | 13-digit format anomaly | No (MRZ: Not Applicable) | MEDIUM_RISK |
| `AAD-003` | Aadhaar-Style | Blurred Aadhaar-Style ID Card | Motion blur / degraded capture | No (MRZ: Not Applicable) | MEDIUM_RISK |
| `DL-001` | Driving Licence | Valid Synthetic Driving Licence | Genuine active driving licence | No (MRZ: Not Applicable) | LOW_RISK |
| `DL-002` | Driving Licence | Expired Synthetic Driving Licence | Expired validity date (2021) | No (MRZ: Not Applicable) | HIGH_RISK |
| `DL-003` | Driving Licence | Tampered Number Driving Licence | Spliced text & font anomaly | No (MRZ: Not Applicable) | HIGH_RISK |
| `VOT-001` | Voter ID | Clean Synthetic Voter ID Card | Genuine 10-char EPIC format | No (MRZ: Not Applicable) | LOW_RISK |
| `VOT-002` | Voter ID | Voter ID with Altered Details | 11-char anomalous EPIC format | No (MRZ: Not Applicable) | MEDIUM_RISK |
| `VOT-003` | Voter ID | Low Contrast Synthetic Voter ID | Faded/low-contrast card | No (MRZ: Not Applicable) | MEDIUM_RISK |

---

## 4. Pipeline Integration & Document-Type Awareness
AuthentiQ's verification engine recognizes document types from optical and structural patterns:
1. **Passports**: Evaluated for ICAO 9303 TD3 machine-readable zones, visual inspection zones, and check digit validation.
2. **Aadhaar-Style, Driving Licences, Voter IDs**: Correctly recognized as non-MRZ documents. The engine reports `MRZ: Not Applicable` with no checksum penalties or error flags applied to the identity risk calculation.
3. **Driving Licence Validity Checks**: Expired licences are automatically flagged based on current temporal reference checks.

---

## 5. File Structure
```
dataset/
├── documents/
│   ├── passport/
│   │   ├── pass_001.png
│   │   ├── pass_002.png
│   │   └── pass_003.png
│   ├── aadhaar/
│   │   ├── aad_001.png
│   │   ├── aad_002.png
│   │   └── aad_003.png
│   ├── driving_licence/
│   │   ├── dl_001.png
│   │   ├── dl_002.png
│   │   └── dl_003.png
│   └── voter_id/
│       ├── vot_001.png
│       ├── vot_002.png
│       └── vot_003.png
├── metadata/
│   └── dataset.json
├── scripts/
│   └── generate_dataset.py
└── README.md
```

---

## 6. How to Regenerate
To regenerate all 12 document images at any time:
```bash
python dataset/scripts/generate_dataset.py
```
This script relies exclusively on Python standard libraries and Pillow (`PIL`).

