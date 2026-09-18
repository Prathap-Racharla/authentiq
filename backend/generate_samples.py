import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

os.makedirs("backend/demo_samples", exist_ok=True)
os.makedirs("public/demo_samples", exist_ok=True)


def create_clean_sample(path: str):
    """CASE A: Clean synthetic passport sample."""
    img = Image.new("RGB", (1000, 650), color=(15, 23, 42))  # Dark slate background
    draw = ImageDraw.Draw(img)

    # Document border / page
    draw.rectangle([40, 40, 960, 610], fill=(248, 250, 252), outline=(100, 116, 139), width=3)
    # Inner border / security line
    draw.rectangle([48, 48, 952, 602], outline=(203, 213, 225), width=1)

    # Header bar
    draw.rectangle([48, 48, 952, 110], fill=(30, 41, 59))
    draw.text((70, 65), "REPUBLIC OF INDIA / DEMO PASSPORT", fill=(248, 250, 252))

    # Photo placeholder
    draw.rectangle([70, 140, 260, 380], fill=(226, 232, 240), outline=(148, 163, 184), width=2)
    draw.text((100, 250), "[PHOTO DEMO]", fill=(100, 116, 139))

    # Text fields
    draw.text((300, 140), "Type: P   Country Code: IND   Passport No: IND-DEMO-9812-4019", fill=(15, 23, 42))
    draw.text((300, 180), "Surname: NAIR", fill=(15, 23, 42))
    draw.text((300, 220), "Given Name: SIDDHARTH R", fill=(15, 23, 42))
    draw.text((300, 260), "Nationality: REPUBLIC OF INDIA", fill=(15, 23, 42))
    draw.text((300, 300), "Sex: M   Date of Birth: 12/05/1996", fill=(15, 23, 42))
    draw.text((300, 340), "Date of Issue: 10/02/2020   Date of Expiry: 09/02/2030", fill=(15, 23, 42))

    # MRZ Zone (Bottom)
    draw.rectangle([48, 460, 952, 602], fill=(241, 245, 249), outline=(148, 163, 184), width=1)
    mrz_line1 = "P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<"
    mrz_line2 = "98124019<8IND9605121M3002094<<<<<<<<<<<<<<<6"
    draw.text((80, 490), mrz_line1, fill=(15, 23, 42))
    draw.text((80, 535), mrz_line2, fill=(15, 23, 42))

    img.save(path)


def create_degraded_sample(path: str):
    """CASE B: Degraded synthetic sample with blur and specular glare."""
    img = Image.new("RGB", (1000, 650), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)

    draw.rectangle([40, 40, 960, 610], fill=(245, 245, 245), outline=(120, 120, 120), width=2)
    draw.rectangle([48, 48, 952, 110], fill=(45, 55, 72))
    draw.text((70, 65), "REPUBLIC OF INDIA / DEMO PASSPORT", fill=(240, 240, 240))

    draw.rectangle([70, 140, 260, 380], fill=(210, 215, 220), outline=(140, 140, 140), width=2)
    draw.text((100, 250), "[PHOTO DEMO]", fill=(120, 120, 120))

    draw.text((300, 140), "Type: P   Country Code: IND   Passport No: IND-DEMO-9812-4019", fill=(30, 30, 30))
    draw.text((300, 180), "Surname: NAIR", fill=(30, 30, 30))
    draw.text((300, 220), "Given Name: SIDDHARTH R", fill=(30, 30, 30))
    draw.text((300, 260), "Nationality: REPUBLIC OF INDIA", fill=(30, 30, 30))
    draw.text((300, 300), "Sex: M   Date of Birth: 12/05/1996", fill=(30, 30, 30))
    draw.text((300, 340), "Date of Issue: 10/02/2020   Date of Expiry: 09/02/2030", fill=(30, 30, 30))

    draw.rectangle([48, 460, 952, 602], fill=(235, 235, 240))
    draw.text((80, 490), "P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<", fill=(40, 40, 40))
    draw.text((80, 535), "98124019<8IND9605121M3002094<<<<<<<<<<<<<<<6", fill=(40, 40, 40))

    # Apply moderate blur
    img = img.filter(ImageFilter.GaussianBlur(radius=2.2))

    # Add realistic specular glare hotspot (top-right overlay)
    overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw_ov = ImageDraw.Draw(overlay)
    draw_ov.ellipse([450, 100, 850, 380], fill=(255, 255, 255, 175))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=25))
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    img.save(path)


def create_inconsistent_sample(path: str):
    """CASE C: Inconsistent synthetic sample with OCR vs MRZ DOB mismatch and bad check digit."""
    img = Image.new("RGB", (1000, 650), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)

    draw.rectangle([40, 40, 960, 610], fill=(248, 250, 252), outline=(100, 116, 139), width=3)
    draw.rectangle([48, 48, 952, 110], fill=(30, 41, 59))
    draw.text((70, 65), "REPUBLIC OF INDIA / DEMO PASSPORT", fill=(248, 250, 252))

    draw.rectangle([70, 140, 260, 380], fill=(226, 232, 240), outline=(148, 163, 184), width=2)
    draw.text((100, 250), "[PHOTO DEMO]", fill=(100, 116, 139))

    # Visual DOB is 12/05/1996
    draw.text((300, 140), "Type: P   Country Code: IND   Passport No: IND-DEMO-9812-4019", fill=(15, 23, 42))
    draw.text((300, 180), "Surname: NAIR", fill=(15, 23, 42))
    draw.text((300, 220), "Given Name: SIDDHARTH R", fill=(15, 23, 42))
    draw.text((300, 260), "Nationality: REPUBLIC OF INDIA", fill=(15, 23, 42))
    draw.text((300, 300), "Sex: M   Date of Birth: 12/05/1996", fill=(15, 23, 42))
    draw.text((300, 340), "Date of Issue: 10/02/2020   Date of Expiry: 09/02/2030", fill=(15, 23, 42))

    # Encoded MRZ has contradictory DOB (940814 = 14/08/1994) and deliberately corrupted check digit '9'
    draw.rectangle([48, 460, 952, 602], fill=(241, 245, 249), outline=(148, 163, 184), width=1)
    draw.text((80, 490), "P<INDNAIR<<SIDDHARTH<R<<<<<<<<<<<<<<<<<<<<<<", fill=(15, 23, 42))
    draw.text((80, 535), "98124019<8IND9408149M3002094<<<<<<<<<<<<<<<2", fill=(15, 23, 42))

    img.save(path)


create_clean_sample("backend/demo_samples/clean_passport_demo.png")
create_clean_sample("public/demo_samples/clean_passport_demo.png")

create_degraded_sample("backend/demo_samples/degraded_glare_demo.png")
create_degraded_sample("public/demo_samples/degraded_glare_demo.png")

create_inconsistent_sample("backend/demo_samples/inconsistent_mrz_mismatch_demo.png")
create_inconsistent_sample("public/demo_samples/inconsistent_mrz_mismatch_demo.png")

print("Generated 3 synthetic test samples in backend/demo_samples and public/demo_samples")
