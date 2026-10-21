# Victor Melbye Staven — personal research website

A custom Astro academic portfolio with a Three.js Shadow Hand workbench, research project pages, publications with BibTeX, and a printable CV. Static output works on GitHub Pages; no Python server is needed.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:4321. `npm run build` runs type checks and produces `dist/`; `npm run preview` serves that production build.

## Edit content

Only include publicly released research. Unpublished project descriptions and lab media should remain off the website until explicitly approved for inclusion.

- `src/data/profile.ts`: biography, affiliation, contact links, research topics, publications, and optional PDF CV path.
- `src/pages/cv.astro`: appointments and project history. Education has been omitted until verified.
- `src/pages/research/[slug].astro`: research detail layout.
- `src/scripts/robot-scene.ts`: Shadow Hand kinematic illustration of object rotation, inspired by the published IROS paper. It supports orbit, playback, scrubbing, contact-point and target toggles, reset, reduced motion, and a WebGL fallback. It is illustrative geometry, not a force simulation or experimental replay.
- `src/styles/global.css`: responsive styles and print layout.

Only populated social links and CV download paths render. To add a PDF, put it at `public/cv.pdf` and set `profile.cv` to `cv.pdf`. The print button can already save the profile as a PDF.

## Deployment

The included workflow builds and deploys pushes to `main`. In GitHub repository **Settings → Pages**, select **GitHub Actions** as the source. Push this repository to trigger deployment. The expected address is https://vmstavens.github.io/victor-staven/.

The workflow defaults to `SITE_URL=https://vmstavens.github.io` and `BASE_PATH=/victor-staven`. For a custom domain or username site, set the repository variables `SITE_URL` to the origin and `BASE_PATH` to `/`. Local development defaults to `/`.

Verify a project-path build locally:

```sh
BASE_PATH=/victor-staven npm run build
BASE_PATH=/victor-staven npm run preview
```

## Browser checks

```sh
npm test
```

Tests use Google Chrome at `/usr/bin/google-chrome`. Set `CHROME_PATH` if it is installed elsewhere. Tests cover navigation, citations, scene controls, reduced motion, WebGL fallback, and mobile overflow.

## Content sources

Content was checked against:

- [SDU researcher profile](https://portal.findresearcher.sdu.dk/en/persons/vims/) — affiliation, PhD project, supervisor, ORCID, and SPATAIS participation.
- [IROS paper on arXiv](https://arxiv.org/abs/2503.08222) — paper metadata, published status, and demonstration video.
- [ICCMA paper at SDU](https://portal.findresearcher.sdu.dk/en/publications/sim-to-real-transfer-for-cable-manipulation-with-tactile-sensing-/) — publication and DOI.

The user-provided [Google Scholar profile](https://scholar.google.com/citations?user=5VnMGoEAAAAJ&hl=en) is linked, but could not be fetched during implementation. No degree history or publication metrics were inferred.

Design direction was informed by evaluating [as-folio](https://github.com/dadangnh/as-folio) and [Academic Pages](https://academicpages.github.io/). This implementation is original and does not copy either template's code. Fonts are served by Google Fonts, with system fallbacks.

## Selected projects and portrait

`src/data/projects.ts` holds the four curated public projects. Selection favors a concrete implementation, useful documentation, and relevance to research or engineering. Repository documentation and model commit history were reviewed; no claim is made that the external projects were installed or independently tested.

- [mjsim](https://github.com/vmstavens/mjsim): reusable simulation utilities, examples, and tests.
- [BioTac simulation](https://github.com/vmstavens/biotac_sim_plugin): tactile simulation plugin and demo; the site acknowledges its TAMS foundation.
- [Hand-E model](https://github.com/vmstavens/mujoco_menagerie_hande/tree/main/robotiq_hande): Victor's specific addition to a Menagerie fork, not authorship of the upstream collection.
- [Thesis toolkit](https://github.com/vmstavens/thesis-template): reusable technical-writing and figure utilities.

The portrait source is the public [GitHub avatar](https://github.com/vmstavens.png). The generated master is `src/assets/victor-portrait.png`; Astro creates optimized WebP variants for the site. It was generated using the built-in imagegen tool with this prompt:

> Create a square Ghibli-inspired hand-painted cartoon portrait of the man in the most recent image (his GitHub headshot). Preserve his recognizable face, short spiky brown hair, rectangular dark glasses, warm open smile and navy collared shirt. Gentle pencil contours, soft gouache shading, natural adult proportions, subtly textured paper and warm daylight. Head and shoulders looking at the viewer, with comfortable space above his hair. Quiet ivory and sage-green background with very subtle leafy shapes; muted deep teal and warm copper notes to harmonize with his personal academic website. Friendly, thoughtful, no exaggerated features. No text, no logos, no extra people or props, no black circular border. Full square canvas. Preserve the person's likeness from the headshot.

## Citation and GitHub graphs

The homepage charts citations per paper from Google Scholar and current star counts for the four featured GitHub repositories. Counts are stored in `src/data/metrics.json`, with source links and the snapshot date shown on the page. Hand-E stars refer to Victor's fork, not the upstream repository. These charts show current counts, not historical growth.

To refresh both graphs with Node.js 22:

```sh
npm exec --yes --package=node@22 -- npm run metrics:update
```

The refresh validates the Scholar profile, paper list, citation total, and repository identities before replacing the snapshot. If either source is unavailable or the profile changes, the existing data is retained; review the error and update the paper list in `scripts/update-metrics.mjs` if necessary. Builds and page visits require no metrics API calls.

## Illustrated workbench design

The hero now places the interactive Shadow Hand manipulation illustration on an original Three.js workbench with a simulation monitor, tactile sensor, cable, notebook, and plant. The larger project previews are original SVG illustrations, not experiment results or screenshots. The design takes inspiration from the personal workspace and visual project presentation at https://david-hckh.com/ without copying its assets.

On mobile, a lightweight SVG workbench appears first; the 3D module loads only after selecting “Load 3D model”. Desktop loads the scene when it approaches the viewport. Reduced motion starts it paused, and unavailable WebGL keeps the illustrated fallback. Dragging changes the viewpoint, while normal scrolling continues over the scene. The controls still support playback, trajectory scrubbing, reset, contact points, and target orientation.

## Shadow Hand and workbench exploration

The hand uses actual Shadow Robot E3M5 visual meshes and joint transforms from [MuJoCo Menagerie](https://github.com/google-deepmind/mujoco_menagerie/tree/71f066ad0be9cd271f7ed58c030243ef157af9f4/shadow_hand). The local 664 KB GLB retains all five fingers; the forearm and wrist are omitted for desk mounting. The original Apache-2.0 license, source XML, and conversion notice are in `public/models/shadow-hand/`. Run `python3 scripts/build-shadow-hand.py` to reproduce the GLB from the pinned upstream commit.

`src/scripts/shadow-hand.ts` loads the model only when 3D is activated and uses joint-limited inverse kinematics for an illustrative thumb/index pinch. It is not a MuJoCo simulation or replay of the IROS experiment, and the standard Menagerie fingertips do not reproduce the paper's custom magnetic tactile sensors.

The hand, cable, and monitor are clickable in 3D. Numbered buttons offer the same explanations and links with a keyboard, touch, or the static fallback. Escape closes an explanation and restores focus. The contact invitation links directly to the public email address. No messages are sent by the website.

## Research area images

The research cards and detail pages use high-resolution technical renders in `src/assets/research/`, with responsive WebP versions produced by Astro. The cable-routing graphic is a native SVG schematic; the manipulation and simulation images use the licensed Menagerie Shadow Hand geometry. The latter shows solid and wireframe views of the same model. Captions distinguish these model visualizations from experimental results. Model attribution and Apache-2.0 terms are in `public/models/shadow-hand/NOTICE.txt` and `LICENSE`.

To reproduce the source images, start the local development server at port 4321 and run:

```sh
npm exec --yes --package=node@22 -- node scripts/render-research-images.mjs
```

The offline compositions are defined in `scripts/research-visuals.ts`. They render through Three.js and Playwright using Google Chrome; this renderer is not included in the website's runtime.

## Interactive cable

The workbench cable can be grabbed directly with a mouse, pulled over the table edge, and released. A lightweight position-based solver provides gravity, segment constraints, tabletop collisions, and a floor. It is an interactive illustration rather than a validated cable model; other desk props and cable self-collisions are not simulated. The solver sleeps when the cable settles and pauses offscreen.

On touch screens, enable **Move cable** to reserve gestures inside the scene for dragging; switch it off or reset to restore normal page scrolling. With that button focused, arrow keys move the cable, Page Up/Down changes its height, and Escape releases it. **Reset cable** restores its initial shape without changing the hand trajectory. The numbered cable hotspot continues to open the research description.

## Carbon and flame design revision

The local portfolio now uses carbon surfaces, flame-orange accents, straight navigation and controls, and a shared palette across charts and technical illustrations. CV printing retains a light background.

The cable research graphic is a native SVG schematic in `src/components/CableRoutingDiagram.astro`, showing tactile cable contact and a route around obstacles. It replaces the earlier fixture render. The Shadow Hand visualization uses a carbon background, neutral metal, and orange contact and object accents. Both graphics appear on the homepage and their research detail pages. To regenerate the hand visualization against the running dev server:

```sh
npm exec --yes --package=node@22 -- node scripts/render-research-images.mjs hand
```

Set `RENDER_BASE_URL` if the development server uses a port other than 4321. On Linux systems that have reached their file-watcher limit, start development with polling:

```sh
CHOKIDAR_USEPOLLING=true CHOKIDAR_INTERVAL=1000 npm exec --yes --package=node@22 -- npm run dev
```
