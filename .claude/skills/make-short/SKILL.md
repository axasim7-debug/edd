---
name: make-short
description: Produce a vertical history/WW2 YouTube Short for this channel end to end — topic and script (hook-first, English), voiceover word timing, real-geography map or paper-documentary edit in Remotion, measured SFX, -14 LUFS master. Use whenever the user asks for a new short, a script, a re-edit of a short, or "the same editing method as before".
---

# Make a Short (channel house method)

The channel owner writes to you in Arabic; reply in Arabic. Scripts and on-screen text are English (global channel).

Read these before starting — they hold every decision the owner has made:
- `docs/editing-method.md` — step-by-step pipeline and commands.
- `docs/shorts-style-guide.md` — script rules, layout bands, styles A / A-Paper / B / C.
- `docs/shorts-learnings.md` — the owner's decisions in order, plus performance log.
- `docs/paper-documentary-master-prompt.md` + `docs/paper-documentary-applying.md` — art direction for paper style.

## Non-negotiables (from the owner)
1. **Hook:** first 3 seconds are a "catastrophic" myth-break, never calm. No greeting.
2. **Topic:** a very specific, globally known WW2/history story where the popular version hides a different truth. Not region-locked.
3. **Script delivery:** one clean copy-paste block (code block), no brackets or timings.
4. **Real geography only:** Natural Earth coastlines + historically correct borders for the year. No hand-drawn shapes. No satellite imagery unless asked.
5. **Frame 0 hook (lesson from Short #1: 47% swiped away):** a 3–5 word headline on a paper strip + strong visual from frame 0; keep Shorts 35–50s.
6. **Default style: A-Paper** (`<Enigma theme="paper" />` pattern): ink map on paper, typewriter place labels, sepia photo prints, no pushpins, no coordinates, no big words repeating the narration.
7. **Layout bands** (1080×1920): cards 440–960, map focus 1000–1450, keep top 220 / bottom 440 / right 150 clear. Nothing overlaps text; nothing covers faces.
8. **Palette:** archival only (#E8DDC5 #D5C4A1 #171817 #292824 #A43B32 #AD9163 #77736C). **No glow at all.** Red only for danger / invasion / key discovery.
9. **Audio:** narration first; tactile SFX at contact moments at master gain 0.4; low impact only on 3–4 real revelations; intentional silence at the strongest beat; master to -14 LUFS with `tools/master.sh`.
10. **Accuracy:** fact notes for every claim; licences tracked (`credits.json`, `description.md`); reconstructions labelled.
11. Offer alternative versions in other styles when useful; the owner picks — log the pick and the reason in `shorts-learnings.md`.

## Workflow
1. Propose topic + English script (block). Wait for the owner's recording.
2. `python3 tools/transcribe.py public/<slug>/vo.wav > src/shorts/<slug>/words.json` — every cue comes from these timestamps.
3. Fetch assets: borders (historical-basemaps), photos (`tools/fetch_art.py`).
4. Copy `remotion/src/shorts/chernobyl/Chernobyl.tsx` (latest: frame-0 headline strip + stamp, OSM local layers via `tools/osm_extract.py`, typed paper cards, handwritten notes) as the template; register the composition in `Root.tsx` with `theme: 'paper'`.
5. Render 10–20 review stills, build a contact sheet, fix every clipping/overlap before the full render.
6. Render → `tools/master.sh` → send the file to the owner (videos are NOT committed; `*.mp4` is git-ignored) → commit and push the source.
7. Write title options + description + credits to `shorts/<n>-<slug>/description.md`.

Chromium in the cloud container: `/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
