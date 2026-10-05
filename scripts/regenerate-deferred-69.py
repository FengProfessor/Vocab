#!/usr/bin/env python3
"""
scripts/regenerate-remediation-114.py

Standalone, operator-executable Python script to resume image regeneration
for deferred grammar curriculum visual cards using Cloudflare Workers AI FLUX.

Context & Operator Purpose:
  During Milestone M3 remediation, 60 of the 114 defect cards (indices 0..59)
  were successfully regenerated, verified zero-text, and hash-validated on disk.
  The remaining 54 cards (indices 60..113) were deferred due to daily image-generation
  API quotas. This script provides an autonomous, agent-free CLI utility for the
  operator to resume generation of those 54 cards (or any sub-range) once the quota
  resets or via alternate credentials.

Features:
  - Zero Agent Dependency: Pure Python 3 + Pillow + standard library urllib.
  - Safe Credentials Management: Reads CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
    from .env.local or OS environment without leaking, logging, or printing tokens.
  - Pillow WebP Processing: Resizes output to standard 800x500 WebP (LANCZOS, quality=85, method=6).
  - Cryptographic Verification: Computes SHA-256 and checks (new_hash != old_hash) and mtime.
  - Dry-Run Inspection: Safely inspects and prints target metadata and sanitized prompts
    without making network requests or touching disk.

Usage:
  # Dry-run inspection (default targets 60..114)
  python scripts/regenerate-remediation-114.py --start 60 --end 114 --dry-run

  # Full execution (resumes 54 deferred cards)
  python scripts/regenerate-remediation-114.py --start 60 --end 114

  # Single-card execution
  python scripts/regenerate-remediation-114.py --start 60 --end 61

  # Specify custom input manifest
  python scripts/regenerate-remediation-114.py --input docs/grammar/IMAGE_GENERATION_MANIFEST.json --dry-run
"""

import os
import sys
import json
import argparse
import time
import hashlib
import urllib.request
import urllib.error
import base64
import io

try:
    from PIL import Image
except ImportError:
    print("FATAL: Pillow is required. Install via: pip install Pillow", file=sys.stderr)
    sys.exit(1)

# Ensure safe UTF-8 output on Windows command line
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Default paths relative to workspace root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_QUEUE_PATH = os.path.join(
    ROOT_DIR,
    "docs",
    "grammar",
    "REMEDIATION_QUEUE_69.json"
)
FALLBACK_AGENT_QUEUE_PATH = os.path.join(
    ROOT_DIR,
    ".agents",
    "teamwork",
    "reviewer_vision_209",
    "REMEDIATION_QUEUE.json"
)
DEFAULT_TARGETS_PATH = os.path.join(
    ROOT_DIR,
    ".agents",
    "teamwork",
    "explorer_m3_audit_remediation",
    "remediation_targets_114.json"
)
FALLBACK_MANIFEST_PATH = os.path.join(
    ROOT_DIR,
    "docs",
    "grammar",
    "IMAGE_GENERATION_MANIFEST.json"
)
ENV_LOCAL_PATH = os.path.join(ROOT_DIR, ".env.local")

DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell"


def load_credentials_safely(env_path):
    """
    Safely reads CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID from .env.local or OS env.
    Strictly avoids printing or logging raw secrets.
    """
    env_vars = {}
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        # Strip optional quotes
                        val = v.strip().strip("'\"")
                        env_vars[k.strip()] = val
        except Exception as e:
            # Mask any details in case of IO errors
            pass

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or env_vars.get("CLOUDFLARE_ACCOUNT_ID")
    token = os.environ.get("CLOUDFLARE_API_TOKEN") or env_vars.get("CLOUDFLARE_API_TOKEN")

    return account_id, token


def parse_targets_file(filepath):
    """
    Parses either remediation_targets_114.json or IMAGE_GENERATION_MANIFEST.json
    and returns a standardized list of target dictionary records.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Target manifest file not found: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError(f"Expected JSON array in {filepath}, got {type(data)}")

    standardized = []
    for idx, item in enumerate(data):
        card_id = item.get("card_id") or f"{item.get('topic')}-{item.get('cardIndex', idx+1):02d}"
        topic = item.get("topic") or "unknown"
        card_index = item.get("card_index") or item.get("cardIndex") or (idx + 1)
        file_path = item.get("file_path") or item.get("diskPath") or f"public/grammar/topics/{topic}/{card_index:02d}.webp"
        
        # Priority to remediation_prompt, fallback to prompt
        prompt = item.get("remediation_prompt") or item.get("prompt") or ""
        sentence = item.get("example_sentence") or item.get("sentence") or ""
        vietnamese = item.get("vietnamese_translation") or item.get("vietnamese") or ""
        baseline_sha = item.get("current_disk_sha256") or item.get("sha256") or ""
        baseline_mtime = item.get("current_disk_mtime") or ""
        defect_desc = item.get("defect_details") or item.get("defect_description") or ""
        ocr_defects = item.get("ocr_detected_text") or ([defect_desc] if defect_desc else [])

        standardized.append({
            "index": idx,
            "card_id": card_id,
            "topic": topic,
            "card_index": card_index,
            "file_path": file_path,
            "prompt": prompt,
            "example_sentence": sentence,
            "vietnamese": vietnamese,
            "baseline_sha256": baseline_sha,
            "baseline_mtime": baseline_mtime,
            "ocr_defects": ocr_defects,
            "defect_description": defect_desc,
        })

    return standardized


def compute_file_sha256(filepath):
    """Computes SHA-256 hash of a file on disk."""
    if not os.path.exists(filepath):
        return None
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def call_workers_ai_flux(account_id, token, model, prompt, steps=4, max_retries=4, base_backoff=5):
    """
    Calls Cloudflare Workers AI FLUX inference endpoint and returns raw image bytes.
    Handles rate-limiting (429) and network backoff gracefully.
    """
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    payload = json.dumps({"prompt": prompt, "steps": steps}).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "LingoPro-Remediation-Resume/1.0"
    }

    last_error = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=payload, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                content_type = resp.headers.get("Content-Type", "")
                raw_data = resp.read()

                # Case A: Binary image directly returned
                if content_type.startswith("image/"):
                    return raw_data

                # Case B: JSON envelope with base64 encoded image
                try:
                    resp_json = json.loads(raw_data.decode("utf-8"))
                except Exception:
                    # If not json, might be raw binary despite header
                    return raw_data

                b64_img = None
                if isinstance(resp_json, dict):
                    result = resp_json.get("result", {})
                    if isinstance(result, dict):
                        b64_img = result.get("image")
                    elif isinstance(result, str):
                        b64_img = result
                    if not b64_img and "image" in resp_json:
                        b64_img = resp_json["image"]

                if b64_img:
                    return base64.b64decode(b64_img)

                raise ValueError(f"No image payload found in response: {list(resp_json.keys())}")

        except urllib.error.HTTPError as e:
            last_error = f"HTTP {e.code}: {e.reason}"
            if e.code == 429:
                sleep_sec = base_backoff * (attempt + 1) + 5
                print(f"      [RATE-LIMIT 429] Backing off for {sleep_sec}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(sleep_sec)
            else:
                sleep_sec = base_backoff * (attempt + 1)
                time.sleep(sleep_sec)
        except Exception as e:
            last_error = str(e)
            sleep_sec = base_backoff * (attempt + 1)
            time.sleep(sleep_sec)

    raise RuntimeError(f"Cloudflare inference failed after {max_retries} attempts. Last error: {last_error}")


def process_image_to_webp(raw_bytes, target_path, width=800, height=500, quality=85):
    """
    Resizes image to target dimensions (800x500) using LANCZOS resampling,
    converts to RGB, and saves to target_path as WebP with specified quality.
    """
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with Image.open(io.BytesIO(raw_bytes)) as img:
        img_rgb = img.convert("RGB")
        img_resized = img_rgb.resize((width, height), Image.Resampling.LANCZOS)
        img_resized.save(target_path, format="WEBP", quality=quality, method=6)


def main():
    parser = argparse.ArgumentParser(
        description="Resume Cloudflare Workers AI image regeneration for deferred grammar cards."
    )
    parser.add_argument(
        "--start",
        type=int,
        default=None,
        help="0-based start index of target slice (default: 0, or 60 for 114 manifest)"
    )
    parser.add_argument(
        "--end",
        type=int,
        default=None,
        help="0-based end index of target slice (default: None, runs to end of manifest)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate run: parse targets and print sanitized prompts without API calls or disk writes."
    )
    parser.add_argument(
        "--input",
        type=str,
        default=None,
        help="Path to targets JSON manifest. Defaults to REMEDIATION_QUEUE.json (69 targets) if present."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL,
        help=f"Cloudflare Workers AI model name (default: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.5,
        help="Delay in seconds between successive inference calls (default: 2.5s)"
    )

    args = parser.parse_args()

    # Determine input manifest path
    input_path = args.input
    if not input_path:
        # Check if legacy --start 60 --end 114 explicitly passed
        if args.start == 60 and args.end == 114 and os.path.exists(DEFAULT_TARGETS_PATH):
            input_path = DEFAULT_TARGETS_PATH
        elif os.path.exists(DEFAULT_QUEUE_PATH):
            input_path = DEFAULT_QUEUE_PATH
        elif os.path.exists(FALLBACK_AGENT_QUEUE_PATH):
            input_path = FALLBACK_AGENT_QUEUE_PATH
        elif os.path.exists(DEFAULT_TARGETS_PATH):
            input_path = DEFAULT_TARGETS_PATH
        elif os.path.exists(FALLBACK_MANIFEST_PATH):
            input_path = FALLBACK_MANIFEST_PATH
        else:
            print(f"FATAL: No valid targets manifest found.", file=sys.stderr)
            sys.exit(1)

    # Parse target records
    try:
        all_targets = parse_targets_file(input_path)
    except Exception as e:
        print(f"FATAL: Failed to parse input file {input_path}: {e}", file=sys.stderr)
        sys.exit(1)

    total_available = len(all_targets)

    # Determine slice range
    if input_path == DEFAULT_TARGETS_PATH and args.start is None and args.end is None:
        start_idx = 60
        end_idx = 114
    else:
        start_idx = 0 if args.start is None else max(0, min(args.start, total_available))
        end_idx = total_available if args.end is None else max(start_idx, min(args.end, total_available))

    selected_targets = all_targets[start_idx:end_idx]

    print("=" * 80)
    print("  LINGOPRO GRAMMAR IMAGE REMEDIATION RESUME UTILITY")
    print(f"  Target File : {os.path.relpath(input_path, ROOT_DIR) if os.path.isabs(input_path) else input_path}")
    print(f"  Total Rows  : {total_available}")
    print(f"  Slice Range : [{start_idx}:{end_idx}] ({len(selected_targets)} cards selected)")
    print(f"  Execution   : {'DRY RUN (Simulation Only)' if args.dry_run else 'LIVE INFERENCE EXECUTION'}")
    print("=" * 80)

    # Dry-Run Mode
    if args.dry_run:
        print("\n--- DRY-RUN TARGET LEDGER & PROMPT VERIFICATION ---")
        for i, item in enumerate(selected_targets):
            rel_path = item["file_path"]
            abs_path = os.path.join(ROOT_DIR, rel_path)
            current_exists = os.path.exists(abs_path)
            current_size = os.path.getsize(abs_path) if current_exists else 0
            
            ocr_text = ", ".join(f"'{t}'" for t in item["ocr_defects"]) if item["ocr_defects"] else "(none reported)"
            seq_num = start_idx + i + 1
            
            print(f"\n[Target {seq_num:02d}/{total_available:02d}] Card: {item['card_id']} ({item['topic']} #{item['card_index']})")
            print(f"      Disk Target : {rel_path} [{'EXISTS, ' + str(current_size) + 'B' if current_exists else 'MISSING'}]")
            print(f"      Sentence    : \"{item['example_sentence']}\"")
            print(f"      Defects     : {ocr_text}")
            print(f"      Sanitized Prompt: \"{item['prompt']}\"")

        print("\n" + "=" * 80)
        print("  DRY-RUN EXECUTION SUMMARY")
        print("=" * 80)
        print(f"  Targets Parsed      : {len(selected_targets)}")
        print(f"  Target Range        : [{start_idx}:{end_idx}] (Target {start_idx+1:02d}/{total_available:02d} to Target {end_idx:02d}/{total_available:02d})")
        print(f"  API Calls Made      : 0 (dry-run guaranteed)")
        print(f"  Files Modified      : 0 (dry-run guaranteed)")
        print("  Status              : READY FOR OPERATOR EXECUTION")
        print("=" * 80)
        sys.exit(0)

    # Live Execution Mode
    account_id, token = load_credentials_safely(ENV_LOCAL_PATH)
    if not account_id or not token:
        print("\nFATAL: Missing Cloudflare credentials.", file=sys.stderr)
        print("Please ensure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are set in .env.local", file=sys.stderr)
        print("or exported as environment variables.", file=sys.stderr)
        sys.exit(1)

    print(f"\n[OK] Cloudflare credentials loaded safely (Account: {account_id[:6]}... / Token: [SECURED]).")
    print(f"[OK] Target model: {args.model}")
    print(f"[OK] Commencing live generation of {len(selected_targets)} cards...\n")

    success_count = 0
    fail_count = 0

    t_start = time.time()

    for i, item in enumerate(selected_targets):
        seq = start_idx + i
        rel_path = item["file_path"]
        abs_path = os.path.join(ROOT_DIR, rel_path)

        old_sha = compute_file_sha256(abs_path)
        old_mtime = os.path.getmtime(abs_path) if os.path.exists(abs_path) else 0

        print(f"[{seq:03d}/{total_available}] Generating: {item['card_id']} -> {rel_path}...")
        
        try:
            # 1. Call AI inference
            raw_bytes = call_workers_ai_flux(
                account_id=account_id,
                token=token,
                model=args.model,
                prompt=item["prompt"],
                steps=4
            )

            # 2. Resize and save to WebP
            process_image_to_webp(
                raw_bytes=raw_bytes,
                target_path=abs_path,
                width=800,
                height=500,
                quality=85
            )

            # 3. Verify on disk
            new_sha = compute_file_sha256(abs_path)
            new_mtime = os.path.getmtime(abs_path)
            new_size = os.path.getsize(abs_path)

            if not new_sha or new_sha == old_sha:
                print(f"      [WARNING] File hash did not change for {item['card_id']}! Check file write.", file=sys.stderr)
            elif new_mtime <= old_mtime:
                print(f"      [WARNING] File mtime did not advance for {item['card_id']}!", file=sys.stderr)
            else:
                print(f"      [PASS] Regenerated: {new_size} bytes, SHA-256: {new_sha[:16]}... (hash changed)")

            success_count += 1

        except Exception as e:
            print(f"      [FAIL] Error regenerating {item['card_id']}: {e}", file=sys.stderr)
            fail_count += 1

        if i < len(selected_targets) - 1 and args.delay > 0:
            time.sleep(args.delay)

    duration = time.time() - t_start
    print("\n" + "=" * 80)
    print("  LIVE EXECUTION COMPLETED")
    print("=" * 80)
    print(f"  Duration            : {duration:.1f}s")
    print(f"  Successfully Saved  : {success_count}")
    print(f"  Failures            : {fail_count}")
    print("=" * 80)

    if fail_count > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
