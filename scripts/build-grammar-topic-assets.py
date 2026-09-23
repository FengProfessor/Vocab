"""Lưu hình OpenMoji và MP3 cho tình huống mẫu của 62 chủ đề ngữ pháp.

Nguồn hình: https://github.com/hfg-gmuend/openmoji, CC BY-SA 4.0.
Âm thanh: edge-tts en-US-AriaNeural; nội dung câu từ lesson JSON của dự án.
"""

import asyncio
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "grammar-gen" / "out"
MEDIA = ROOT / "public" / "grammar" / "topics"
MANIFEST = ROOT / "src" / "data" / "grammar-topic-assets.json"
SEMAPHORE = asyncio.Semaphore(8)


def emoji_code(icon: str) -> str:
    keycap = "\u20e3" in icon
    return "-".join(f"{ord(char):04X}" for char in icon if keycap or ord(char) not in (0xFE0F, 0xFE0E))


def fetch_svg(icon: str) -> bytes | None:
    code = emoji_code(icon)
    url = f"https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/{code}.svg"
    try:
        with urlopen(url, timeout=25) as response:
            content = response.read()
        return content if b"<svg" in content[:200] else None
    except (HTTPError, TimeoutError, OSError):
        return None


async def build_card(slug: str, number: int, icon: str, sentence: str) -> dict[str, str | None]:
    folder = MEDIA / slug
    folder.mkdir(parents=True, exist_ok=True)
    basename = f"{number:02d}"
    image_path = folder / f"{basename}.svg"
    audio_path = folder / f"{basename}.mp3"
    async with SEMAPHORE:
        if not image_path.exists() and icon:
            payload = await asyncio.to_thread(fetch_svg, icon)
            if payload:
                image_path.write_bytes(payload)
        for attempt in range(3):
            if audio_path.exists() and audio_path.stat().st_size > 1000:
                break
            try:
                await edge_tts.Communicate(sentence, "en-US-AriaNeural", rate="-15%").save(str(audio_path))
                if audio_path.stat().st_size > 1000:
                    break
            except Exception:
                if attempt == 2:
                    break
                await asyncio.sleep(2 * (attempt + 1))
    return {
        "image": f"/grammar/topics/{slug}/{basename}.svg" if image_path.exists() else None,
        "audio": f"/grammar/topics/{slug}/{basename}.mp3" if audio_path.exists() and audio_path.stat().st_size > 1000 else None,
    }


async def main() -> None:
    lessons = [json.loads(path.read_text(encoding="utf-8")) for path in OUT.glob("*.json")]
    lessons.sort(key=lambda item: item["order"])
    jobs = []
    layout: list[tuple[str, int]] = []
    for lesson in lessons:
        slug = lesson["slug"]
        usage = lesson.get("sections", {}).get("usage", [])
        for index, card in enumerate(usage, start=1):
            jobs.append(build_card(slug, index, card.get("icon", ""), card.get("en", "")))
            layout.append((slug, index))
    results = await asyncio.gather(*jobs)
    manifest: dict[str, list[dict[str, str | None]]] = {}
    for (slug, _), result in zip(layout, results, strict=True):
        manifest.setdefault(slug, []).append(result)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    images = sum(bool(card["image"]) for cards in manifest.values() for card in cards)
    audio = sum(bool(card["audio"]) for cards in manifest.values() for card in cards)
    print(f"[GrammarTopicAssets] topics={len(manifest)} cards={len(results)} images={images} audio={audio}")


if __name__ == "__main__":
    asyncio.run(main())
