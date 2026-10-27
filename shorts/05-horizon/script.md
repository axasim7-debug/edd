# Short #5 — Crossing the event horizon (Arabic voiceover, Egyptian dialect, 61.7s)

The owner recorded this one directly in Arabic (first non-English short, first science topic).
Recording: `remotion/public/horizon/vo.wav`; word timings: `remotion/src/shorts/horizon/words.json`
(`LANG_CODE=ar MODEL=medium python3 tools/transcribe.py ...`, then spelling fixes: سطح، المسارات، الضوء، بره).

## Transcript
```
ممكن تعدي أفق الحدث بتاع ثقب أسود من غير ما تحس إنك عديت حاجة وتفضل شايف ضوء جاي من بره ومع كده ما تقدرش ترجع. وده ممكن يحصل لو الثقب الأسود ضخم جداً وبعيد عن الغاز الساخن اللي ممكن يبقى حواليه. أفق الحدث عبارة عن حد حوالين الثقب الأسود؛ ما فيش سطح صلب يمنعك تعديه ولا علامة تحس بيها أول ما تعدي. ولكن لو بقيت جوا الحد ده حتى لو بمسافة صغيرة جداً… بحسب النسبية العامة. وده لأنه جوا أفق الحدث حتى الضوء اللي بتحاول تبعته بره ما يقدرش يخرج. شكل الزمكان هناك بيخلي كل المسارات اللي تقدر تمشي فيها تفضل جوا الثقب. أما بقى العالم الخارجي فالضوء لسه ممكن يدخل وتشوفه، لكن إنك ترسل أنت أي رسالة أو إشارة بره مستحيل حتى لو ضوء. يعني عبورك مش معنى إن كل حاجة هتختفي فجأة. ولو حاولت تبعت إشارة للحد بره عشان تقول إنك عديت، الإشارة دي مش هتقدر تخرج له مهما حاولت، لأن الإشارة مش بتعدي سرعة الضوء أصلاً، وهناك حتى الضوء مستحيل يخرج من الأساس. فالسؤال الأهم: لو الضوء نفسه مش هيقدر يخرج، طيب عند أفق الحدث إحنا محتاجين كم ضعف سرعة الضوء عشان نخرج؟ عشان تعرف… سبسكرايب.
```

## Fact notes
- No local physical event at the horizon of a large black hole; tidal forces there scale as M⁻², so for a supermassive hole they are negligible at the horizon (for a stellar-mass hole you'd be torn apart before reaching it). Standard GR (e.g. Taylor & Wheeler, *Exploring Black Holes*).
- Inside the horizon every future-directed path, light included, ends at smaller r. The "river" diagrams use the Gullstrand–Painlevé picture: space flows inward at v = c·√(R/r) (v = c at the horizon). Marked "رسم توضيحي" (illustration, not to scale).
- Light from outside still reaches an infalling observer after crossing — the sky does not vanish.
- M87*: first image of a black hole, Event Horizon Telescope, 10 April 2019; mass ≈ 6.5 billion Suns.
- General relativity: Einstein, November 1915. Black-hole solution: Karl Schwarzschild, 1916.
- c = 299,792.458 km/s.
- Ending question (how many times c to escape from the horizon?) is left open on purpose — the honest answer is that no speed works, which is the follow-up.
- Note: the narration says "far from hot gas" — the NASA-style accretion-disk image in the cinematic version is used to show what that hot gas is, not as the hole the viewer falls into.

## Audio mix (viral version)
Music is mixed after the Remotion render, side-chain ducked under the voice:
`ffmpeg -i out/HorizonViral.mp4 -ss 199.6 -i Echoes_of_Time_v2.mp3 -i public/horizon/vo.wav -filter_complex "[1:a]atrim=0:61.8,asetpts=PTS-STARTPTS,aresample=48000,volume=0.16,afade=t=in:d=0.3,afade=t=out:st=59.6:d=2.2[m];[2:a]aresample=48000,volume=2.0[k];[m][k]sidechaincompress=threshold=0.012:ratio=8:attack=10:release=450:makeup=1[md];[0:a]aresample=48000[v];[v][md]amix=inputs=2:normalize=0:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac out/HorizonViral-mix.mp4`, then `tools/master.sh`.
Source media not in git (large): NASA SVS 14576/13326 clips (tools/horizon_clips.py), spacewalk videos from images.nasa.gov, Poly Haven tonemapped JPGs, ESO eso0932a panorama.
