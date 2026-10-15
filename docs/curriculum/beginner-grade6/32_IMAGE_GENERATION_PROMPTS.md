# 32. Structured Image Generation Prompts (Pilot Foundation Set)

> **Course**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo, Pre-A1)  
> **Batch**: Pilot Set 1 (18 High-Priority Foundation Visuals)  
> **Status**: Production Ready for Image Generation Engine  
> **Art Direction Standard**: Modern Educational Illustration (Semi-Flat Vector / Editorial Line Art)  

---

## Technical Generation Parameters (Global Preset)

When executing through the image generation pipeline (e.g. Cloudflare Flux-1-schnell, SDXL, or OpenAI ImageGen), apply the following global parameters:
- **Default Aspect Ratio**: `1:1` ($1024 \times 1024$ px) for flashcard items; `16:9` ($1536 \times 864$ px) for contextual scenes.
- **Global Style Anchor**: `Modern educational illustration, crisp charcoal line art, clean semi-flat vector aesthetic, smooth pastel gradients, vibrant yet natural color palette, dignified adolescent proportions, high visual clarity`.
- **Global Negative Prompt**: `text, letters, words, writing, numbers, typography, watermarks, brand logos, photorealistic 35mm photograph, chibi, babyish toddler 3D doll, deformed hands, extra limbs, dark gloomy vignette, visual clutter, blurry details`.

---

## 18 Detailed Structured Prompts

### Item 01: `bag` (School Backpack)
```yaml
IMAGE_ID: PROMPT-G6-001
TARGET_CONCEPT: bag (noun)
CORE_LEMMA_ID: lex-027
USE_CASE: Vocabulary Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A modern, neat secondary school backpack sitting upright on a light wooden classroom floor.
SUBJECT: A single contemporary backpack in deep navy blue with clean teal zipper accents and side water bottle mesh.
ACTION: Static, sitting stably upright, zippers closed, clean shape.
COMPOSITION: Centered framing, object occupies 70% of canvas, soft natural ground shadow beneath.
BACKGROUND: Minimalist, soft warm off-white (#F8FAFC) gradient, subtle wooden floor grain at base.
VISUAL_STYLE: Modern educational illustration, crisp charcoal line art, semi-flat vector shading.
CAMERA / FRAMING: Eye-level perspective, straight-on view, crisp focus.
LIGHTING: Bright, clean, soft diffused daylight from upper left.
DISTRACTOR_RESTRICTIONS: No books sticking out, no keychains, no stationery clutter, no human characters.
TEXT_RESTRICTIONS: Zero text, zero brand logos, zero embroidered badges or letters.
NEGATIVE CONSTRAINTS: photorealistic, hiking rucksack, military tactical bag, toddler cartoon bag with cartoon face, text, blur.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Eliminates confusion with 'books' or 'travel luggage'; isolates the quintessential secondary school backpack.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a single contemporary secondary school backpack, deep navy blue with clean teal zipper accents, standing neatly upright on a light wooden floor, centered composition occupying 70% of canvas, crisp charcoal outline, clean semi-flat vector colors, soft diffused daylight, minimalist warm off-white background with subtle drop shadow, zero text, no letters, no logos, no watermarks, no clutter, high clarity educational art.*

---

### Item 02: `pen` (Ballpoint Pen)
```yaml
IMAGE_ID: PROMPT-G6-002
TARGET_CONCEPT: pen (noun)
CORE_LEMMA_ID: lex-028
USE_CASE: Vocabulary Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A classic blue ballpoint writing pen resting at a 30-degree diagonal on a clean desk surface.
SUBJECT: A single blue student ballpoint pen with a clear translucent barrel showing the blue ink cartridge inside, blue clip cap.
ACTION: Static, resting diagonally across the frame.
COMPOSITION: Diagonal orientation from bottom-left to top-right, occupying 65% of the frame width, crisp focal point on the ballpoint tip.
BACKGROUND: Neutral light cream (#FDFDFD) desk surface, very faint warm drop shadow.
VISUAL_STYLE: Modern educational illustration, crisp line art, clean vector gradients.
CAMERA / FRAMING: High-angle tabletop flat-lay view ($45^\circ$), sharp focus.
LIGHTING: Clean overhead studio daylight.
DISTRACTOR_RESTRICTIONS: Absolutely no paper, no notebooks, no pencil shavings, no eraser nearby.
TEXT_RESTRICTIONS: Zero printed brand text on the barrel (no 'Bic', no '0.5mm', no letters).
NEGATIVE CONSTRAINTS: pencil, fountain pen, calligraphy brush, complex stationery desk, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Distinct metallic/plastic ballpoint tip and translucent ink tube ensure immediate visual discrimination from a wooden pencil.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a single classic blue student ballpoint pen with translucent barrel and blue cap, resting diagonally on a clean light desk surface, high-angle view, sharp focus on the ballpoint tip, crisp charcoal line art, clean semi-flat vector colors, subtle soft shadow, zero text, no words on pen barrel, no logos, no notebook, no background clutter, high visual clarity.*

---

### Item 03: `book` (Textbook / Notebook)
```yaml
IMAGE_ID: PROMPT-G6-003
TARGET_CONCEPT: book (noun)
CORE_LEMMA_ID: lex-029
USE_CASE: Vocabulary Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A clean secondary school textbook or hardcover notebook lying closed on a table.
SUBJECT: A single thick rectangular book with a soft sage-green cover and clean white paper edge binding.
ACTION: Static, closed, positioned at a slight natural three-quarter angle.
COMPOSITION: Centered, occupying 68% of canvas, showing both front cover and page thickness.
BACKGROUND: Minimalist warm neutral (#F8FAFC) plane.
VISUAL_STYLE: Modern educational illustration, smooth vector tones, defined edges.
CAMERA / FRAMING: 3/4 high angle showing cover and spine thickness.
LIGHTING: Soft ambient daylight from upper right.
DISTRACTOR_RESTRICTIONS: No pens on top, no bookmarks sticking out, no open pages with reading text.
TEXT_RESTRICTIONS: ZERO letters, words, or numbers on the cover or spine. Completely blank cover with simple geometric border.
NEGATIVE CONSTRAINTS: English text on cover, open book with paragraphs, kindle/tablet, comic book, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Zero text leakage is mandatory so learners recall the word 'book' from semantic memory rather than reading an English title.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a single closed secondary school textbook with a solid sage-green blank cover, showing crisp page edges and spine thickness, three-quarter tabletop angle, centered composition occupying 70% of frame, crisp line work, smooth semi-flat vector coloring, soft ambient daylight, clean neutral background, strictly zero text on cover, no title, no letters, no logos, no watermarks.*

---

### Item 04: `ruler` (Metric Ruler)
```yaml
IMAGE_ID: PROMPT-G6-004
TARGET_CONCEPT: ruler (noun)
CORE_LEMMA_ID: lex-030
USE_CASE: Vocabulary Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A clear transparent plastic 20cm metric student ruler.
SUBJECT: A straight transparent acrylic ruler with clean black metric tick marks along the upper edge.
ACTION: Static, horizontal positioning across the canvas.
COMPOSITION: Horizontal orientation occupying 80% canvas width, slight subtle tilt ($5^\circ$) for visual interest.
BACKGROUND: Pale pastel blue-gray (#F1F5F9) background providing high contrast against the transparent plastic.
VISUAL_STYLE: Modern educational illustration, clean vector transparency effect.
CAMERA / FRAMING: Direct top-down flat-lay view.
LIGHTING: Bright, clean, high-contrast overhead light with soft refractive highlight.
DISTRACTOR_RESTRICTIONS: No pencils drawing lines, no cutting mat, no geometry set squares.
TEXT_RESTRICTIONS: Tick marks are purely non-linguistic dashes; zero numbers or letters (no 'cm', 'mm', 'inch').
NEGATIVE CONSTRAINTS: tape measure, protractor, wooden yardstick, numbers, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Isolates the straight measurement tool cleanly from other geometry instruments.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a single clear transparent acrylic 20cm student metric ruler with straight edges and fine tick marks, lying horizontally on a pale pastel background, top-down view, crisp charcoal outlines, transparent glass-like shading, soft drop shadow, zero text, no numbers, no words, no letters, no logos, pure educational minimalist clarity.*

---

### Item 05: `pencil` (Graphite Pencil)
```yaml
IMAGE_ID: PROMPT-G6-005
TARGET_CONCEPT: pencil (noun)
CORE_LEMMA_ID: lex-031
USE_CASE: Vocabulary Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A classic yellow hexagonal wooden student pencil.
SUBJECT: A sharpened yellow wooden pencil with a sharp dark graphite tip, silver metal ferrule, and a clean pink rubber eraser at the end.
ACTION: Static, resting diagonally at a 45-degree angle.
COMPOSITION: Diagonal framing from lower-left to upper-right, occupying 70% of canvas, sharp focus on the pencil tip.
BACKGROUND: Warm off-white neutral background with subtle drop shadow.
VISUAL_STYLE: Modern educational vector illustration, clean lines, warm tones.
CAMERA / FRAMING: Angled tabletop view, sharp focus.
LIGHTING: Warm natural daylight.
DISTRACTOR_RESTRICTIONS: No pencil sharpener, no shavings, no handwritten notes.
TEXT_RESTRICTIONS: Zero text on the wooden barrel (no 'HB', '2B', 'No.2', or brand names).
NEGATIVE CONSTRAINTS: mechanical lead pencil, pen, colored crayon, text, typography, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Distinct yellow wood, sharpened graphite cone, and pink eraser tip create immediate visual contrast against Item 02 (pen).
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a single classic yellow wooden hexagonal pencil, freshly sharpened with dark graphite tip, silver metal ferrule and pink eraser at the end, resting diagonally at 45 degrees, centered composition, crisp charcoal linework, vibrant yellow and pastel tones, clean neutral off-white background with soft shadow, zero text on pencil, no letters, no logos, high visual clarity.*

---

### Item 06: `swim` (Action Verb)
```yaml
IMAGE_ID: PROMPT-G6-006
TARGET_CONCEPT: swim (verb)
CORE_LEMMA_ID: lex-016
USE_CASE: Action Verb Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A sunny, clean school swimming pool.
SUBJECT: An 11-year-old Vietnamese student (boy or girl) wearing swimming cap and goggles, swimming freestyle with vigorous athletic form.
ACTION: Active swimming stroke: head tilted to breathe, one arm pulling through crystal-clear turquoise water, dynamic splash and air bubbles.
COMPOSITION: Subject cutting horizontally across frame, upper torso and arm visible above and beneath translucent water surface.
BACKGROUND: Blue lane lines in clear swimming pool, bright clean poolside tiles blurred in distance.
VISUAL_STYLE: Modern educational illustration, dynamic action lines, semi-flat graphic novel style.
CAMERA / FRAMING: Side-profile water-level camera angle, capturing both above-water stroke and underwater arm pull.
LIGHTING: Sparkling sunny daylight, radiant water caustics.
DISTRACTOR_RESTRICTIONS: No diving board, no pool floats, no beach setting, no large crowd.
TEXT_RESTRICTIONS: Zero text on swim cap, zero lane numbers in pool.
NEGATIVE CONSTRAINTS: drowning, photorealistic, adult bikini, baby floaties, murky water, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Clear active stroke and goggles isolate the physical action of swimming immediately without ambiguity.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese secondary student swimming freestyle in a clean turquoise pool, wearing swimming goggles and cap, head turning to breathe, dynamic arm stroke cutting through sparkling water with small motion splashes, side water-level view, crisp outlines, lively semi-flat vector art, bright sunny daylight, zero text, no lane numbers, no logos, no watermarks, high kinetic clarity.*

---

### Item 07: `run` (Action Verb)
```yaml
IMAGE_ID: PROMPT-G6-007
TARGET_CONCEPT: run (verb)
CORE_LEMMA_ID: lex-017
USE_CASE: Action Verb Flashcard & Contrast Pair (vs walk)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A red running track at a secondary school sports ground.
SUBJECT: An 11–12-year-old Vietnamese student wearing school PE sports attire (navy shorts, white sport t-shirt with red stripe) and running shoes.
ACTION: High-energy sprint: body pitched forward at 25 degrees, front knee driven high, back foot in push-off phase, elbows bent at 90 degrees pumping dynamically.
COMPOSITION: Side-profile running from left to right, centered, dynamic motion accents behind heels.
BACKGROUND: Red clay running track surface with soft green grass boundary in distance.
VISUAL_STYLE: Modern educational illustration, crisp charcoal outlines, energetic vector coloring.
CAMERA / FRAMING: Low-angle tracking shot, side view, emphasizing speed and athletic form.
LIGHTING: Bright, cheerful afternoon sunshine.
DISTRACTOR_RESTRICTIONS: No hurdles, no soccer ball, no finish line banner, no spectators.
TEXT_RESTRICTIONS: Zero numbers or sponsor logos on the t-shirt, zero lane numbers on track.
NEGATIVE CONSTRAINTS: walking, exhausted collapse, photorealistic, adult marathon runner, chibi cartoon, text.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: High knee drive, acute forward torso lean, and flight phase clearly distinguish 'run' from 'walk'.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese school student sprinting fast on a red running track, wearing school PE shirt and shorts, dynamic forward running posture with high knee drive and pumping arms, side profile view, subtle motion accents, crisp line art, bright cheerful semi-flat colors, sunny outdoor school sports field background, zero text on shirt, no track numbers, no watermarks.*

---

### Item 08: `draw` (Action Verb)
```yaml
IMAGE_ID: PROMPT-G6-008
TARGET_CONCEPT: draw (verb)
CORE_LEMMA_ID: lex-018
USE_CASE: Action Verb Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A student's art desk during art class.
SUBJECT: A youthful hand holding a wooden pencil, actively sketching the outline of a friendly cartoon cat on a white drawing paper pad.
ACTION: Hand in active drawing grip, tip of pencil contacting paper where half the cat sketch is freshly completed.
COMPOSITION: Close-up top-down view centered on the drawing hand and the emerging cat sketch.
BACKGROUND: Clean wooden art desk, two colored pencils resting quietly at the upper edge.
VISUAL_STYLE: Modern educational illustration, warm line art, clean vector tones.
CAMERA / FRAMING: $60^\circ$ high-angle close-up focusing on hand and drawing sheet.
LIGHTING: Warm, focused desk lamp illumination.
DISTRACTOR_RESTRICTIONS: No paintbrush, no paint palettes (to avoid confusion with 'paint'), no laptop.
TEXT_RESTRICTIONS: The sketch is purely pictorial (a cat outline); zero letters, words, or signatures.
NEGATIVE CONSTRAINTS: writing text, painting with liquid watercolors, photorealistic, complex artist studio, text.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Depicting a pencil actively outlining a recognizable figure (cat) isolates 'draw' (vẽ hình) from 'write' (viết chữ).
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a youthful hand holding a graphite pencil actively sketching the outline of a cute cat on clean white paper, pencil tip touching paper with fresh sketch lines, close-up angled top-down view, clean wooden desk surface, warm focused lighting, crisp charcoal lines, semi-flat vector art, zero text, no written words, no signatures, no paint brushes, high pedagogical clarity.*

---

### Item 09: `cook` (Action Verb)
```yaml
IMAGE_ID: PROMPT-G6-009
TARGET_CONCEPT: cook (verb)
CORE_LEMMA_ID: lex-019
USE_CASE: Action Verb Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A bright, tidy home kitchen.
SUBJECT: An 11–12-year-old Vietnamese student wearing a clean kitchen apron over domestic clothes.
ACTION: Actively stirring a simmering pot of soup with a wooden spoon on a kitchen stovetop, gentle steam rising.
COMPOSITION: Medium shot, character centered behind stove, smiling attentively as they stir the pot.
BACKGROUND: Simple domestic kitchen with clean tiled wall and minimal countertop utensils.
VISUAL_STYLE: Modern educational illustration, friendly line art, cozy warm palette.
CAMERA / FRAMING: Eye-level medium shot.
LIGHTING: Warm, inviting domestic kitchen daylight.
DISTRACTOR_RESTRICTIONS: Character is NOT eating (no spoon in mouth), to avoid confusion with 'eat'.
TEXT_RESTRICTIONS: Zero text on spice jars, stove knobs, or apron.
NEGATIVE CONSTRAINTS: professional restaurant chef hat, eating food, fire explosion, messy kitchen, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Stirring food on a stove unambiguously illustrates cooking without confusing it with eating or drinking.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese student wearing a simple kitchen apron, actively stirring a pot of soup on the kitchen stove with a wooden spoon, gentle steam rising, friendly engaged expression, medium shot, tidy modern domestic kitchen background, warm lighting, crisp outlines, clean semi-flat vector style, zero text, no words on apron or jars, no logos, no watermarks.*

---

### Item 10: `water` (Drinkable Liquid)
```yaml
IMAGE_ID: PROMPT-G6-010
TARGET_CONCEPT: water (noun)
CORE_LEMMA_ID: lex-086
USE_CASE: Noun Flashcard & Diagnostic Mode A/B/C
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A clean dining table.
SUBJECT: A clear, transparent drinking glass three-quarters full of pure, crystal-clear drinking water.
ACTION: Static, with a couple of tiny, fresh condensation droplets on the outside of the glass.
COMPOSITION: Centered glass occupying 65% vertical canvas, crisp silhouette, soft drop shadow.
BACKGROUND: Minimalist pale warm-gray (#F8FAFC) plane.
VISUAL_STYLE: Modern educational illustration, clean vector transparency and soft turquoise refraction.
CAMERA / FRAMING: Eye-level tabletop perspective.
LIGHTING: Bright, clean, sparkling natural daylight highlighting the water clarity.
DISTRACTOR_RESTRICTIONS: No ice cubes, no lemon slice, no straw, no pitcher, no juice coloring.
TEXT_RESTRICTIONS: Zero logos or embossed lettering on the glass.
NEGATIVE CONSTRAINTS: colored soda, juice, tea, water splashing from tap, ocean wave, dirty glass, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Pure, unflavored water in a clean glass prevents confusion with tea, juice, or lemonade.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of a single clear transparent drinking glass filled with pure clean water, subtle light reflections and tiny condensation droplets, standing on a minimalist pale tabletop, centered composition, eye-level view, crisp outlines, smooth translucent vector shading, bright daylight, zero text, no brand, no straw, no lemon, no background clutter, high visual purity.*

---

### Item 11: `eat` (Action Verb)
```yaml
IMAGE_ID: PROMPT-G6-011
TARGET_CONCEPT: eat (verb)
CORE_LEMMA_ID: lex-087
USE_CASE: Action Verb Flashcard & Contrast Pair (vs drink)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A student eating lunch at a dining table.
SUBJECT: An 11–12-year-old Vietnamese student (boy or girl) seated at a clean table.
ACTION: The definitive act of eating: raising a fork/spoon with a small portion of food right to their open mouth, chewing happily.
COMPOSITION: Medium close-up, focusing on the character's face, hand, and utensil contacting the mouth.
BACKGROUND: Soft, blurred dining area background.
VISUAL_STYLE: Modern educational illustration, warm friendly colors, clear character lines.
CAMERA / FRAMING: Eye-level medium close-up, sharp focus on the action.
LIGHTING: Warm, cheerful daytime lighting.
DISTRACTOR_RESTRICTIONS: NO cups, mugs, or glasses on the table to prevent confusion with 'drink'.
TEXT_RESTRICTIONS: Zero text on shirt, plate, or background.
NEGATIVE CONSTRAINTS: drinking liquids, messy food fight, fast food junk, adult fine dining, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Capturing the fork/spoon entering the mouth isolates 'eat' and strictly prevents confusion with 'drink'.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese student sitting at a table actively eating lunch, raising a fork with food to their mouth, cheerful facial expression, medium close-up view, warm natural lighting, clean semi-flat vector art with crisp charcoal outlines, soft minimalist background, zero cups or drink glasses in frame, zero text, no logos, no watermarks, high action clarity.*

---

### Item 12: `drink` (Action Verb)
```yaml
IMAGE_ID: PROMPT-G6-012
TARGET_CONCEPT: drink (verb)
CORE_LEMMA_ID: lex-088
USE_CASE: Action Verb Flashcard & Contrast Pair (vs eat)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A student pausing to rehydrate.
SUBJECT: An 11–12-year-old Vietnamese student holding a clear glass of water with both hands.
ACTION: The definitive act of drinking: glass tipped to lips, taking a refreshing sip with throat swallowing, eyes smiling gently.
COMPOSITION: Medium close-up, side three-quarter profile, focusing on the glass at the lips and the swallowing action.
BACKGROUND: Soft pastel classroom or home wall.
VISUAL_STYLE: Modern educational illustration, clean lines, fresh and hydrating palette.
CAMERA / FRAMING: Side-profile medium close-up.
LIGHTING: Bright, refreshing daylight.
DISTRACTOR_RESTRICTIONS: Absolutely NO food, plates, bowls, or utensils present in the scene.
TEXT_RESTRICTIONS: Zero text on glass or clothing.
NEGATIVE CONSTRAINTS: eating solid food, drinking alcohol, straw bubble tea, chibi cartoon, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Glass raised to lips with zero solid food visible guarantees 100% semantic exclusivity for 'drink'.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese student drinking water from a clear glass, glass held to lips taking a refreshing sip, side three-quarter profile, cheerful refreshed expression, medium close-up, bright natural lighting, crisp charcoal outline, clean semi-flat vector colors, zero food plates or utensils in frame, zero text, no logos, no watermarks.*

---

### Item 13: `happy` (Emotional State)
```yaml
IMAGE_ID: PROMPT-G6-013
TARGET_CONCEPT: happy (adjective)
CORE_LEMMA_ID: lex-041
USE_CASE: Emotional State Flashcard & Contrast Pair (vs tired/sad)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A cheerful moment at school.
SUBJECT: An 11-year-old Vietnamese student (boy or girl) with a radiant, genuine, friendly smile.
ACTION: Head slightly tilted, sparkling eyes, mouth curved into a warm joyful grin, hands making an energetic gentle thumbs-up.
COMPOSITION: Portrait head-and-shoulders framing, occupying 75% of the frame.
BACKGROUND: Soft sunny yellow-to-cream gradient with subtle sparkle accents.
VISUAL_STYLE: Modern educational illustration, expressive character art, warm palette.
CAMERA / FRAMING: Eye-level portrait shot.
LIGHTING: Radiant, warm, flattering front-three-quarter daylight.
DISTRACTOR_RESTRICTIONS: No comical exaggerated cartoon clown smile; realistic adolescent joy.
TEXT_RESTRICTIONS: Zero emoji symbols floating, zero text on clothing.
NEGATIVE CONSTRAINTS: adult face, chibi baby face, hysterical laughing, sad, angry, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Authentic adolescent expression of happiness resonates with Grade 6 learners without looking childish.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese secondary student with a genuine, happy, radiant smile, sparkling dark eyes, cheerful posture, portrait bust shot, warm friendly expression, crisp charcoal line work, bright sunny semi-flat vector colors, soft warm yellow background, dignified adolescent proportions, zero text, no emojis, no watermarks, high emotional clarity.*

---

### Item 14: `tired` (Physical State)
```yaml
IMAGE_ID: PROMPT-G6-014
TARGET_CONCEPT: tired (adjective)
CORE_LEMMA_ID: lex-042
USE_CASE: State Flashcard & Contrast Pair (vs happy/energetic)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: An afternoon study desk.
SUBJECT: An 11–12-year-old Vietnamese student sitting at a wooden study desk.
ACTION: Resting cheek and arms flat on the desk, heavy drooping eyelids, small sleepy yawn, relaxed slumped shoulders.
COMPOSITION: Medium close-up, character leaning on desk, occupying 70% of frame.
BACKGROUND: Soft, calm lavender-blue muted background, soft desk lamp light.
VISUAL_STYLE: Modern educational illustration, gentle line art, soothing muted tones.
CAMERA / FRAMING: Eye-level view slightly from above the desk.
LIGHTING: Soft, dimming afternoon ambient light.
DISTRACTOR_RESTRICTIONS: No cartoon 'ZZZ' floating letters (violates zero-text rule); rely purely on posture and facial expression.
TEXT_RESTRICTIONS: Absolutely zero 'Z' letters, zero text on books or desk.
NEGATIVE CONSTRAINTS: sick/crying in pain, snoring with 'ZZZ' text, dead/collapsed, adult office burnout, text.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Relying on head-on-desk posture and heavy eyelids conveys fatigue naturally without resorting to prohibited English letters ('ZZZ').
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese student feeling tired at a study desk, resting head sideways on folded arms, heavy sleepy eyelids, relaxed slumped shoulders, peaceful fatigued expression, medium shot, muted soft blue and warm wood tones, crisp charcoal linework, clean semi-flat vector art, strictly zero text, no ZZZ letter symbols, no words, no watermarks.*

---

### Item 15: `hot` (Temperature State)
```yaml
IMAGE_ID: PROMPT-G6-015
TARGET_CONCEPT: hot (adjective)
CORE_LEMMA_ID: lex-046
USE_CASE: State Flashcard & Contrast Pair (vs cold)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A sunny summer day in Vietnam.
SUBJECT: An 11-year-old Vietnamese student outdoors under a bright sun.
ACTION: Wiping forehead sweat with back of wrist, unbuttoned top shirt collar, gently fanning face with a simple handheld paper fan, flushed warm cheeks.
COMPOSITION: Bust portrait, character centered, warm sun glowing in the upper corner.
BACKGROUND: Warm amber-orange gradient, bright sunny summer atmosphere.
VISUAL_STYLE: Modern educational illustration, expressive character lines, warm sunlit palette.
CAMERA / FRAMING: Eye-level bust shot.
LIGHTING: Bright, direct summer sunlight, warm golden glow.
DISTRACTOR_RESTRICTIONS: Character is NOT holding an ice cream or drinking water (to avoid noun confusion).
TEXT_RESTRICTIONS: Zero thermometer numbers, zero degree symbols ($^\circ\text{C}$), zero text on fan.
NEGATIVE CONSTRAINTS: winter clothes, shivering, thermometer with numbers, sunburn blistering, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Fan, wiping sweat, and sunny golden glow unambiguously convey heat without temperature numbers.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese student feeling hot on a summer day, wiping sweat from forehead with wrist, flushed rosy cheeks, gently waving a plain handheld paper fan, unbuttoned collar, warm bright sunbeam in background, bust portrait, vivid warm amber and coral tones, crisp line art, clean semi-flat vector art, zero text, no numbers, no thermometer symbols, no watermarks.*

---

### Item 16: `cold` (Temperature State)
```yaml
IMAGE_ID: PROMPT-G6-016
TARGET_CONCEPT: cold (adjective)
CORE_LEMMA_ID: lex-045
USE_CASE: State Flashcard & Contrast Pair (vs hot)
AGE_CONTEXT: 11–12-year-old Vietnamese secondary student
SCENE: A chilly winter day in northern Vietnam (Hanoi/Sa Pa winter atmosphere).
SUBJECT: An 11-year-old Vietnamese student dressed in warm winter clothing.
ACTION: Shivering slightly with shoulders pulled up, wearing a padded puffer jacket, warm knitted wool scarf wrapped snugly around neck, hands tucked deep into jacket pockets, visible light breath mist in cool air.
COMPOSITION: Bust portrait, character centered, pulling scarf closer to chin.
BACKGROUND: Cool winter blue-gray (#E2E8F0) background with soft falling winter breeze.
VISUAL_STYLE: Modern educational illustration, crisp lines, cool icy blue-white palette.
CAMERA / FRAMING: Eye-level bust shot.
LIGHTING: Crisp, cool winter daylight.
DISTRACTOR_RESTRICTIONS: No ice cubes, no snowman (keep realistic to Vietnamese winter).
TEXT_RESTRICTIONS: Zero thermometer numbers or symbols.
NEGATIVE CONSTRAINTS: summer clothes, sweating, hot sun, thermometer with numbers, text, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Heavy winter jacket, scarf, shivering posture, and cool blue palette create direct, instant contrast with Item 15 (hot).
```
**Engine-Ready Prompt**:  
> *Modern educational illustration of an 11-year-old Vietnamese student feeling cold on a chilly winter day, bundled up in a thick padded jacket and warm wool scarf pulled high, shivering with shoulders hunched and hands in pockets, subtle misty breath in cool air, bust portrait, crisp charcoal lines, cool icy blue and slate tones, clean semi-flat vector art, zero text, no numbers, no watermarks, high contrast with hot.*

---

### Item 17: `big` vs `small` (Visual Contrast Pair)
```yaml
IMAGE_ID: PROMPT-G6-017
TARGET_CONCEPT: big (adj) vs small (adj)
CORE_LEMMA_ID: lex-065
USE_CASE: Contrast Pair Diagnostic Flashcard (Mode D)
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A clean classroom desk comparison.
SUBJECT: Two familiar school bags placed side-by-side on the same ground plane to establish undeniable relative scale: on the left, a large, spacious school backpack; on the right, a tiny compact pencil pouch/coin purse.
ACTION: Static comparative placement side-by-side.
COMPOSITION: Split comparative composition on single horizon line. Left object occupies 65% height; right object occupies 20% height.
BACKGROUND: Clean, neutral off-white classroom floor with subtle perspective grid lines establishing ground depth.
VISUAL_STYLE: Modern educational illustration, crisp outlines, clean vector color blocking.
CAMERA / FRAMING: Straight-on eye-level view showing direct relative height comparison.
LIGHTING: Bright, clean, uniform overhead daylight.
DISTRACTOR_RESTRICTIONS: Both objects must share identical color family (e.g. navy blue) so color does not become a confounding variable.
TEXT_RESTRICTIONS: Absolutely zero labels (no 'BIG', no 'SMALL', no arrows with text).
NEGATIVE CONSTRAINTS: photorealistic, clutter, text labels, different colored objects confusing size with color, watermark.
ASPECT_RATIO: 1:1
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Identical color and ground plane ensure the learner evaluates physical SIZE alone, eliminating all confounding factors.
```
**Engine-Ready Prompt**:  
> *Modern educational illustration showing a direct size comparison on a clean tabletop: on the left, a large navy blue school backpack ('big'); on the right, a tiny matching navy blue pencil pouch ('small'), both resting on the exact same ground plane to establish dramatic scale contrast, straight-on eye-level view, crisp charcoal outlines, clean semi-flat vector colors, minimalist neutral background with soft shadows, strictly zero text, no labels, no words, no arrows, no watermarks.*

---

### Item 18: `in / on / under` (Spatial Prepositions Set)
```yaml
IMAGE_ID: PROMPT-G6-018
TARGET_CONCEPT: in / on / under (spatial prepositions)
CORE_LEMMA_ID: lex-089, lex-090, lex-091
USE_CASE: Spatial Relationship Flashcard & Tri-Contrast Diagnostic
AGE_CONTEXT: Grade 6 secondary student (11–12 years old)
SCENE: A clean wooden student desk with a cubby shelf.
SUBJECT: A bright red student ball placed in three distinct, clearly separated spatial relationships:
  - Panel A (or Frame 1): The red ball resting ON the flat wooden desk surface.
  - Panel B (or Frame 2): The red ball sitting IN the open desk drawer / cubby.
  - Panel C (or Frame 3): The red ball resting UNDER the desk on the floor beneath the legs.
ACTION: Static spatial demonstration with identical desk structure across all three panels.
COMPOSITION: A 3-panel horizontal triptych or clean composite showing three distinct spatial positions relative to the same desk.
BACKGROUND: Neutral pale-gray classroom wall, minimal distractions.
VISUAL_STYLE: Modern educational illustration, architectural isometric or straight-on 3D-vector clarity.
CAMERA / FRAMING: Consistent eye-level 3/4 perspective across all three conditions.
LIGHTING: Clear, consistent ambient daylight casting identical contact shadows.
DISTRACTOR_RESTRICTIONS: Zero other toys, zero books on the desk; only the wooden desk and the red ball.
TEXT_RESTRICTIONS: Absolutely zero written words (no 'IN', 'ON', 'UNDER').
NEGATIVE CONSTRAINTS: text labels, arrows with text, confusing messy furniture, photorealistic, watermark.
ASPECT_RATIO: 16:9 (Widescreen triptych) or 3 individual 1:1 cards (PROMPT-G6-018A, 018B, 018C).
WHY_THIS_IMAGE_IS_DIAGNOSTICALLY_CLEAR: Keeping the reference furniture (desk) and test object (red ball) identical forces the learner to focus exclusively on spatial geometry.
```
**Engine-Ready Prompt (Composite / Triptych)**:  
> *Modern educational illustration triptych showing three spatial prepositions with a clean wooden student desk and a bright red ball: Section 1 shows the red ball resting ON the desk top; Section 2 shows the red ball resting IN an open desk drawer; Section 3 shows the red ball resting UNDER the desk on the floor beneath the legs, identical furniture and lighting across all three sections, isometric clean perspective, crisp charcoal outlines, semi-flat vector art, neutral pastel background, strictly zero text, no labels, no letters, no words, no watermarks.*
