"""Tạo tranh biểu tượng và MP3 cho bài ngữ pháp A1."""

import asyncio
from pathlib import Path
from urllib.request import urlopen

import edge_tts


ROOT = Path(__file__).resolve().parents[1] / "public" / "grammar" / "foundation" / "a1"
SCENES = [
    ("There is a cat.", "1F408"),
    ("There are two cats.", "1F408"),
    ("I have an apple.", "1F34E"),
    ("The book is here.", "1F4D6"),
    ("I work every day.", "1F3E0"),
    ("She works every day.", "1F469"),
    ("I do not work today.", "1F6AB"),
    ("She does not work today.", "1F6AB"),
    ("Do you work here?", "2753"),
    ("Does she work here?", "2753"),
    ("I always drink water.", "1F4A7"),
    ("She is reading now.", "1F4D6"),
    ("They are playing now.", "26BD"),
    ("The book is on the table.", "1F4DA"),
    ("Come here.", "1F44B"),
    ("I can swim.", "1F3CA"),
]


async def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for index, (sentence, codepoint) in enumerate(SCENES, 1):
        image = ROOT / f"{index:02d}.svg"
        sound = ROOT / f"{index:02d}.mp3"
        if not image.exists():
            url = f"https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/{codepoint}.svg"
            with urlopen(url, timeout=20) as response:
                content = response.read()
            if b"<svg" not in content[:200]:
                raise ValueError(f"Invalid image: {url}")
            image.write_bytes(content)
        if not sound.exists() or sound.stat().st_size < 1000:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(sentence, "en-US-AriaNeural", rate="-15%").save(str(sound))
                    if sound.stat().st_size >= 1000:
                        break
                except edge_tts.exceptions.NoAudioReceived:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(1 + attempt)
        if image.stat().st_size < 500 or sound.stat().st_size < 1000:
            raise ValueError(f"Asset too small: {index:02d}")
        print(f"[GrammarA1] {index:02d}: SVG={image.stat().st_size} MP3={sound.stat().st_size}")


if __name__ == "__main__":
    asyncio.run(main())
