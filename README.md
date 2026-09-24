# Victor Melbye Staven — personal research website

A custom Astro academic portfolio with a Three.js in-hand manipulation illustration, research project pages, publications with BibTeX, and a printable CV. Static output works on GitHub Pages; no Python server is needed.

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
- `src/scripts/robot-scene.ts`: two-finger kinematic illustration of object rotation, inspired by the published IROS paper. It supports orbit, zoom, playback, scrubbing, contact-normal and target toggles, reset, reduced motion, and a WebGL fallback. It is illustrative geometry, not a force simulation or experimental replay.
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
