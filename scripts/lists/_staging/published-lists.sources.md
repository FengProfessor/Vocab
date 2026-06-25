# Published vocabulary lists — sources & provenance

Compiled from reputable published English word lists for the LingoPro scraper.
All headwords below were gathered from the sources cited (not invented). Each `.raw.txt`
is one comma-separated, lowercase list.

## ngsl-core.raw.txt — NGSL (New General Service List), 360 entries

- https://www.newgeneralservicelist.com/ — official NGSL project site (Browne, Culligan, Phillips, 2013).
- https://www.eapfoundation.com/vocab/general/ngsl/ — reputable EAP reference page that publishes the full NGSL headword table in frequency order; source of the actual headwords used here.
- https://en.wikipedia.org/wiki/New_General_Service_List — background/coverage stats.

**What it is:** 2,801 highest-frequency English headwords giving ~90%+ text coverage; modern replacement for West's 1953 General Service List, built on a 273M-word Cambridge English Corpus subset.
**License/free-use:** NGSL is released by its authors for free educational/research use (Creative-Commons-style, attribution requested). Headwords are factual frequency data, not copyrightable as a list.
**Full or subset:** REPRESENTATIVE SUBSET. We took the top ~360 of the 2,801 headwords in frequency rank order, after dropping the most trivial closed-class function words (the, be, of, to, a, …) that aren't useful as standalone vocab entries. These are the most useful high-frequency content/structure words.

## nawl-academic.raw.txt — NAWL (New Academic Word List), 300 entries

- https://www.newgeneralservicelist.com/new-academic-word-list — official NAWL project page (Browne, Culligan, Phillips, 2013); links to downloadable list files.
- https://www.eapfoundation.com/vocab/academic/nawl/ — reputable EAP reference that publishes the NAWL headword table; source of the actual headwords used here.

**What it is:** 963 words that appear frequently in academic texts but are NOT in the NGSL (companion academic list). Built on a 288M-word academic corpus; NGSL+NAWL together cover ~92% of academic text.
**License/free-use:** Free for educational/research use under the NGSL project's open terms (attribution requested).
**Full or subset:** REPRESENTATIVE SUBSET. ~300 of the 963 NAWL headwords, evenly sampled across the alphabet from the published alphabetical list to span the full range (science, social-science, and general-academic vocabulary all represented).

## oxford-5000-b2c1.raw.txt — Oxford 5000 (B2/C1 extension), 370 entries

- https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf — OFFICIAL Oxford University Press PDF of the Oxford 5000 by CEFR level. Parsed directly (pdftotext); contains exactly the ~2,000 B2/C1 words that extend beyond the Oxford 3000.
- https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000 — official word-list portal / about page.

**What it is:** The Oxford 5000 is the Oxford 3000 plus 2,000 additional B2-C1 words for advanced learners, aligned to CEFR, based on the Oxford English Corpus (2B+ words). This file contains ONLY the B2/C1 extension (words beyond Oxford 3000), exactly as the official PDF separates them.
**License/free-use:** The word LIST is published free on oxfordlearnersdictionaries.com for learners/teachers; the headwords (single words) are used here as a vocabulary index, not the dictionary definitions (which are © OUP). Headwords as factual data are reproduced for educational scraping seed use.
**Full or subset:** REPRESENTATIVE SUBSET of the full set. The official PDF yielded 1,996 B2/C1 headwords (688 B2 + 1,308 C1) after parsing. This file keeps a balanced ~370: the top ~250 B2 words (most useful upper-intermediate) plus ~120 C1 words evenly sampled across the band. The full parsed set is available if a larger seed is wanted.

## Notes on processing

- All headwords lowercased; part-of-speech tags (n./v./adj./…), bracket disambiguators ("counter (long flat surface)"), and homograph digits (bass1, minute2) stripped to the bare headword.
- Multi-word/hyphenated entries from Oxford (e.g. thought-provoking, short-term) kept as published.
- Deduplicated within each file. No cross-file dedup performed (NGSL/NAWL are designed to be mutually exclusive by construction; Oxford overlaps both by design).
