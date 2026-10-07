import asyncio
import base64
import os
import sys
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

profile_dir = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')
out_state = 'tmp/flow/flow_auth_state.json'
out_b64 = 'tmp/flow/flow_auth_secret_base64.txt'

async def main():
    print("=" * 60)
    print("EXPORTING GOOGLE FLOW SESSION FOR CLOUD RUNNER")
    print(f"Profile: {profile_dir}")
    print("=" * 60)

    if not os.path.exists(profile_dir):
        print(f"[ERROR] Chrome profile not found at {profile_dir}")
        return

    os.makedirs('tmp/flow', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch_persistent_context(profile_dir, headless=True, channel='chrome')
        page = await b.new_page()
        await page.goto('https://flow.google.com', wait_until='domcontentloaded')
        await asyncio.sleep(4)
        await b.storage_state(path=out_state)
        await b.close()

    raw_bytes = open(out_state, 'rb').read()
    b64_str = base64.b64encode(raw_bytes).decode('utf-8')
    with open(out_b64, 'w', encoding='utf-8') as f:
        f.write(b64_str)

    print(f"[OK] Exported storage state: {out_state} ({len(raw_bytes)} bytes)")
    print(f"[OK] Generated base64 secret: {out_b64} ({len(b64_str)} chars)")
    print("\n👉 CÁCH THIẾT LẬP CHẠY ONLINE TRÊN GITHUB ACTIONS:")
    print("1. Mở repo GitHub: https://github.com/FengProfessor/Vocab/settings/secrets/actions")
    print("2. Bấm 'New repository secret'")
    print("3. Tên Secret: FLOW_AUTH_STATE")
    print(f"4. Giá trị: Copy toàn bộ nội dung trong file '{out_b64}' dán vào.")
    print("5. Xong! Bạn có thể kích hoạt workflow và tắt máy đi ngủ!")

if __name__ == '__main__':
    asyncio.run(main())
