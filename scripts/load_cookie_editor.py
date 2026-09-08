import os
import sys
import io
import json
import glob

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

STATE_PATH = os.path.join(os.path.dirname(__file__), "..", "crawlers", "toeic", "study4_state.json")

def convert_cookie_editor(input_path: str):
    with open(input_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    raw_cookies = []
    if isinstance(raw, dict):
        raw_cookies = raw.get("cookies", [])
    elif isinstance(raw, list):
        raw_cookies = raw

    converted = []
    for c in raw_cookies:
        name = c.get("name")
        value = c.get("value")
        domain = c.get("domain", "study4.com")
        if not name or value is None:
            continue

        same_site_raw = str(c.get("sameSite", "Lax")).lower()
        if "strict" in same_site_raw:
            same_site = "Strict"
        elif "none" in same_site_raw or "no_restriction" in same_site_raw:
            same_site = "None"
        else:
            same_site = "Lax"

        converted.append({
            "name": name,
            "value": value,
            "domain": domain,
            "path": c.get("path", "/"),
            "expires": c.get("expirationDate", c.get("expires", -1)),
            "httpOnly": c.get("httpOnly", False),
            "secure": c.get("secure", True),
            "sameSite": same_site
        })

    out_state = {
        "cookies": converted,
        "origins": [
            {
                "origin": "https://study4.com",
                "localStorage": []
            }
        ]
    }

    with open(STATE_PATH, 'w', encoding='utf-8') as f:
        json.dump(out_state, f, indent=2, ensure_ascii=False)

    print(f"✅ Đã chuyển đổi thành công {len(converted)} cookies từ {input_path}")
    print(f"📁 Đã cập nhật file: {STATE_PATH}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        # Check if any study4 file in Downloads
        downloads = glob.glob(r"D:\Download\*study4*.json") + glob.glob(os.path.expanduser(r"~\Downloads\*study4*.json"))
        if downloads:
            target = downloads[0]
        else:
            print("❌ Vui lòng truyền đường dẫn file cookie json!")
            sys.exit(1)

    convert_cookie_editor(target)
