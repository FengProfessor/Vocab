import os
import glob
import json
import hashlib
import datetime
from PIL import Image

ROOT_DIR = r'd:\Vibe\Vocab\web-app'
BRAIN_DIR = r'C:\Users\tapho\.gemini\antigravity\brain\7af49fdd-897d-4628-b18f-588b365cc28a'
TARGETS_PATH = os.path.join(ROOT_DIR, '.agents', 'teamwork', 'explorer_m3_audit_remediation', 'remediation_targets_114.json')

with open(TARGETS_PATH, 'r', encoding='utf-8') as f:
    targets = json.load(f)

verified_count = 0
converted_count = 0
unmatched_count = 0

special_map = {
    0: 'sample_test_01',
    1: 'sample_test_02'
}

results = []

for idx, t in enumerate(targets):
    card_id = t['card_id']
    target_rel = t['file_path']
    target_abs = os.path.join(ROOT_DIR, target_rel)
    baseline_hash = t['current_disk_sha256']
    baseline_mtime = t['current_disk_mtime']
    
    # Check if target already has an updated hash on disk
    disk_hash = None
    disk_mtime = None
    if os.path.exists(target_abs):
        with open(target_abs, 'rb') as f:
            disk_hash = hashlib.sha256(f.read()).hexdigest()
        mtime_dt = datetime.datetime.fromtimestamp(os.path.getmtime(target_abs), datetime.timezone.utc)
        disk_mtime = mtime_dt.isoformat()
    
    # Look for candidate image in brain dir
    patterns = [
        os.path.join(BRAIN_DIR, f"rem_{idx:03d}_*.jpg"),
        os.path.join(BRAIN_DIR, f"rem_{idx:03d}_*.png"),
        os.path.join(BRAIN_DIR, f"card_{card_id.replace('-', '_')}_*.jpg"),
    ]
    if idx in special_map:
        patterns.append(os.path.join(BRAIN_DIR, f"{special_map[idx]}_*.jpg"))
    
    candidate_files = []
    for p in patterns:
        candidate_files.extend(glob.glob(p))
    
    if candidate_files:
        # Sort by modification time, newest first
        candidate_files.sort(key=os.path.getmtime, reverse=True)
        chosen_src = candidate_files[0]
        src_mtime = os.path.getmtime(chosen_src)
        
        # Check if disk file needs update
        needs_convert = False
        if disk_hash == baseline_hash:
            needs_convert = True
        elif not os.path.exists(target_abs):
            needs_convert = True
        elif os.path.getmtime(target_abs) < src_mtime:
            needs_convert = True
            
        if needs_convert:
            os.makedirs(os.path.dirname(target_abs), exist_ok=True)
            with Image.open(chosen_src) as img:
                res = img.convert('RGB').resize((800, 500), Image.Resampling.LANCZOS)
                res.save(target_abs, format='WEBP', quality=85)
            converted_count += 1
            with open(target_abs, 'rb') as f:
                disk_hash = hashlib.sha256(f.read()).hexdigest()
            mtime_dt = datetime.datetime.fromtimestamp(os.path.getmtime(target_abs), datetime.timezone.utc)
            disk_mtime = mtime_dt.isoformat()
    
    # Check verification status
    is_verified = (
        disk_hash is not None and
        disk_hash != baseline_hash and
        os.path.getsize(target_abs) > 10000 and
        disk_mtime > baseline_mtime
    )
    
    if is_verified:
        verified_count += 1
    else:
        unmatched_count += 1
        
    results.append({
        'index': idx,
        'card_id': card_id,
        'file_path': target_rel,
        'verified': is_verified,
        'disk_hash': disk_hash,
        'baseline_hash': baseline_hash,
        'disk_mtime': disk_mtime,
        'baseline_mtime': baseline_mtime
    })

print(f"=== Remediation Sync Status ===")
print(f"Total targets : {len(targets)}")
print(f"Verified      : {verified_count}/114")
print(f"Newly Converted: {converted_count}")
print(f"Remaining     : {unmatched_count}/114")

if unmatched_count > 0:
    missing_indices = [r['index'] for r in results if not r['verified']]
    print(f"Next 10 missing indices: {missing_indices[:10]}")
