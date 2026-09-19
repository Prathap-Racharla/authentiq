import os
import re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

DATASET_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCUMENTS_DIR = os.path.join(DATASET_ROOT, "documents")

PASSPORT_DIR = os.path.join(DOCUMENTS_DIR, "passport")
AADHAAR_DIR = os.path.join(DOCUMENTS_DIR, "aadhaar")
DL_DIR = os.path.join(DOCUMENTS_DIR, "driving_licence")
VOTER_DIR = os.path.join(DOCUMENTS_DIR, "voter_id")

for d in [PASSPORT_DIR, AADHAAR_DIR, DL_DIR, VOTER_DIR]:
    os.makedirs(d, exist_ok=True)

# ICAO 9303 check digit calculation
ICAO_WEIGHTS = [7, 3, 1]

def char_val(c):
    c = c.upper()
    if '0' <= c <= '9':
        return int(c)
    if 'A' <= c <= 'Z':
        return ord(c) - ord('A') + 10
    return 0

def calc_check_digit(data):
    total = 0
    for i, ch in enumerate(data):
        total += char_val(ch) * ICAO_WEIGHTS[i % 3]
    return str(total % 10)

def get_font(size, bold=False, mono=False):
    # Try system fonts on Windows, fallback to default
    font_names = []
    if mono:
        font_names = ["consola.ttf", "cour.ttf", "lucon.ttf"]
    elif bold:
        font_names = ["segoeuib.ttf", "arialbd.ttf", "tahomabd.ttf"]
    else:
        font_names = ["segoeui.ttf", "arial.ttf", "tahoma.ttf"]

    for name in font_names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    try:
        return ImageFont.load_default()
    except Exception:
        return None

def draw_synthetic_watermark(draw, width, height):
    font = get_font(20, bold=True)
    text = "SYNTHETIC DEMO DOCUMENT — NOT A REAL ID"
    draw.rectangle([0, height - 36, width, height], fill="#1e293b")
    draw.text((width // 2, height - 26), text, fill="#f59e0b", font=font, anchor="mm")
    
    # Top subtle header watermark
    top_font = get_font(13, bold=True)
    draw.rectangle([0, 0, width, 24], fill="#0f172a")
    draw.text((width // 2, 12), "AUTHENTIQ DEMONSTRATION DATASET • STRICTLY FICTIONAL", fill="#94a3b8", font=top_font, anchor="mm")

def draw_avatar_placeholder(draw, x, y, w, h, label="AVATAR"):
    # Subtle rounded avatar box
    draw.rectangle([x, y, x + w, y + h], fill="#1e293b", outline="#475569", width=2)
    # Head and shoulders silhouette
    cx = x + w // 2
    cy = y + h // 3
    r = min(w, h) // 4
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#64748b")
    body_top = cy + r + 8
    draw.pieslice([x + 10, body_top, x + w - 10, y + h + 20], 180, 360, fill="#64748b")
    font = get_font(11, bold=True)
    draw.text((cx, y + h - 16), f"SYNTHETIC {label}", fill="#cbd5e1", font=font, anchor="mm")

# ==============================================================================
# 1. PASSPORT SAMPLES
# ==============================================================================
def create_passport(filename, name, surname, doc_num, nat_code, dob_yymmdd, dob_display, sex, exp_yymmdd, exp_display, mrz_dob_override=None, mrz_chk_override=None):
    W, H = 1000, 640
    img = Image.new("RGB", (W, H), "#0b1528")
    draw = ImageDraw.Draw(img)

    # Background subtle security guilloche pattern simulation
    for y in range(30, H - 120, 25):
        draw.line([30, y, W - 30, y], fill="#112240", width=1)
    for x in range(30, W - 30, 40):
        draw.line([x, 30, x, H - 120], fill="#112240", width=1)

    draw_synthetic_watermark(draw, W, H)

    # Header
    f_title = get_font(26, bold=True)
    f_sub = get_font(14, bold=True)
    draw.text((W // 2, 45), "REPUBLIC OF DEMO / RÉPUBLIQUE DE DÉMO", fill="#e2e8f0", font=f_title, anchor="mm")
    draw.text((W // 2, 75), "PASSPORT / PASSEPORT", fill="#38bdf8", font=f_sub, anchor="mm")

    # Photo
    draw_avatar_placeholder(draw, 50, 110, 200, 260, label="PHOTO")

    # VIZ Fields
    f_lbl = get_font(12, bold=True)
    f_val = get_font(18, bold=True)

    fields = [
        ("Type", "P", 290, 110),
        ("Code", nat_code, 450, 110),
        ("Passport No.", doc_num, 600, 110),
        ("Surname", surname.upper(), 290, 160),
        ("Given Names", name.upper(), 290, 215),
        ("Nationality", "DEMO CITIZEN", 290, 270),
        ("Date of Birth", dob_display, 290, 325),
        ("Sex", sex, 600, 325),
        ("Date of Expiry", exp_display, 290, 380),
        ("Authority", "PASSPORT OFFICE DEMO", 600, 380),
    ]

    for lbl, val, x, y in fields:
        draw.text((x, y), f"{lbl}: {val}", fill="#ffffff", font=f_val)

    # Machine Readable Zone (MRZ TD3) - 2 lines of 44 characters
    # Line 1: P<NATNAME<<SURNAME<<<<<<<<<<<<<<<<<<<<<<<<<<<
    clean_surname = re.sub(r'[^A-Z]', '<', surname.upper())
    clean_name = re.sub(r'[^A-Z]', '<', name.upper())
    line1 = f"P<{nat_code}{clean_surname}<<{clean_name}".ljust(44, '<')[:44]

    # Line 2: DOCNUM (9) + chk + NAT + DOB + chk + SEX + EXP + chk + OPTIONAL + comp_chk
    doc_padded = doc_num.ljust(9, '<')[:9]
    doc_chk = calc_check_digit(doc_padded)
    
    mrz_dob = mrz_dob_override if mrz_dob_override else dob_yymmdd
    dob_chk = mrz_chk_override if mrz_chk_override else calc_check_digit(mrz_dob)
    
    exp_chk = calc_check_digit(exp_yymmdd)
    opt = "<<<<<<<<<<<<<<"
    opt_chk = "<"
    
    comp_data = f"{doc_padded}{doc_chk}{mrz_dob}{dob_chk}{exp_yymmdd}{exp_chk}{opt}{opt_chk}"
    comp_chk = calc_check_digit(comp_data)
    line2 = f"{doc_padded}{doc_chk}{nat_code}{mrz_dob}{dob_chk}{sex}{exp_yymmdd}{exp_chk}{opt}{opt_chk}{comp_chk}"[:44]

    # Draw MRZ Box
    draw.rectangle([40, H - 125, W - 40, H - 42], fill="#f1f5f9", outline="#94a3b8", width=1)
    f_mrz = get_font(16, mono=True, bold=True)
    draw.text((60, H - 115), line1, fill="#0f172a", font=f_mrz)
    draw.text((60, H - 78), line2, fill="#0f172a", font=f_mrz)

    img.save(filename, "PNG")
    print(f"Generated: {filename}")

# PASS-001: Normal clean passport
create_passport(
    os.path.join(PASSPORT_DIR, "pass_001.png"),
    name="Aarav",
    surname="Mehta",
    doc_num="Z9812401",
    nat_code="IND",
    dob_yymmdd="940814",
    dob_display="14/08/1994",
    sex="M",
    exp_yymmdd="340813",
    exp_display="13/08/2034"
)

# PASS-002: Intentional MRZ check digit error on DOB
create_passport(
    os.path.join(PASSPORT_DIR, "pass_002.png"),
    name="Priya",
    surname="Sharma",
    doc_num="P4410982",
    nat_code="IND",
    dob_yymmdd="910522",
    dob_display="22/05/1991",
    sex="F",
    exp_yymmdd="310521",
    exp_display="21/05/2031",
    mrz_chk_override="4"  # Intentional invalid checksum (actual is 9)
)

# PASS-003: Intentional VIZ vs MRZ discrepancy (DOB contradiction)
create_passport(
    os.path.join(PASSPORT_DIR, "pass_003.png"),
    name="Vikram",
    surname="Nair",
    doc_num="K7182903",
    nat_code="IND",
    dob_yymmdd="880415",
    dob_display="15/04/1988",  # VIZ says 1988
    sex="M",
    exp_yymmdd="330414",
    exp_display="14/04/2033",
    mrz_dob_override="940820"  # MRZ says 20/08/1994 -> Contradiction!
)

# ==============================================================================
# 2. AADHAAR-STYLE SAMPLES
# ==============================================================================
def create_aadhaar(filename, name, dob_display, gender, uid_display, address, yob_override=None, degraded=False):
    W, H = 1000, 640
    img = Image.new("RGB", (W, H), "#eef2f6")
    draw = ImageDraw.Draw(img)

    # Decorative header
    draw.rectangle([0, 0, W, 70], fill="#b91c1c")
    f_head = get_font(24, bold=True)
    f_subhead = get_font(13, bold=True)
    draw.text((W // 2, 25), "DEMO IDENTIFICATION AUTHORITY", fill="#ffffff", font=f_head, anchor="mm")
    draw.text((W // 2, 52), "SYNTHETIC UNIQUE RESIDENT IDENTIFICATION CARD", fill="#fecaca", font=f_subhead, anchor="mm")

    draw_synthetic_watermark(draw, W, H)

    # Photo Box
    draw_avatar_placeholder(draw, 50, 110, 200, 250, label="RESIDENT")

    # Fields
    f_lbl = get_font(14, bold=True)
    f_val = get_font(19, bold=True)

    draw.text((290, 110), "Full Name", fill="#475569", font=f_lbl)
    draw.text((290, 132), name, fill="#0f172a", font=f_val)

    draw.text((290, 180), "Date of Birth / DOB", fill="#475569", font=f_lbl)
    draw.text((290, 202), dob_display, fill="#0f172a", font=f_val)

    if yob_override:
        # Intentional discrepancy: YOB contradicts DOB!
        draw.text((580, 180), "Year of Birth", fill="#475569", font=f_lbl)
        draw.text((580, 202), yob_override, fill="#dc2626", font=f_val)

    draw.text((290, 250), "Gender", fill="#475569", font=f_lbl)
    draw.text((290, 272), gender, fill="#0f172a", font=f_val)

    draw.text((290, 320), "Address (Residential)", fill="#475569", font=f_lbl)
    f_addr = get_font(15)
    draw.text((290, 342), address, fill="#334155", font=f_addr)

    # 12-digit UID Number Bar
    draw.rectangle([50, 480, W - 50, 560], fill="#f8fafc", outline="#cbd5e1", width=2)
    f_uid = get_font(34, bold=True, mono=True)
    draw.text((W // 2, 520), uid_display, fill="#b91c1c", font=f_uid, anchor="mm")

    f_tag = get_font(14, bold=True)
    draw.text((W // 2, 455), "Demo Aadhaar No. / आधार संख्या", fill="#0f172a", font=f_tag, anchor="mm")

    if degraded:
        # Apply blur and low contrast
        img = img.filter(ImageFilter.GaussianBlur(radius=3.5))

    img.save(filename, "PNG")
    print(f"Generated: {filename}")

# AAD-001: Clean normal Aadhaar-style
create_aadhaar(
    os.path.join(AADHAAR_DIR, "aad_001.png"),
    name="Rohan S. Verma",
    dob_display="12/03/1993",
    gender="Male",
    uid_display="2341 5892 4018",
    address="Flat 402, Shanti Nilayam, Sector 14, Pune, Maharashtra - 411001"
)

# AAD-002: Field contradiction (DOB vs YOB mismatch)
create_aadhaar(
    os.path.join(AADHAAR_DIR, "aad_002.png"),
    name="Ananya Iyer",
    dob_display="14/06/1992",
    gender="Female",
    uid_display="8921 4409 3182",
    address="12B, Palm Grove Enclave, Indiranagar, Bengaluru, Karnataka - 560038",
    yob_override="1985"  # DOB says 1992, YOB says 1985 -> Contradiction!
)

# AAD-003: Degraded optical quality
create_aadhaar(
    os.path.join(AADHAAR_DIR, "aad_003.png"),
    name="Kavita R. Patil",
    dob_display="28/11/1989",
    gender="Female",
    uid_display="6712 9018 3491",
    address="Village Post Khed, District Satara, Maharashtra - 415002",
    degraded=True
)

# ==============================================================================
# 3. DRIVING LICENCE SAMPLES
# ==============================================================================
def create_driving_licence(filename, dl_num, name, dob, issue_date, valid_till, class_cov, address, is_expired=False, chrono_error=False):
    W, H = 1000, 640
    img = Image.new("RGB", (W, H), "#0f172a")
    draw = ImageDraw.Draw(img)

    # Header Bar
    draw.rectangle([0, 0, W, 80], fill="#0369a1")
    f_h1 = get_font(22, bold=True)
    f_h2 = get_font(13, bold=True)
    draw.text((W // 2, 28), "STATE MOTOR VEHICLES DEPARTMENT", fill="#ffffff", font=f_h1, anchor="mm")
    draw.text((W // 2, 56), "SYNTHETIC DRIVING LICENCE — FORM 7 (RULE 16(2))", fill="#bae6fd", font=f_h2, anchor="mm")

    draw_synthetic_watermark(draw, W, H)

    # Avatar
    draw_avatar_placeholder(draw, 50, 110, 200, 260, label="DRIVER")

    # Fields
    f_lbl = get_font(12, bold=True)
    f_val = get_font(17, bold=True)

    fields = [
        ("Licence No.", dl_num, 290, 110),
        ("Name of Holder", name, 290, 165),
        ("Date of Birth", dob, 290, 220),
        ("Class of Vehicle (COV)", class_cov, 600, 220),
        ("Date of Issue", issue_date, 290, 275),
        ("Valid Until / Expiry", valid_till, 600, 275),
        ("Address", address, 290, 335),
        ("Issuing Authority", "REGIONAL TRANSPORT OFFICE, PUNE", 290, 395),
    ]

    for lbl, val, x, y in fields:
        color = "#ef4444" if (is_expired and "Expiry" in lbl) or (chrono_error and "Issue" in lbl) else "#f8fafc"
        if lbl == "Address":
            draw.text((x, y), "Address:", fill="#94a3b8", font=f_lbl)
            draw.text((x, y + 18), val, fill=color, font=get_font(14))
        else:
            draw.text((x, y), f"{lbl}: {val}", fill=color, font=f_val)

    # Decorative chip representation
    draw.rectangle([W - 130, 110, W - 50, 175], fill="#d97706", outline="#f59e0b", width=2)
    f_chip = get_font(10, bold=True)
    draw.text((W - 90, 142), "DEMO CHIP", fill="#ffffff", font=f_chip, anchor="mm")

    img.save(filename, "PNG")
    print(f"Generated: {filename}")

# DL-001: Clean normal Driving Licence
create_driving_licence(
    os.path.join(DL_DIR, "dl_001.png"),
    dl_num="DL-0420190056789",
    name="Aditya M. Joshi",
    dob="25/07/1990",
    issue_date="15/11/2019",
    valid_till="20/11/2034",
    class_cov="MCWG, LMV",
    address="45, Gandhi Nagar, Kothrud, Pune - 411038"
)

# DL-002: Expired Driving Licence
create_driving_licence(
    os.path.join(DL_DIR, "dl_002.png"),
    dl_num="DL-1420060012345",
    name="Suresh K. Pillai",
    dob="10/01/1975",
    issue_date="11/04/2006",
    valid_till="10/04/2021",  # Expired!
    class_cov="LMV, TRANS",
    address="88/2, Civil Lines, Nagpur, Maharashtra - 440001",
    is_expired=True
)

# DL-003: Chronological Contradiction (Issue date vs DOB)
create_driving_licence(
    os.path.join(DL_DIR, "dl_003.png"),
    dl_num="DL-0920180098765",
    name="Deepak N. Kulkarni",
    dob="12/09/2012",       # Holder born in 2012
    issue_date="10/05/2018", # Licence issued in 2018 (age 5 years old!) -> Inconsistency!
    valid_till="10/05/2038",
    class_cov="MCWG",
    address="Plot 12, Baner Road, Pune - 411045",
    chrono_error=True
)

# ==============================================================================
# 4. VOTER-ID SAMPLES
# ==============================================================================
def create_voter_id(filename, epic_no, name, relation_name, gender, age_or_dob, constituency, inconsistent_age=False, degraded=False):
    W, H = 1000, 640
    img = Image.new("RGB", (W, H), "#1e293b")
    draw = ImageDraw.Draw(img)

    # Header Bar
    draw.rectangle([0, 0, W, 75], fill="#15803d")
    f_h1 = get_font(23, bold=True)
    f_h2 = get_font(13, bold=True)
    draw.text((W // 2, 25), "DEMO ELECTION COMMISSION OF INDIA", fill="#ffffff", font=f_h1, anchor="mm")
    draw.text((W // 2, 53), "ELECTOR PHOTO IDENTITY CARD — SYNTHETIC DEMONSTRATION", fill="#dcfce7", font=f_h2, anchor="mm")

    draw_synthetic_watermark(draw, W, H)

    # Avatar
    draw_avatar_placeholder(draw, 50, 110, 200, 260, label="ELECTOR")

    # EPIC Number Badge
    draw.rectangle([W - 250, 100, W - 40, 145], fill="#022c22", outline="#22c55e", width=2)
    f_epic = get_font(20, bold=True, mono=True)
    draw.text((W - 145, 122), epic_no, fill="#4ade80", font=f_epic, anchor="mm")

    # Fields
    f_lbl = get_font(13, bold=True)
    f_val = get_font(18, bold=True)

    draw.text((290, 110), "Elector's Name", fill="#94a3b8", font=f_lbl)
    draw.text((290, 132), name, fill="#ffffff", font=f_val)

    draw.text((290, 180), "Father's / Husband's Name", fill="#94a3b8", font=f_lbl)
    draw.text((290, 202), relation_name, fill="#ffffff", font=f_val)

    draw.text((290, 250), "Gender", fill="#94a3b8", font=f_lbl)
    draw.text((290, 272), gender, fill="#ffffff", font=f_val)

    draw.text((550, 250), "Age / Date of Birth", fill="#94a3b8", font=f_lbl)
    color = "#ef4444" if inconsistent_age else "#ffffff"
    draw.text((550, 272), age_or_dob, fill=color, font=f_val)

    draw.text((290, 320), "Assembly Constituency No. & Name", fill="#94a3b8", font=f_lbl)
    draw.text((290, 342), constituency, fill="#ffffff", font=f_val)

    draw.text((290, 390), "Issuing Authority", fill="#94a3b8", font=f_lbl)
    draw.text((290, 412), "ELECTORAL REGISTRATION OFFICER, DEMO CONSTITUENCY", fill="#cbd5e1", font=get_font(14))

    if degraded:
        # Add glare highlight
        overlay = Image.new("RGBA", (W, H), (255, 255, 255, 0))
        o_draw = ImageDraw.Draw(overlay)
        o_draw.ellipse([W // 2 - 150, H // 2 - 150, W // 2 + 250, H // 2 + 250], fill=(255, 255, 255, 140))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
        img = img.filter(ImageFilter.GaussianBlur(radius=1.5))

    img.save(filename, "PNG")
    print(f"Generated: {filename}")

# VOT-001: Clean normal Voter ID
create_voter_id(
    os.path.join(VOTER_DIR, "vot_001.png"),
    epic_no="XYZ9876543",
    name="Sunil B. Deshmukh",
    relation_name="Balwant Deshmukh",
    gender="Male",
    age_or_dob="34 Years (DOB: 15/08/1990)",
    constituency="204 - Pune Cantonment"
)

# VOT-002: Inconsistent Age vs DOB
create_voter_id(
    os.path.join(VOTER_DIR, "vot_002.png"),
    epic_no="ABC1234567",
    name="Meera T. Nair",
    relation_name="Tarun Nair",
    gender="Female",
    age_or_dob="42 Years (DOB: 10/05/2004)",  # Age 42 vs Born in 2004 -> Math contradiction!
    constituency="189 - Shivajinagar",
    inconsistent_age=True
)

# VOT-003: Degraded optical quality (glare)
create_voter_id(
    os.path.join(VOTER_DIR, "vot_003.png"),
    epic_no="KTM8829104",
    name="Gaurav P. Shinde",
    relation_name="Prakash Shinde",
    gender="Male",
    age_or_dob="29 Years (DOB: 22/11/1995)",
    constituency="210 - Kothrud",
    degraded=True
)

print("All 12 synthetic demonstration documents generated successfully.")

