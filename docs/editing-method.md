# طريقة المونتاج — كيف نصنع شورت تاريخي من الصفر

هذا الملف يشرح الطريقة الكاملة التي بنينا بها شورت إنجما. اتبعه خطوة بخطوة لأي فيديو قادم. الأسلوب المفضل حاليًا هو **A-Paper**: خريطة حقيقية مرسومة بالحبر على ورق، تتحرك عليها الكاميرا، وصور أرشيفية مطبوعة.

---

## 0. الأدوات والإعداد (مرة واحدة)

```bash
cd remotion
npm ci                                   # Remotion 4.0.242 + d3-geo + world-atlas
pip install -r requirements.txt          # faster-whisper, pillow, numpy, yt-dlp
tools/sfx.sh public/sfx                  # يولّد مكتبة المؤثرات (موجودة أصلًا)
python3 tools/make_textures.py public/paper   # ملمس الورق والفلين (موجود أصلًا)
```

في بيئة السحابة: Chromium مثبّت مسبقًا، فمرّر للرندر:
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`

---

## 1. البحث في المراجع (اختياري لكل موضوع جديد)

```bash
yt-dlp --flat-playlist --print "%(id)s|%(view_count)s|%(title)s" "https://www.youtube.com/@maplore568/shorts"
yt-dlp --skip-download --write-auto-subs --sub-langs en-orig --sub-format vtt -o "subs/%(id)s" https://www.youtube.com/shorts/<id>
```
ابحث عن: أول جملة (الهوك)، أين تُغلق الحلقة المفتوحة، المدة، نوع الصيغة (كسر خرافة / "لماذا…؟").

## 2. السكريبت (قواعد ثابتة — انظر `shorts-style-guide.md` §2)
- إنجليزي (القناة عالمية). موضوع WW2 محدد يعرفه الناس بشكل، والحقيقة شيء آخر.
- **أول 3 ثوانٍ "كارثية"**: كسر خرافة مباشر. مثال: *Hollywood lied to you. Alan Turing did NOT break Enigma first.*
- جمل قصيرة، مسار بين أماكن، آخر جملة ترجع لأول فكرة.
- كل معلومة تُتحقق منها وتُكتب في قسم "Fact notes" في `shorts/<n>/script.md`.
- يُسلَّم للمستخدم **ككتلة نص واحدة** في code block بدون أقواس أو توقيتات.

## 3. الصوت → توقيت كل كلمة
```bash
cp <recording>.wav remotion/public/<slug>/vo.wav
python3 tools/transcribe.py public/<slug>/vo.wav > src/shorts/<slug>/words.json
```
**كل توقيت في المونتاج يُؤخذ من words.json** (لا تقدير). مثال: الكلمة "NOT" عند 2.6ث → الصليب الأحمر يبدأ 2.55ث.

## 4. المواد
- **الخريطة:** Natural Earth (`world-atlas` 50m/10m) + **حدود السنة الحقيقية** من aourednik/historical-basemaps عبر `python3 tools/prepare_borders.py <year> <w> <s> <e> <n> <out.json>`. لا أشكال مرسومة باليد أبدًا.
- **الصور الأرشيفية:** `python3 tools/fetch_art.py public/<slug>/art "name=search terms" ...` — يحفظ الرخصة في `credits.json`. CC BY-SA تُذكر في الوصف.
- **الخطوط:** Special Elite (آلة كاتبة)، Caveat (خط يد)، Playfair (عناوين)، Inter (الأسلوب الداكن) — كلها OFL/Apache في `public/fonts`.

## 5. بناء المشاهد (الأسلوب A-Paper)
انسخ `src/shorts/enigma/Enigma.tsx` كقالب وسجّل `<Comp theme="paper" />` في `Root.tsx`.

### 5.1 نظام الأحزمة (إلزامي)
| الحزام | y | المحتوى |
|---|---|---|
| UI يوتيوب | 0–220 | فارغ |
| كلمة (نادرًا) | 250–400 | لا نستخدمها حاليًا — المستخدم فضّل بدون كلمات كبيرة |
| البطاقات | 440–960 | صور فقط في خانات `SLOT` ثابتة: center / left+right / trioL+trioC+trioR |
| الخريطة | 1000–1450 | نقطة تركيز الكاميرا (`LAYOUT.focusY = 1200`) والملصقات |
| UI يوتيوب | 1480–1920 | خريطة فقط |
- يمين x>930 محجوز (أزرار يوتيوب) — ملصقات الأماكن تنقلب تلقائيًا.

### 5.2 الكاميرا
`CAMERA: CamKey[]` = `{t, c: [lon, lat], z}`. الزووم يُستوفى لوغاريتميًا (حركة متجانسة). قاعدة: كل مشهد = نقطتان (دخول + زحف بطيء)، والانتقال 0.8–1.2ث بين الأماكن.

### 5.3 العناصر (من `src/lib/overlays.tsx`)
| العنصر | متى نستخدمه |
|---|---|
| `Country` | رسم حدود دولة تدريجيًا + تظليل (أبيض/أحمر عند الغزو/ذهبي في النهاية) |
| `Pin` | مكان + ملصق آلة كاتبة (بدون إحداثيات) |
| `Route` | مسار متقطع بين أماكن (تسليم، هروب) |
| `Arrow` | أسهم عسكرية حمراء — فقط لحركات حقيقية |
| `Signal` | إشارات راديو بين مدينتين |
| `PhotoCard` | صورة مطبوعة في خانة + خط منقط للمكان؛ `cross` للصليب الأحمر، `gray` للتلاشي، `glow` = إطار نحاسي |
| `Wiring` | رسم توضيحي (يُوسم Reconstruction في الأسلوب الورقي) |

### 5.4 الألوان
اللوحة الأرشيفية فقط (`docs/paper-documentary-master-prompt.md` §2.2). **بدون توهج نهائيًا.** الأحمر #A43B32 للخطر/الغزو/الاكتشاف فقط.

### 5.5 الصوت
- `SfxTrack` بكسب عام 0.4 (المستخدم وجد المؤثرات عالية قبلها).
- ورق عند دخول بطاقة، دبوس/نقرة عند ظهور مكان، آلة كاتبة مع النص، طقطقة دوّار للآلات، `impact` فقط على 3–4 اكتشافات كبرى.
- **صمت مقصود** حول أقوى لحظة ("War is coming"، "Silent.").

## 6. المراجعة قبل الرندر الكامل
```bash
npx remotion still <Comp> out/s.png --frame=<f> --browser-executable=...
```
ارسم 10–20 فريمًا على اللحظات المفتاحية واجمعها في contact sheet (PIL). افحص:
- الفريم الأول فيه العنصر الرئيسي كاملًا.
- لا نص مقصوص، لا صورة فوق نص، لا تداخل ملصقات.
- لا خطوط/أسهم تبقى بعد مشهدها.
- لا خيوط/عناصر فوق الوجوه.

## 7. الرندر والإخراج
```bash
npx remotion render <Comp> out/<slug>.mp4 --browser-executable=... --concurrency=4
tools/master.sh out/<slug>.mp4 out/<slug>-final.mp4     # -14 LUFS لليوتيوب
cp out/<slug>-final.mp4 ../shorts/<n>-<slug>/
```
~10–40 دقيقة لكل 75ث حسب الأسلوب. تحقق: المدة، `ebur128` ≈ -14 LUFS، شبكة فريمات من الفيديو النهائي.

## 8. النشر
- العنوان + الوصف + الإسنادات في `shorts/<n>/description.md`.
- بعد 48 ساعة: سجّل Viewed vs Swiped ومتوسط % المشاهدة في `docs/shorts-learnings.md`.

---

## ملفات المرجع
- `docs/shorts-style-guide.md` — قواعد السكريبت والمونتاج والأحزمة والأساليب.
- `docs/shorts-learnings.md` — قرارات المستخدم بالترتيب ونتائج كل شورت.
- `docs/paper-documentary-master-prompt.md` — البرومت الكامل للأسلوب الورقي، و`paper-documentary-applying.md` لتطبيقه على الشورتس.
- `.claude/skills/make-short/SKILL.md` — نفس الطريقة كـ Skill يستدعيه Claude تلقائيًا.
