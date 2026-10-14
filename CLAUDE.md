# Lemon Advertising Agency — website

Copy of the Assem Darwish portfolio (`D:\My Website\website`), rebranded for "Lemon Agency".
- Colours from the logo: yellow `#f2c811` (`--a`), light yellow `#ffd84a` (`--t`), leaf green `#8cc63f` (`--g`), black. Text on yellow = `--on-a` (dark); accent text on light surfaces = `--ta` (deep yellow `#7a6100`). The rest of this file describes the original; red values there now map to these.
- Logo: `assets/media/lemon-logo.webp` (white ink, dark bg), `lemon-logo-dark.webp` (dark ink, day mode), `lemon-mark.webp` (the lemon "O", footer centre + favicons), source `lemon-logo-src.webp`. Intro shows the logo instead of the portrait; footer letters are L-E-M-O-N (`l4` = the lemon, class `keep`, never inverted).
- Contact email / WhatsApp / social links are still the owner's personal ones until the agency's are given.
- Hero photo: `assets/media/hero-lemon.webp` (Sheraton branch poster, owner's).
- Video editing section (WORK 03) and its service row were removed at the owner's request; work is now 4 sections (Social, AI, GIFs, Print). `renderEditing()` exits when `#stack` is missing; the `EDITING` array is a leftover.
- Music removed at the owner's request (nav control, `<audio>` and all music JS). The `.music` CSS and `assets/media/audio/` are leftovers.
- About > tools tiles (Photoshop, Illustrator, CapCut, AI Tools) removed at the owner's request; `.tool` CSS is a leftover.
- Footer lemon (`lemon-mark.webp`, 1020x1422) is a clean redraw, not a crop of the low-res logo.
- Preview: `python -m http.server 5174` (port 5174 so it doesn't clash with the portfolio).

---

Static site (no build step): `index.html`, `style.css`, `script.js`, `content.js`, `truck3d.js`.
Owner: Assem Darwish (عاصم درويش) — social media designer, AI video creator, video editor, GIFs, print.
The owner writes in Egyptian Arabic; reply in Egyptian Arabic.

## Run / preview
- `.claude/launch.json` → `python -m http.server 5173` (preview name: `portfolio`).
- Opening `index.html` by double-click (file://) works, but the local python server is slow for big files.
- After CSS/JS edits the browser caches hard: reload with `fetch(url,{cache:'reload'})` or `?v=N`.

## Brand
- Colors: `#941a1a` (brand red), `#141212` (bg), `#ffffff`. Light accent for text: `#e5484d`.
- Fonts: Archivo (display, wide/900), Plus Jakarta Sans (English UI). Arabic: Alexandria for titles (`--ar-display`), IBM Plex Sans Arabic for text (`--ar`) - replaced Cairo. All Arabic-only tuning lives in the "Arabic typography" block at the end of style.css (letter-spacing is forced to 0 in RTL because Arabic letters join; taller line-heights). The Arabic hero name is fitted to ~60% of the row width, not the full width.
- Logo: `assets/media/logo.webp` (white "Darwish" wordmark, already cropped).

## Page order (index.html)
Hero → Clients (logo wall) → About → Services (5) → WORK 01 Social → WORK 02 AI Videos (wheel) → WORK 03 Video Editing → WORK 04 GIFs → WORK 05 Print → Contact → Footer. (The testimonials section was removed at the owner's request; its CSS and the `TESTIMONIALS` array are leftovers.)
- Every section is a `.panel` (sticky "stacking cards" transition: next panel slides over, previous darkens via `--cover`).
- `.anchor` divs before panels are the nav targets. `.dwell` spacer after the wheel section = extra pinned time.
- English only: the Arabic switch was removed at the owner's request (the `data-ar` texts, `setLang('ar')` paths and the Arabic typography CSS are dormant leftovers; the intro greeting is the only Arabic left, on purpose).
- Day / night: `#theme` button in the nav sets `html[data-theme=light]` (saved in localStorage, applied by an inline script in <head>). Day mode only re-declares the colour variables (last block of style.css); it covers the WHOLE site (owner's request): hero (light veil = the spotlight canvas inverted), AI wheel, footer and intro included. Only the media viewers, the phone menu, the editing cards, logo cards and tool tiles re-declare the dark values, because they hold white artwork. `lightPanel()` in script.js tells the nav that every panel is light in day mode.

## Content — edit `content.js` only
Arrays: `SOCIAL`, `AI_VIDEOS`, `EDITING`, `GIFS`, `PRINT`, `TESTIMONIALS`. Empty arrays show "coming soon" tiles.
- PRINT item types: flat image `{id,...}`, book `{id, book:{pages, ratio}}` (flipbook, pages `assets/media/print/ID/pNN.webp` + `thumb/`), 3D model `{id, model:'truck', shots:N}`.
- TESTIMONIALS is unused now (section removed). If it ever returns: never invent quotes; ask the owner for real ones.

## Media pipeline — `optimize-media.ps1`
`.\optimize-media.ps1 <social|print|gifs|ai|editing> "<source file>" <id>` → writes optimized files into `assets/media/<type>/` and prints the line to paste into content.js.
- ffmpeg is installed via winget but NOT on PATH; the script finds it under `%LOCALAPPDATA%\Microsoft\WinGet\Packages`.
- Videos: `full/` (compressed, plays only in the viewer), `preview/` (4 s muted loop on hover), `poster/` (jpg).
- PowerShell 5.1 reads the .ps1 as ANSI → keep it ASCII (or UTF-8 with BOM).
- No PDF renderer on this machine: PDFs were rasterised in the browser with pdf.js and POSTed to a tiny local python upload server (scratchpad), then the server was stopped.

## Key behaviours (script.js)
- `driftRow()` — auto-scrolling, draggable infinite rows (clients logos, social designs). Clients section = text on one side + `.lwall`: a 3D-tilted wall (perspective + rotateX/Y/Z on `.lwall-in`) of three drifting rows of logo cards; each row holds all 16 logos starting at a different one. Its phone rules live at the END of style.css (they must come after the base rules). Rows are forced `direction:ltr` (wrap math is LTR).
- AI wheel — rotating ring of clips; geometry sized to fit one screen (`layoutWheel`).
- `openViewer()` lightbox (images/videos, next/prev). `openBook()` flipbook (page-flip from jsdelivr). `openShowcase()` 3D truck: `truck3d.js` is a classic script (window.mountTruck) using three.js r128 UMD from cdnjs — NOT an ES module, so it works on file://; there the textures come from `tex/textures.data.js` (data URLs).
- Hero bottom block: `.hero-row` (role line + one-sentence intro on one side, "view my work" + contact button on the other, hairline under it) is exactly as wide as the name - `fitHero()` publishes that width as `--nameW`; the final rules are the last hero block at the end of style.css.
- Hero: statues photo `assets/media/hero-statues.webp`, dark overlay + cursor spotlight (`#heroDark`, `heroTorch()`); name sits at the bottom so the face stays clear. `fitHero()` waits for the display font before measuring.
- Music: `assets/media/audio/theme.mp3` = "لحن 2" supplied by the owner (replaced the earlier YouTube track). Bump `?v=` in index.html when swapping it. Control lives in the nav; tries autoplay, otherwise starts on first click. Ducks under viewers.

- About > tools: four tiles only, white icons with a brand-red glow (Photoshop, Illustrator, CapCut, AI Tools) - the owner's actual toolset; icons are inline (text/SVG), white on purpose, not the coloured brand icons.

- Intro (`#loader`): the cut-out portrait (same polygon as the footer, own clip id `loadClip`), the greeting "منوّر ياعزيزى الفنان" (owner's exact wording, always Arabic) revealed word by word, then the loading bar. It stays at least ~3 s (`openSite` timer) so the greeting can finish. `logo-mark.webp` is now only the favicon source.

## Performance rules (keep these)
- Panels are sticky and stack, so an earlier panel never leaves the viewport geometrically. `fx()` therefore marks every panel that is fully covered by a later one (or still far below) with `.away` (`visibility:hidden`, CSS animations paused) and fires a `vis` event on it. Anything with a rAF loop or a playing video must check `shown(el)` and re-start from `onShown(el, fn)` (see driftRow, the wheel, GIFs, heroTorch) - IntersectionObserver alone is NOT enough here.
- Scroll effects write only when the value changed; the panel darkening is a real `<i class="cover">` element (opacity), `--inset` is a registered non-inherited property.
- Hero spotlight = one canvas painted once and moved with `transform` (no per-frame gradient repaint). No `backdrop-filter` anywhere (nav/modal use solid backgrounds).
- Video posters are lazy (`data-poster`, set by `posterIO`). `style.css`, `content.js`, `script.js` are loaded with `?v=N` in index.html - bump N on every change so visitors don't get a stale cached copy.
- Phones (<760px): the AI wheel uses a much larger radius (only the top arc shows); floating `.obj` shapes go behind the text at the edges.

## Leftovers / notes
- `hero-fx.js` is the WebGL "living photo" effect for the old swing hero image — no longer loaded (kept in case it's wanted again).
- `backup-v1/` = the first version of the site. Heavy originals live outside the site, in the sibling folder `..\website-originals` (the parent folder was `D:\درويش`; the owner is renaming it to `D:\My Website`, so never hard-code the parent's name).
- Footer bottom: two contact cards (`.fc`: email / WhatsApp, icon + label + value + arrow) and a closing bar (copyright · role line · back-to-top button); styles are in the last footer block of style.css.
- Footer: no logo/name block any more. Centre = `.orbit`: the owner's illustrated portrait (`assets/media/me-art.webp`, a 900x1000 crop of the artwork; original in website-originals) inside an inline SVG: the head is cut out with a hand-traced `#headClip` polygon + cream sticker outline, and the eyes are redrawn (flat cream + black pupil) so the pupils follow the pointer (`eyes()` at the end of script.js; all coordinates are in the 900x1000 image space, `data-rest` = resting gaze), with the 4 social chips around it (Instagram, Facebook, TikTok, YouTube - owner's real profiles; no Behance/LinkedIn). Below it `.letters`: the Darwish wordmark cut into 7 images (`assets/media/letters/l1-7.webp`), each nudges on hover (replaced the old geometric shapes row). About stats (5+ years, 150+ projects, 15+ brands) are placeholders.
- Git repo (branch `main`). Git installed via winget at `C:\Program Files\Git\cmd\git.exe` (may not be on PATH in old shells). `.gitignore` excludes `backup-v1/`, `.claude/`, unused hero-fx files. Zip snapshots also go to the sibling folder `..\website-backups\`.
- Hosting plan discussed: GitHub Pages (exclude `backup-v1/` and `.claude/`).
- WhatsApp: floating button (#waBtn, bottom-right, brand-red gradient - the owner did not want WhatsApp green) + footer link → wa.me/201040379430 (owner gave +2001040379430; the extra 0 after +20 was dropped). Prefilled message follows the site language. Hero name width leaves room for it on desktop.


