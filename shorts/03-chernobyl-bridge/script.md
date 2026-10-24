# Short #3 — The Bridge of Death (Chernobyl)

**Myth:** HBO's *Chernobyl* says everyone who watched the fire from the Pripyat railway bridge died.
**Truth:** No evidence supports it; Adam Higginbotham (10+ years of eyewitness interviews) found none and met a man who cycled to the bridge as a boy — alive decades later.

## Script (recorded, 39s)
```
HBO says everyone on this bridge died. There's no proof any of them did.

April 26th, 1986. Reactor 4 is burning. People from Pripyat walk to a railway bridge to watch the glow in the sky.

The series ends with a chilling line: it has been reported that none of them survived.

But journalist Adam Higginbotham spent over a decade interviewing Chernobyl eyewitnesses. He found no evidence for it.

He even met a man who cycled to that bridge as a boy. Decades later, alive and well.

Chernobyl's real victims are real. But the Bridge of Death… is a legend.

And it's not the only thing the series changed.
```

## Fact notes
- Closing caption of HBO's *Chernobyl* (2019): "it has been reported" none of the bridge watchers survived — framed as a report, not a fact (Truth or Fiction).
- Higginbotham, *Midnight in Chernobyl* (2019): no evidence; interviewed a man who had cycled to the bridge as a child, in good health (Bulletin of the Atomic Scientists; The Clio).
- The Conversation: no evidence that all on the bridge died nor that doses there were that high.
- Explosion: 26 April 1986, 01:23.
- Bridge location: OSM node "Bridge of Death" (51.39493 N, 30.06948 E); Reactor 4: OSM way "Reactor #4" (51.38955 N, 30.09909 E) → 2.1 km (haversine).
- Walk path: the real geometry of Tsentralnyi Avenue (formerly Lenin Avenue) from the town centre to the bridge.
- Post-1986 structures (New Safe Confinement, Solar Chernobyl) removed from the map layer.

## Editing (A-Paper + local OSM layers) — `remotion/src/shorts/chernobyl/Chernobyl.tsx`
| Time | Visual |
|---|---|
| 0–4.5 | Frame 0: headline strip "THE BRIDGE OF DEATH?", bridge ringed in red, Reactor 4, measured 2.1 km sight line; "NO PROOF" stamp at "There's no proof" |
| 5–8 | Regional ink map (Dnipro, Pripyat, Kyiv Reservoir), pins Pripyat / Chernobyl / Kyiv, typed "26 APRIL 1986 · 01:23" |
| 8–10 | Plant close-up, Reactor 4 pulse, archival 1986 photo |
| 10–13.6 | Town → bridge along the real avenue (red dashes), sight line + "2.1 KM" |
| 13.6–25 | Typed caption quote, Higginbotham card, "NO EVIDENCE" stamp on "found no evidence" |
| 25–31 | Ink bicycle sketch (illustrative), "a boy, 1986", modern site photo, "alive and well" |
| 31–34 | Liquidators' medal over Reactor 4 ("real victims are real") |
| 34–37 | Red ring on the bridge, handwritten "a legend" |
| 37–40 | Pull back: Pripyat, bridge, Reactor 4 |
