"""Tạo asset cố định cho bài ngữ pháp A0; chạy lại khi sửa câu mẫu.

Yêu cầu: pip install edge-tts. Tranh OpenMoji CC BY-SA 4.0; xem ATTRIBUTION.md.
"""

import asyncio
from pathlib import Path
from urllib.request import urlopen

import edge_tts


ROOT = Path(__file__).resolve().parents[1] / "public" / "grammar" / "foundation" / "a0"
VOICE = "en-US-AriaNeural"
SCENES = [
    ("I am Mai.", "1F9D1"),
    ("You are Nam.", "1F44B"),
    ("She is Lan.", "1F469"),
    ("He is Minh.", "1F468"),
    ("It is an apple.", "1F34E"),
    ("It is a book.", "1F4DA"),
    ("I am happy.", "1F60A"),
    ("She is happy.", "1F642"),
    ("I am not sad.", "1F61F"),
    ("Are you Nam?", "2753"),
    ("Yes, I am.", "2705"),
    ("No, I am not.", "1F6AB"),
    ("This is a book.", "1F4D6"),
    ("That is a house.", "1F3E0"),
    ("These are books.", "1F4DA"),
    ("Those are apples.", "1F34E"),
    ("This is my book.", "1F4D3"),
    ("That is your bag.", "1F392"),
    ("This is his dog.", "1F415"),
    ("That is her cat.", "1F408"),
    ("I have a bag.", "1F45C"),
    ("She has a bag.", "1F392"),
    ("What is this?", "2754"),
    ("Where is my book?", "1F4CD"),
]


async def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for index, (sentence, codepoint) in enumerate(SCENES, start=1):
        image = ROOT / f"{index:02d}.svg"
        sound = ROOT / f"{index:02d}.mp3"
        if not image.exists():
            url = f"https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/{codepoint}.svg"
            with urlopen(url, timeout=20) as response:
                payload = response.read()
            if not payload.lstrip().startswith(b"<svg") and b"<svg" not in payload[:200]:
                raise ValueError(f"Invalid SVG: {url}")
            image.write_bytes(payload)
        if not sound.exists():
            await edge_tts.Communicate(sentence, VOICE, rate="-15%").save(str(sound))
        if image.stat().st_size < 500 or sound.stat().st_size < 1000:
            raise ValueError(f"Asset too small: {index:02d}")
        print(f"[GrammarAssets] {index:02d}: {image.stat().st_size} B SVG, {sound.stat().st_size} B MP3")


if __name__ == "__main__":
    asyncio.run(main())
