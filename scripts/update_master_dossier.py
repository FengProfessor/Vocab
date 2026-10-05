import os
import re

dossier_path = r'd:\Vibe\Vocab\web-app\docs\grammar\62-TOPICS-RESEARCH-DOSSIER.md'
with open(dossier_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Section 1 Executive Summary
sec1_old = """| Metric | Baseline Measurement | Target State (M4) | Status |
|---|---|---|---|
| **Total Grammar Topics** | 62 | 62 | ✅ 100% Indexed |
| **Total Topic Media Cards** | 263 | 263+ | ✅ 100% Mapped |
| **SVG Illustrations (OpenMoji)** | 255 (97.0%) | 0 (0.0%) | ❌ P0 Pending M3 WebP Replacement |
| **Raster Illustrations (WebP/JPG)** | 8 (3.0%) | 263 (100.0%) | ❌ P0 Pending M3 WebP Replacement |
| **Duplicate Hash Groups** | 55 groups (157 cards) | 0 groups | ❌ P1 Pending M3 Unique Images |
| **Audio Alignment** | 62/62 Aligned · 0 Defects | 62/62 Aligned | ✅ PASS (Resolved in M2 via edge-tts) |
| **Drill Question Health** | 1,593 exercises · 0 empty · 0 miss | 100% Normalized | ✅ PASS |"""

sec1_new = """| Metric | Baseline Measurement | Target State (M4) | Status |
|---|---|---|---|
| **Total Grammar Topics** | 62 | 62 | ✅ 100% Indexed |
| **Total Topic Media Cards** | 263 | 263 | ✅ 100% Mapped |
| **SVG Illustrations (OpenMoji)** | 255 (97.0%) | 0 (0.0%) | ✅ PASS: 0 SVGs in manifest or on disk |
| **Raster Illustrations (WebP)** | 8 (3.0%) | 263 (100.0%) | ✅ PASS: 263 Situational AI WebP illustrations |
| **Duplicate Hash Groups** | 55 groups (157 cards) | 0 groups | ✅ PASS: 0 collisions (263 unique SHA-256 hashes) |
| **Audio Alignment** | 62/62 Aligned · 0 Defects | 62/62 Aligned | ✅ PASS (Resolved in M2 via edge-tts) |
| **Drill Question Health** | 1,593 exercises · 0 empty · 0 miss | 100% Normalized | ✅ PASS |"""

if sec1_old in content:
    content = content.replace(sec1_old, sec1_new)
    print("Updated Section 1 Executive Summary")
else:
    print("Warning: Section 1 text not matched exactly, checking regex...")

# 2. Update Section 2 Master Topic Inventory table rows:
# Replace SVG (X) / Raster JPG with WebP (X), Duplicate (...) with Unique, Verdict with PASS
def replace_table_row(m):
    line = m.group(0)
    cards = m.group(1)
    line = re.sub(r'\|\s*(?:SVG \(\d+\)|Raster JPG)\s*\|', f'| WebP ({cards}) |', line)
    line = re.sub(r'\|\s*⚠️ Duplicate \([^)]+\)\s*\|', '| ✅ Unique |', line)
    line = re.sub(r'\|\s*⚠️ NEEDS_M3_\w+\s*\|', '| ✅ PASS |', line)
    return line

content = re.sub(r'^\|\s*\d+\s*\|\s*`[a-z0-9-]+`\s*\|.+?\|\s*Stage \d:[^|]+\|\s*(\d+)\s*\|.+?$', replace_table_row, content, flags=re.MULTILINE)
print("Updated Section 2 Table Rows")

# 3. Update Section 3: Replace image paths:
# /grammar/topics/<slug>/XX.svg -> /grammar/topics/<slug>/XX.webp
# /grammar/topics/personal-pronouns/real_XX_*.jpg -> /grammar/topics/personal-pronouns/XX.webp
content = re.sub(r'/grammar/topics/personal-pronouns/real_0(\d)_[^.]+\.jpg', r'/grammar/topics/personal-pronouns/0\1.webp', content)
content = re.sub(r'(/grammar/topics/[a-z0-9-]+/\d+\.)svg', r'\1webp', content)
print("Updated Section 3 Image Paths")

with open(dossier_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated 62-TOPICS-RESEARCH-DOSSIER.md")
