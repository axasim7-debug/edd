# edd — History Shorts studio

Vertical YouTube Shorts on WW2 / history, built in code with Remotion.

## Layout
| Path | What |
|---|---|
| `docs/editing-method.md` | **Start here** — the full production method (script → voice → map/paper edit → master). |
| `docs/shorts-style-guide.md` | Script and visual rules, layout bands, the available styles. |
| `docs/shorts-learnings.md` | Owner decisions in order + per-short performance log. |
| `docs/paper-documentary-*.md` | Paper documentary master prompt and how it applies to Shorts. |
| `.claude/skills/make-short/` | Claude Code skill wrapping the method. |
| `remotion/src/lib/` | Reusable engine: `map.tsx` (real-geography map, dark/paper themes, camera), `overlays.tsx` (pins, routes, arrows, cards), `paper.tsx` (paper board system), `doc.tsx` (documentary panels, animated Enigma), `sfx.tsx`. |
| `remotion/src/shorts/<slug>/` | One folder per short (compositions, word timings, data). |
| `remotion/tools/` | `transcribe.py`, `fetch_art.py`, `fetch_tiles.py`, `make_textures.py`, `sfx.sh`, `master.sh`, `align.sh`. |
| `shorts/<n>-<slug>/` | Script, description/credits and final renders. |

## Quick start
```bash
cd remotion && npm ci && pip install -r requirements.txt
npx remotion studio                       # preview
npx remotion render EnigmaPaperMap out/enigma.mp4
tools/master.sh out/enigma.mp4 out/enigma-final.mp4
```

## Shorts
| # | Topic | Versions |
|---|---|---|
| 02 | Enigma — Poland broke it first | A (dark map), **A-Paper (paper map, preferred)**, B (documentary), C (paper board) |
